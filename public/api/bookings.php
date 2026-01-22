<?php
/**
 * PHP proxy for MyWebLog bookings using Main API
 * Fetches booking data and returns structured JSON
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, must-revalidate');

// Load API credentials from config
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// Get credentials from config or environment
$username = defined('MYWEBLOG_USERNAME') ? MYWEBLOG_USERNAME : getenv('MYWEBLOG_USERNAME');
$authtoken = defined('MYWEBLOG_AUTHTOKEN') ? MYWEBLOG_AUTHTOKEN : getenv('MYWEBLOG_AUTHTOKEN');

if (empty($username) || empty($authtoken)) {
    http_response_code(500);
    echo json_encode(['error' => 'MyWebLog API credentials not configured. Add MYWEBLOG_USERNAME and MYWEBLOG_AUTHTOKEN to config.php']);
    exit;
}

/**
 * Make API call to MyWebLog Main API
 * According to docs: only qtype, username, authtoken headers required
 */
function callMyWebLogAPI($qtype, $username, $authtoken, $postData = []) {
    $ch = curl_init('https://api.myweblog.se/api_main.php');
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_HTTPHEADER => [
            'qtype: ' . $qtype,
            'username: ' . $username,
            'authtoken: ' . $authtoken,
            'version: 3.1',
        ],
        CURLOPT_TIMEOUT => 15,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['error' => 'cURL error: ' . $error];
    }
    
    if ($httpCode !== 200) {
        return ['error' => 'HTTP ' . $httpCode];
    }
    
    // Check if response is XML (error response)
    if (strpos($response, '<?xml') === 0) {
        $xml = @simplexml_load_string($response);
        if ($xml && isset($xml->Error)) {
            $errorCode = (string)($xml->Error->ErrorCode ?? 'Unknown');
            $errorMsg = (string)($xml->Error->Message ?? 'Unknown error');
            return ['error' => "API Error $errorCode: $errorMsg"];
        }
        return ['error' => 'Unexpected XML response', 'raw_response' => substr($response, 0, 500)];
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'error' => 'Invalid JSON response',
            'raw_response' => substr($response, 0, 1000),
            'json_error' => json_last_error_msg()
        ];
    }
    
    // Check for MyWebLog API error format in JSON
    if (isset($data['Error']) && is_array($data['Error'])) {
        $errorMsg = $data['Error'][0]['Message'] ?? 'Unknown API error';
        return ['error' => $errorMsg];
    }
    
    // The API returns data under {qtype}Result key according to docs
    $resultKey = $qtype . 'Result';
    if (isset($data[$resultKey])) {
        return $data[$resultKey];
    }
    
    return $data;
}

// Get today's date
$today = date('Y-m-d');

// Fetch bookings for today
$bookingsData = callMyWebLogAPI('getBookings', $username, $authtoken, [
    'from_date' => $today,
    'to_date' => $today,
]);

// Fetch object status for maintenance info
$objectStatusData = callMyWebLogAPI('getObjectStatus', $username, $authtoken, []);

// Check for errors
if (isset($bookingsData['error'])) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Failed to fetch bookings: ' . $bookingsData['error'],
        'debug' => [
            'raw_response' => $bookingsData['raw_response'] ?? null,
            'json_error' => $bookingsData['json_error'] ?? null,
            'username' => substr($username, 0, 4) . '***'
        ]
    ]);
    exit;
}

// Build maintenance status map from objectStatus
$maintenanceObjects = [];
if (isset($objectStatusData['status']) && $objectStatusData['status'] === 'ok' && isset($objectStatusData['response'])) {
    foreach ($objectStatusData['response'] as $obj) {
        // status 2 = red/maintenance, status 1 = yellow/limited
        if (isset($obj['status']) && ($obj['status'] == 2 || $obj['status'] == 1)) {
            $reg = $obj['registration'] ?? '';
            if ($reg) {
                $maintenanceObjects[$reg] = $obj['status'] == 2 ? 'maintenance' : 'reserved';
            }
        }
    }
}

// Process bookings
$bookings = [];
$now = new DateTime('now', new DateTimeZone('Europe/Stockholm'));
$currentMinutes = (int)$now->format('H') * 60 + (int)$now->format('i');

// Combine active and queue bookings
$allBookings = [];

if (isset($bookingsData['activeBookings']) && is_array($bookingsData['activeBookings'])) {
    foreach ($bookingsData['activeBookings'] as $booking) {
        $booking['_source'] = 'active';
        $allBookings[] = $booking;
    }
}

if (isset($bookingsData['queueBookings']) && is_array($bookingsData['queueBookings'])) {
    foreach ($bookingsData['queueBookings'] as $booking) {
        $booking['_source'] = 'queue';
        $allBookings[] = $booking;
    }
}

foreach ($allBookings as $booking) {
    $aircraft = $booking['regnr'] ?? '';
    
    // Filter: Only include aircraft (Swedish registration format SE-XXX)
    if (!preg_match('/^SE-[A-Z]{3}$/', $aircraft)) {
        continue;
    }
    
    $pilot = $booking['userFullname'] ?? $booking['studentFullname'] ?? '';
    $startTime = $booking['bStart'] ?? $booking['bStartDT'] ?? '';
    $endTime = $booking['bEnd'] ?? $booking['bEndDT'] ?? '';
    $bookingType = $booking['bookingType'] ?? '';
    $remark = $booking['comments'] ?? '';
    $bookingId = $booking['bookingID'] ?? uniqid();
    
    // Format time display
    $displayTime = 'Okänd';
    $startMinutes = null;
    $endMinutes = null;
    
    if ($startTime && $endTime) {
        // Parse dates to check if multi-day booking
        $startDate = date('Y-m-d', strtotime($startTime));
        $endDate = date('Y-m-d', strtotime($endTime));
        
        if ($startDate !== $endDate) {
            // Multi-day booking - show as "Heldag"
            $displayTime = 'Heldag';
            $startMinutes = 0;
            $endMinutes = 24 * 60; // Entire day
        } else {
            // Same-day booking - extract HH:MM
            $startHM = date('H:i', strtotime($startTime));
            $endHM = date('H:i', strtotime($endTime));
            $displayTime = $startHM . '-' . $endHM;
            
            // Calculate minutes for status
            $startMinutes = (int)date('H', strtotime($startTime)) * 60 + (int)date('i', strtotime($startTime));
            $endMinutes = (int)date('H', strtotime($endTime)) * 60 + (int)date('i', strtotime($endTime));
        }
    }
    
    // Determine status
    $status = 'upcoming';
    
    // Check if aircraft is in maintenance
    if (isset($maintenanceObjects[$aircraft])) {
        $status = $maintenanceObjects[$aircraft];
    }
    // Check for maintenance keywords in remark or type
    elseif (preg_match('/maintenance|underhåll|kontroll|service|MAINT/i', $remark . ' ' . $bookingType)) {
        $status = 'maintenance';
    }
    // Check for reserved keywords
    elseif (preg_match('/reserved|reserverad/i', $bookingType)) {
        $status = 'reserved';
    }
    // Calculate time-based status
    elseif ($startMinutes !== null && $endMinutes !== null) {
        if ($currentMinutes >= $endMinutes) {
            $status = 'completed';
        } elseif ($currentMinutes >= $startMinutes && $currentMinutes < $endMinutes) {
            $status = 'active';
        }
    }
    
    $bookings[] = [
        'id' => (string)$bookingId,
        'time' => $displayTime,
        'aircraft' => $aircraft,
        'pilot' => $pilot,
        'status' => $status,
    ];
}

// Sort by time
usort($bookings, function($a, $b) {
    return strcmp($a['time'], $b['time']);
});

echo json_encode([
    'bookings' => $bookings,
    'fetchedAt' => date('c'),
    'count' => count($bookings),
]);
