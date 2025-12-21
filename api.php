<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? '';

function respond($success, $message = '', $data = []) {
    echo json_encode(['success' => $success, 'message' => $message] + $data);
    exit;
}

/* ==================== AUTH ==================== */

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'student'; // student or admin
    
    if (!$name || !$email || !$password) {
        respond(false, 'All fields required');
    }
    
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        respond(false, 'Email already registered');
    }
    
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $hash, $role);
    
    if ($stmt->execute()) {
        respond(true, 'Registration successful!');
    } else {
        respond(false, 'Registration failed');
    }
}

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (!$email || !$password) {
        respond(false, 'Email and password required');
    }
    
    $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    
    if (!$user || !password_verify($password, $user['password'])) {
        respond(false, 'Invalid credentials');
    }
    
    unset($user['password']);
    respond(true, 'Login successful', ['user' => $user]);
}

/* ==================== STUDENT PROFILE ==================== */

if ($action === 'saveProfile') {
    $userId = $input['user_id'];
    $phone = $input['phone'] ?? '';
    $address = $input['address'] ?? '';
    $education = $input['education'] ?? '';
    $skills = $input['skills'] ?? '';
    
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
        respond(true, 'Profile saved!');
    } else {
        respond(false, 'Failed to save profile');
    }
}

if ($action === 'getProfile') {
    $userId = $input['user_id'];
    
    $stmt = $conn->prepare("SELECT * FROM student_profiles WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    
    respond(true, '', ['profile' => $profile ?? []]);
}

/* ==================== SCHOLARSHIPS (Admin creates, Students view) ==================== */

if ($action === 'createScholarship') {
    $stmt = $conn->prepare("INSERT INTO scholarships (admin_id, title, description, scholarship_type, eligibility, deadline, amount) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssssd", 
        $input['admin_id'],
        $input['title'],
        $input['description'],
        $input['scholarship_type'],
        $input['eligibility'],
        $input['deadline'],
        $input['amount']
    );
    
    if ($stmt->execute()) {
        respond(true, 'Scholarship posted!');
    } else {
        respond(false, 'Failed to post scholarship');
    }
}

if ($action === 'getAllScholarships') {
    // Students see only active scholarships
    $stmt = $conn->prepare("SELECT s.*, u.name as admin_name FROM scholarships s JOIN users u ON s.admin_id = u.id WHERE s.status = 'active' ORDER BY s.created_at DESC");
    $stmt->execute();
    $scholarships = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    respond(true, '', ['scholarships' => $scholarships]);
}

if ($action === 'getMyScholarships') {
    // Admin sees their own scholarships
    $adminId = $input['admin_id'];
    
    $stmt = $conn->prepare("SELECT * FROM scholarships WHERE admin_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $adminId);
    $stmt->execute();
    $scholarships = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    respond(true, '', ['scholarships' => $scholarships]);
}

if ($action === 'updateScholarship') {
    $stmt = $conn->prepare("UPDATE scholarships SET title=?, description=?, scholarship_type=?, eligibility=?, deadline=?, amount=?, status=? WHERE id=? AND admin_id=?");
    $stmt->bind_param("sssssdiii",
        $input['title'],
        $input['description'],
        $input['scholarship_type'],
        $input['eligibility'],
        $input['deadline'],
        $input['amount'],
        $input['status'],
        $input['id'],
        $input['admin_id']
    );
    
    if ($stmt->execute()) {
        respond(true, 'Scholarship updated!');
    } else {
        respond(false, 'Update failed');
    }
}

if ($action === 'deleteScholarship') {
    $stmt = $conn->prepare("DELETE FROM scholarships WHERE id = ? AND admin_id = ?");
    $stmt->bind_param("ii", $input['id'], $input['admin_id']);
    
    if ($stmt->execute()) {
        respond(true, 'Scholarship deleted!');
    } else {
        respond(false, 'Delete failed');
    }
}

/* ==================== APPLICATIONS ==================== */

if ($action === 'applyScholarship') {
    $scholarshipId = $input['scholarship_id'];
    $studentId = $input['student_id'];
    $message = $input['message'] ?? '';
    
    // Check if already applied
    $stmt = $conn->prepare("SELECT id FROM applications WHERE scholarship_id = ? AND student_id = ?");
    $stmt->bind_param("ii", $scholarshipId, $studentId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        respond(false, 'You have already applied to this scholarship');
    }
    
    $stmt = $conn->prepare("INSERT INTO applications (scholarship_id, student_id, message) VALUES (?, ?, ?)");
    $stmt->bind_param("iis", $scholarshipId, $studentId, $message);
    
    if ($stmt->execute()) {
        respond(true, 'Application submitted!');
    } else {
        respond(false, 'Application failed');
    }
}

if ($action === 'getMyApplications') {
    $studentId = $input['student_id'];
    
    $stmt = $conn->prepare("
        SELECT a.*, s.title, s.amount, s.scholarship_type 
        FROM applications a 
        JOIN scholarships s ON a.scholarship_id = s.id 
        WHERE a.student_id = ? 
        ORDER BY a.applied_at DESC
    ");
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $applications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    respond(true, '', ['applications' => $applications]);
}

if ($action === 'getScholarshipApplications') {
    // Admin views applications for their scholarships
    $adminId = $input['admin_id'];
    
    $stmt = $conn->prepare("
        SELECT a.*, s.title as scholarship_title, u.name as student_name, u.email as student_email,
               sp.phone, sp.education, sp.skills
        FROM applications a
        JOIN scholarships s ON a.scholarship_id = s.id
        JOIN users u ON a.student_id = u.id
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE s.admin_id = ?
        ORDER BY a.applied_at DESC
    ");
    $stmt->bind_param("i", $adminId);
    $stmt->execute();
    $applications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    respond(true, '', ['applications' => $applications]);
}

if ($action === 'updateApplicationStatus') {
    $stmt = $conn->prepare("UPDATE applications SET status = ? WHERE id = ?");
    $stmt->bind_param("si", $input['status'], $input['id']);
    
    if ($stmt->execute()) {
        respond(true, 'Application status updated!');
    } else {
        respond(false, 'Update failed');
    }
}

/* ==================== CONTACTS ==================== */

if ($action === 'addContact') {
    $stmt = $conn->prepare("INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $input['name'], $input['email'], $input['phone'], $input['address']);
    
    if ($stmt->execute()) {
        respond(true, 'Contact added!');
    } else {
        respond(false, 'Failed to add contact');
    }
}

if ($action === 'getContacts') {
    $stmt = $conn->prepare("SELECT * FROM contacts ORDER BY created_at DESC");
    $stmt->execute();
    $contacts = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    respond(true, '', ['contacts' => $contacts]);
}

if ($action === 'deleteContact') {
    $stmt = $conn->prepare("DELETE FROM contacts WHERE id = ?");
    $stmt->bind_param("i", $input['id']);
    
    if ($stmt->execute()) {
        respond(true, 'Contact deleted!');
    } else {
        respond(false, 'Delete failed');
    }
}

respond(false, 'Invalid action');