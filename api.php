<?php
// api.php - Complete Working Backend
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

// Database Configuration
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'scholarship_portal';

// Connect to Database
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");

// Get request data
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? '';

// Helper function
function sendResponse($success, $message = '', $data = []) {
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}

// ==================== LOGIN ====================
if ($action === 'login') {
    $email = $conn->real_escape_string($input['email'] ?? '');
    $password = $conn->real_escape_string($input['password'] ?? '');
    
    if (!$email || !$password) {
        sendResponse(false, 'Email and password are required');
    }
    
    $stmt = $conn->prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(false, 'Invalid credentials');
    }
    
    $user = $result->fetch_assoc();
    
    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['email'] = $user['email'];
    
    sendResponse(true, 'Login successful', ['user' => $user]);
}

// ==================== REGISTER ====================
if ($action === 'register') {
    $name = $conn->real_escape_string($input['name'] ?? '');
    $email = $conn->real_escape_string($input['email'] ?? '');
    $password = $conn->real_escape_string($input['password'] ?? '');
    $role = $conn->real_escape_string($input['role'] ?? 'student');
    
    if (!$name || !$email || !$password) {
        sendResponse(false, 'All fields are required');
    }
    
    // Check if email exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        sendResponse(false, 'Email already registered');
    }
    
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $password, $role);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Registration successful!');
    } else {
        sendResponse(false, 'Registration failed');
    }
}

// ==================== GET ALL SCHOLARSHIPS ====================
if ($action === 'getAllScholarships') {
    $query = "SELECT s.*, u.name as admin_name, COUNT(a.id) as applications_count 
              FROM scholarships s 
              LEFT JOIN users u ON s.admin_id = u.id 
              LEFT JOIN applications a ON s.id = a.scholarship_id 
              WHERE s.status = 'active' AND s.deadline >= CURDATE()
              GROUP BY s.id 
              ORDER BY s.created_at DESC";
    
    $result = $conn->query($query);
    $scholarships = [];
    
    while ($row = $result->fetch_assoc()) {
        $scholarships[] = $row;
    }
    
    sendResponse(true, '', ['scholarships' => $scholarships]);
}

// ==================== GET MY SCHOLARSHIPS (ADMIN) ====================
if ($action === 'getMyScholarships') {
    $query = "SELECT s.*, COUNT(a.id) as applications_count 
              FROM scholarships s 
              LEFT JOIN applications a ON s.id = a.scholarship_id 
              GROUP BY s.id 
              ORDER BY s.created_at DESC";
    
    $result = $conn->query($query);
    $scholarships = [];
    
    while ($row = $result->fetch_assoc()) {
        $scholarships[] = $row;
    }
    
    sendResponse(true, '', ['scholarships' => $scholarships]);
}

// ==================== CREATE SCHOLARSHIP ====================
if ($action === 'createScholarship') {
    $title = $conn->real_escape_string($input['title'] ?? '');
    $description = $conn->real_escape_string($input['description'] ?? '');
    $type = $conn->real_escape_string($input['scholarship_type'] ?? 'Government');
    $eligibility = $conn->real_escape_string($input['eligibility'] ?? '');
    $deadline = $conn->real_escape_string($input['deadline'] ?? '');
    $amount = floatval($input['amount'] ?? 0);
    $status = $conn->real_escape_string($input['status'] ?? 'active');
    $adminId = 1;
    
    if (!$title || !$eligibility || !$deadline || !$amount) {
        sendResponse(false, 'All required fields must be filled');
    }
    
    $stmt = $conn->prepare("INSERT INTO scholarships (admin_id, title, description, scholarship_type, eligibility, deadline, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssssds", $adminId, $title, $description, $type, $eligibility, $deadline, $amount, $status);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Scholarship created successfully!', ['id' => $conn->insert_id]);
    } else {
        sendResponse(false, 'Failed to create scholarship');
    }
}

// ==================== UPDATE SCHOLARSHIP ====================
if ($action === 'updateScholarship') {
    $id = intval($input['id'] ?? 0);
    $title = $conn->real_escape_string($input['title'] ?? '');
    $description = $conn->real_escape_string($input['description'] ?? '');
    $type = $conn->real_escape_string($input['scholarship_type'] ?? '');
    $eligibility = $conn->real_escape_string($input['eligibility'] ?? '');
    $deadline = $conn->real_escape_string($input['deadline'] ?? '');
    $amount = floatval($input['amount'] ?? 0);
    $status = $conn->real_escape_string($input['status'] ?? 'active');
    
    $stmt = $conn->prepare("UPDATE scholarships SET title=?, description=?, scholarship_type=?, eligibility=?, deadline=?, amount=?, status=? WHERE id=?");
    $stmt->bind_param("sssssdsi", $title, $description, $type, $eligibility, $deadline, $amount, $status, $id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Scholarship updated successfully!');
    } else {
        sendResponse(false, 'Failed to update scholarship');
    }
}

// ==================== DELETE SCHOLARSHIP ====================
if ($action === 'deleteScholarship') {
    $id = intval($input['id'] ?? 0);
    
    $stmt = $conn->prepare("DELETE FROM scholarships WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Scholarship deleted successfully!');
    } else {
        sendResponse(false, 'Failed to delete scholarship');
    }
}

// ==================== APPLY FOR SCHOLARSHIP ====================
if ($action === 'applyScholarship') {
    $scholarshipId = intval($input['scholarship_id'] ?? 0);
    $message = $conn->real_escape_string($input['message'] ?? '');
    
    // Get student ID from session OR input
    $studentId = intval($_SESSION['user_id'] ?? $input['student_id'] ?? 0);
    
    if (!$scholarshipId || !$studentId) {
        sendResponse(false, 'Invalid data. Please make sure you are logged in.');
    }
    
    // Check if already applied
    $stmt = $conn->prepare("SELECT id FROM applications WHERE scholarship_id = ? AND student_id = ?");
    $stmt->bind_param("ii", $scholarshipId, $studentId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        sendResponse(false, 'You have already applied to this scholarship');
    }
    
    // Check if scholarship exists and is active
    $stmt = $conn->prepare("SELECT id FROM scholarships WHERE id = ? AND status = 'active' AND deadline >= CURDATE()");
    $stmt->bind_param("i", $scholarshipId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        sendResponse(false, 'Scholarship not available or deadline passed');
    }
    
    // Insert application
    $stmt = $conn->prepare("INSERT INTO applications (scholarship_id, student_id, message) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $scholarshipId, $studentId, $message);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Application submitted successfully!', ['application_id' => $conn->insert_id]);
    } else {
        sendResponse(false, 'Failed to submit application: ' . $stmt->error);
    }
}

// ==================== GET MY APPLICATIONS ====================
if ($action === 'getMyApplications') {
    // Get student ID from session OR input
    $studentId = intval($_SESSION['user_id'] ?? $input['student_id'] ?? 0);
    
    if (!$studentId) {
        sendResponse(false, 'Please login first');
    }
    
    $stmt = $conn->prepare("
        SELECT a.*, s.title, s.amount, s.scholarship_type, s.deadline
        FROM applications a 
        JOIN scholarships s ON a.scholarship_id = s.id 
        WHERE a.student_id = ? 
        ORDER BY a.applied_at DESC
    ");
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $applications = [];
    while ($row = $result->fetch_assoc()) {
        $applications[] = $row;
    }
    
    sendResponse(true, '', ['applications' => $applications]);
}

// ==================== WITHDRAW APPLICATION ====================
if ($action === 'withdrawApplication') {
    $id = intval($input['id'] ?? 0);
    $studentId = intval($_SESSION['user_id'] ?? $input['student_id'] ?? 0);
    
    if (!$id || !$studentId) {
        sendResponse(false, 'Invalid data');
    }
    
    $stmt = $conn->prepare("DELETE FROM applications WHERE id = ? AND student_id = ? AND status = 'pending'");
    $stmt->bind_param("ii", $id, $studentId);
    
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        sendResponse(true, 'Application withdrawn successfully!');
    } else {
        sendResponse(false, 'Failed to withdraw application or application already processed');
    }
}

// ==================== GET ALL APPLICATIONS (ADMIN) ====================
if ($action === 'getScholarshipApplications') {
    $query = "
        SELECT a.*, s.title as scholarship_title, u.name as student_name, u.email as student_email
        FROM applications a
        JOIN scholarships s ON a.scholarship_id = s.id
        JOIN users u ON a.student_id = u.id
        ORDER BY a.applied_at DESC
    ";
    
    $result = $conn->query($query);
    $applications = [];
    
    while ($row = $result->fetch_assoc()) {
        $applications[] = $row;
    }
    
    sendResponse(true, '', ['applications' => $applications]);
}

// ==================== UPDATE APPLICATION STATUS (ADMIN) ====================
if ($action === 'updateApplicationStatus') {
    $id = intval($input['id'] ?? 0);
    $status = $conn->real_escape_string($input['status'] ?? '');
    
    if (!$id || !in_array($status, ['pending', 'accepted', 'rejected'])) {
        sendResponse(false, 'Invalid data');
    }
    
    $stmt = $conn->prepare("UPDATE applications SET status = ?, reviewed_at = NOW() WHERE id = ?");
    $stmt->bind_param("si", $status, $id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Application status updated!');
    } else {
        sendResponse(false, 'Failed to update status');
    }
}

// ==================== SAVE PROFILE ====================
if ($action === 'saveProfile') {
    // Get user ID from session OR input
    $userId = intval($_SESSION['user_id'] ?? $input['user_id'] ?? 0);
    $phone = $conn->real_escape_string($input['phone'] ?? '');
    $address = $conn->real_escape_string($input['address'] ?? '');
    $education = $conn->real_escape_string($input['education'] ?? '');
    $skills = $conn->real_escape_string($input['skills'] ?? '');
    
    if (!$userId) {
        sendResponse(false, 'Please login first');
    }
    
    // Check if profile exists
    $stmt = $conn->prepare("SELECT id FROM student_profiles WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows > 0) {
        // Update
        $stmt = $conn->prepare("UPDATE student_profiles SET phone=?, address=?, education=?, skills=? WHERE user_id=?");
        $stmt->bind_param("ssssi", $phone, $address, $education, $skills, $userId);
    } else {
        // Insert
        $stmt = $conn->prepare("INSERT INTO student_profiles (user_id, phone, address, education, skills) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $userId, $phone, $address, $education, $skills);
    }
    
    if ($stmt->execute()) {
        sendResponse(true, 'Profile saved successfully!');
    } else {
        sendResponse(false, 'Failed to save profile: ' . $stmt->error);
    }
}

// ==================== GET PROFILE ====================
if ($action === 'getProfile') {
    // Get user ID from session OR input
    $userId = intval($_SESSION['user_id'] ?? $input['user_id'] ?? 0);
    
    if (!$userId) {
        sendResponse(false, 'Please login first');
    }
    
    $stmt = $conn->prepare("SELECT * FROM student_profiles WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    
    sendResponse(true, '', ['profile' => $profile ?? []]);
}

// ==================== CONTACTS ====================
if ($action === 'addContact') {
    $name = $conn->real_escape_string($input['name'] ?? '');
    $email = $conn->real_escape_string($input['email'] ?? '');
    $phone = $conn->real_escape_string($input['phone'] ?? '');
    $message = $conn->real_escape_string($input['message'] ?? '');
    
    $stmt = $conn->prepare("INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $phone, $message);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Message sent successfully!');
    } else {
        sendResponse(false, 'Failed to send message');
    }
}

if ($action === 'getContacts') {
    $result = $conn->query("SELECT * FROM contacts ORDER BY created_at DESC");
    $contacts = [];
    
    while ($row = $result->fetch_assoc()) {
        $contacts[] = $row;
    }
    
    sendResponse(true, '', ['contacts' => $contacts]);
}

if ($action === 'deleteContact') {
    $id = intval($input['id'] ?? 0);
    
    $stmt = $conn->prepare("DELETE FROM contacts WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Contact deleted successfully!');
    } else {
        sendResponse(false, 'Failed to delete contact');
    }
}

// ==================== USERS (ADMIN) ====================
if ($action === 'getUsers') {
    $result = $conn->query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
    $users = [];
    
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    sendResponse(true, '', ['users' => $users]);
}

// ==================== INVALID ACTION ====================
sendResponse(false, 'Invalid action: ' . $action);
?>