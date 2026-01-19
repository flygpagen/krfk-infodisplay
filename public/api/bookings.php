<?php
/**
 * PHP proxy for MyWebLog bookings using Main API v3.1
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
 */
function callMyWebLogAPI($qtype, $username, $authtoken, $postData = []) {
    $ch = curl_init('https://api.myweblog.se/api_main.php');
    
    // Include apiver in POST data as well as header for compatibility
    $postData['apiver'] = '3.1';
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
            'qtype: ' . $qtype,
            'username: ' . $username,
            'authtoken: ' . $authtoken,
            'apiver: 3.1',
        ],
        CURLOPT_TIMEOUT => 15,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['error' => $error];
    }
    
    if ($httpCode !== 200) {
        return ['error' => 'HTTP ' . $httpCode];
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'error' => 'Invalid JSON response',
            'raw_response' => substr($response, 0, 1000),
            'json_error' => json_last_error_msg()
        ];
    }
    
    // Check for MyWebLog API error format
    if (isset($data['Error']) && is_array($data['Error'])) {
        $errorMsg = $data['Error'][0]['Message'] ?? 'Unknown API error';
        return ['error' => $errorMsg];
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
    $aircraft = $booking['object_registration'] ?? $booking['registration'] ?? '';
    $pilot = $booking['pilot_name'] ?? $booking['member_name'] ?? '';
    $startTime = $booking['start_time'] ?? $booking['from_time'] ?? '';
    $endTime = $booking['end_time'] ?? $booking['to_time'] ?? '';
    $bookingType = $booking['booking_type'] ?? $booking['type'] ?? '';
    $remark = $booking['remark'] ?? $booking['comment'] ?? '';
    $bookingId = $booking['booking_id'] ?? $booking['id'] ?? uniqid();
    
    // Format time display
    $displayTime = 'Okänd';
    $startMinutes = null;
    $endMinutes = null;
    
    if ($startTime && $endTime) {
        // Extract HH:MM from datetime or time string
        $startParts = explode(' ', $startTime);
        $endParts = explode(' ', $endTime);
        $startTimeOnly = count($startParts) > 1 ? $startParts[1] : $startParts[0];
        $endTimeOnly = count($endParts) > 1 ? $endParts[1] : $endParts[0];
        
        // Get HH:MM format
        $startHM = substr($startTimeOnly, 0, 5);
        $endHM = substr($endTimeOnly, 0, 5);
        $displayTime = $startHM . '-' . $endHM;
        
        // Calculate minutes for status
        $startParsed = explode(':', $startHM);
        $endParsed = explode(':', $endHM);
        if (count($startParsed) >= 2 && count($endParsed) >= 2) {
            $startMinutes = (int)$startParsed[0] * 60 + (int)$startParsed[1];
            $endMinutes = (int)$endParsed[0] * 60 + (int)$endParsed[1];
        }
    }
    
    // Determine status
    $status = 'upcoming';
    
    // Check if aircraft is in maintenance
    if (isset($maintenanceObjects[$aircraft])) {
        $status = $maintenanceObjects[$aircraft];
    }
    // Check for maintenance keywords in remark or type
    elseif (preg_match('/maintenance|underhåll|kontroll|service/i', $remark . ' ' . $bookingType)) {
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
        'remark' => $remark ?: $bookingType,
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
