<?php
/**
 * PHP proxy for MyWebLog bookings
 * Fetches booking data and returns structured JSON
 * Parses Markdown-style table format from infoscreen.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, must-revalidate');

// MyWebLog URL
$url = 'https://www.myweblog.se/infoscreen.php?cid=23&auth=6de3f15f2294dc84421f3270c0aea564';

// Fetch the data
$response = file_get_contents($url);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch booking data']);
    exit;
}

// Parse the Markdown-style table format
// Format: | Time | Aircraft | Pilot | Booking Type | Remark |
$bookings = [];

// Match pipe-separated table rows
preg_match_all('/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/m', $response, $matches, PREG_SET_ORDER);

foreach ($matches as $match) {
    $time = trim($match[1]);
    $aircraft = trim($match[2]);
    $pilot = trim($match[3]);
    $bookingType = trim($match[4]);
    $remark = trim($match[5]);
    
    // Clean up escape characters
    $time = str_replace('\\-', '-', $time);
    $bookingType = str_replace('\\-', '-', $bookingType);
    $remark = str_replace('\\-', '-', $remark);
    
    // Skip header rows and separator rows
    if ($time === 'Tid' || $time === 'Time' || 
        strpos($time, '---') !== false || 
        strpos($time, ':--') !== false ||
        $aircraft === 'Reg' || $aircraft === 'Aircraft') {
        continue;
    }
    
    // Calculate status
    $status = 'upcoming';
    $now = new DateTime('now', new DateTimeZone('Europe/Stockholm'));
    $currentHour = (int)$now->format('H');
    $currentMinute = (int)$now->format('i');
    $currentMinutes = $currentHour * 60 + $currentMinute;
    
    // Handle all-day bookings (N/A time or "ALL DAY" in booking type)
    $isAllDay = ($time === 'N/A' || stripos($bookingType, 'ALL DAY') !== false);
    
    if ($isAllDay) {
        $displayTime = 'Heldag';
    } else {
        $displayTime = $time;
    }
    
    // Check for maintenance/service keywords
    $remarkLower = strtolower($remark);
    $bookingTypeLower = strtolower($bookingType);
    
    if (strpos($remarkLower, 'maintenance') !== false || 
        strpos($remarkLower, 'underhåll') !== false ||
        strpos($remarkLower, 'kontroll') !== false ||
        strpos($remarkLower, 'service') !== false ||
        strpos($bookingTypeLower, 'maintenance') !== false) {
        $status = 'maintenance';
    } elseif (strpos($bookingTypeLower, 'reserved') !== false ||
              strpos($bookingTypeLower, 'reserverad') !== false) {
        $status = 'reserved';
    } elseif (!$isAllDay) {
        // Parse time range for regular bookings (e.g., "09:00-11:00" or "09:00 - 11:00")
        if (preg_match('/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/', $time, $timeMatch)) {
            $startMinutes = (int)$timeMatch[1] * 60 + (int)$timeMatch[2];
            $endMinutes = (int)$timeMatch[3] * 60 + (int)$timeMatch[4];
            
            if ($currentMinutes >= $endMinutes) {
                $status = 'completed';
            } elseif ($currentMinutes >= $startMinutes && $currentMinutes < $endMinutes) {
                $status = 'active';
            }
        }
    }
    
    $bookings[] = [
        'id' => uniqid(),
        'time' => $displayTime,
        'aircraft' => $aircraft,
        'pilot' => $pilot,
        'remark' => $remark ?: $bookingType,
        'status' => $status
    ];
}

echo json_encode([
    'bookings' => $bookings,
    'fetchedAt' => date('c'),
    'count' => count($bookings)
]);
