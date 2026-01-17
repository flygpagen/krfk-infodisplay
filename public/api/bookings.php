<?php
/**
 * PHP proxy for MyWebLog bookings
 * Fetches booking data and returns structured JSON
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

// Parse the document.writeln statements to extract table rows
$bookings = [];

// Match all document.writeln statements containing table rows
preg_match_all('/document\.writeln\s*\(\s*["\'](.+?)["\']\s*\)/s', $response, $matches);

foreach ($matches[1] as $line) {
    // Skip header rows and empty lines
    if (strpos($line, '<th') !== false || strpos($line, '<tr') === false) {
        continue;
    }
    
    // Extract table cells - handle both <td> and <td class="...">
    preg_match_all('/<td[^>]*>([^<]*)<\/td>/i', $line, $cells);
    
    if (count($cells[1]) >= 4) {
        $time = trim($cells[1][0]);
        $aircraft = trim($cells[1][1]);
        $pilot = trim($cells[1][2]);
        $remark = isset($cells[1][3]) ? trim($cells[1][3]) : '';
        
        // Skip empty rows
        if (empty($time) && empty($aircraft)) {
            continue;
        }
        
        // Calculate status based on current time
        $status = 'upcoming';
        $now = new DateTime('now', new DateTimeZone('Europe/Stockholm'));
        $currentHour = (int)$now->format('H');
        $currentMinute = (int)$now->format('i');
        $currentMinutes = $currentHour * 60 + $currentMinute;
        
        // Parse time range (e.g., "09:00-11:00" or "09:00 - 11:00")
        if (preg_match('/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/', $time, $timeMatch)) {
            $startMinutes = (int)$timeMatch[1] * 60 + (int)$timeMatch[2];
            $endMinutes = (int)$timeMatch[3] * 60 + (int)$timeMatch[4];
            
            if ($currentMinutes >= $endMinutes) {
                $status = 'completed';
            } elseif ($currentMinutes >= $startMinutes && $currentMinutes < $endMinutes) {
                $status = 'active';
            }
        }
        
        // Check for maintenance keywords
        $remarkLower = strtolower($remark);
        if (strpos($remarkLower, 'underhåll') !== false || 
            strpos($remarkLower, 'kontroll') !== false ||
            strpos($remarkLower, 'service') !== false ||
            strpos($remarkLower, 'maintenance') !== false) {
            $status = 'maintenance';
        }
        
        $bookings[] = [
            'id' => uniqid(),
            'time' => $time,
            'aircraft' => $aircraft,
            'pilot' => $pilot,
            'remark' => $remark,
            'status' => $status
        ];
    }
}

echo json_encode([
    'bookings' => $bookings,
    'fetchedAt' => date('c'),
    'count' => count($bookings)
]);
