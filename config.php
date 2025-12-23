<?php
// config.php - Updated with Debug Mode
session_start();

// Enable ALL errors for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

// Database configuration
$host = 'localhost';
$dbname = 'scholarship_portal';
$username = 'root';
$password = '';

// Create connection
$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    $error = [
        'success' => false,
        'message' => 'Database connection failed',
        'error' => $conn->connect_error,
        'details' => [
            'host' => $host,
            'database' => $dbname,
            'username' => $username
        ]
    ];
    
    // For API requests, return JSON
    if (isset($_GET['action']) || isset($_POST['action'])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode($error);
    } else {
        // For direct access, show HTML error
        echo "<h2>Database Connection Error</h2>";
        echo "<p><strong>Error:</strong> " . $conn->connect_error . "</p>";
        echo "<p><strong>Details:</strong> ";
        echo "Host: $host, Database: $dbname, Username: $username";
        echo "</p>";
    }
    exit();
}

// Set charset
$conn->set_charset("utf8mb4");

// Helper functions
function sanitizeInput($data) {
    if ($data === null) return '';
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(stripslashes(trim($data)));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function sendResponse($success, $message, $data = [], $debug = null) {
    header('Content-Type: application/json');
    
    $response = [
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Add debug info if provided
    if ($debug !== null) {
        $response['debug'] = $debug;
    }
    
    http_response_code($success ? 200 : 400);
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit();
}

// Authentication helper functions
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Authentication required. Please login.');
    }
    return $_SESSION['user_id'];
}

function requireAdmin() {
    $userId = requireAuth();
    global $conn;
    
    $stmt = $conn->prepare("SELECT id, role FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(false, 'User not found in database');
    }
    
    $user = $result->fetch_assoc();
    
    if ($user['role'] !== 'admin') {
        sendResponse(false, 'Admin access required. Your role is: ' . $user['role']);
    }
    
    return $user['id'];
}

function getCurrentUser() {
    $userId = getCurrentUserId();
    if (!$userId) return null;
    
    global $conn;
    $stmt = $conn->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->fetch_assoc();
}

// Check if database has required tables
function checkDatabaseHealth() {
    global $conn;
    
    $requiredTables = ['users', 'scholarships', 'applications', 'contacts', 'student_profiles'];
    $status = [];
    
    foreach ($requiredTables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        $status[$table] = $result->num_rows > 0;
    }
    
    return $status;
}
?>