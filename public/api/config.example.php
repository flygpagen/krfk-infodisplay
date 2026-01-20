<?php
/**
 * Configuration file for API keys and location settings
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to config.php
 * 2. Replace the placeholders with your actual values
 * 3. Make sure config.php is NOT committed to version control
 */

// CheckWX API key for weather data
define('CHECKWX_API_KEY', 'your-checkwx-api-key-here');

// MyWebLog API credentials (get from ADMIN > Integration/API)
define('MYWEBLOG_USERNAME', 'your-myweblog-username-here');
define('MYWEBLOG_AUTHTOKEN', 'your-myweblog-authtoken-here');

// Airport/Location settings
define('ICAO_CODE', 'ESMK');                      // ICAO code for weather data
define('LOCATION_LAT', 55.92);                    // Latitude for sun calculations
define('LOCATION_LON', 14.08);                    // Longitude for sun calculations
define('LOCATION_TIMEZONE', 'Europe/Stockholm');  // Timezone for display
