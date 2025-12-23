<?php
// fresh-setup.php - Complete Fresh Setup
header('Content-Type: text/html; charset=utf-8');

function executeSQL($conn, $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "<p style='color: green;'>✅ " . explode(' ', $sql)[0] . " executed successfully</p>";
        return true;
    } else {
        echo "<p style='color: red;'>❌ Error: " . $conn->error . "</p>";
        return false;
    }
}

// Database connection
$host = 'localhost';
$username = 'root';
$password = '';

echo "<h1>Scholarship Portal Fresh Setup</h1>";

// Connect to MySQL server
$conn = new mysqli($host, $username, $password);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "<p>✅ Connected to MySQL server</p>";

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS scholarship_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
executeSQL($conn, $sql);

// Select database
$conn->select_db('scholarship_portal');

// Drop existing tables (if any)
$tables = ['student_profiles', 'applications', 'contacts', 'scholarships', 'users'];
foreach ($tables as $table) {
    $conn->query("DROP TABLE IF EXISTS $table");
}
echo "<p>✅ Cleared existing tables</p>";

// Create users table
$sql = "CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
executeSQL($conn, $sql);

// Create scholarships table
$sql = "CREATE TABLE scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scholarship_type ENUM('Government', 'Private', 'University', 'International') DEFAULT 'Government',
    eligibility TEXT NOT NULL,
    deadline DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
)";
executeSQL($conn, $sql);

// Create applications table
$sql = "CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scholarship_id INT NOT NULL,
    student_id INT NOT NULL,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_application (scholarship_id, student_id)
)";
executeSQL($conn, $sql);

// Create contacts table
$sql = "CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
executeSQL($conn, $sql);

// Create student_profiles table
$sql = "CREATE TABLE student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    education TEXT,
    skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";
executeSQL($conn, $sql);

// Create indexes
$indexes = [
    "CREATE INDEX idx_user_role ON users(role)",
    "CREATE INDEX idx_user_email ON users(email)",
    "CREATE INDEX idx_scholarship_admin ON scholarships(admin_id)",
    "CREATE INDEX idx_scholarship_status ON scholarships(status)",
    "CREATE INDEX idx_application_status ON applications(status)",
    "CREATE INDEX idx_contact_email ON contacts(email)"
];

foreach ($indexes as $indexSql) {
    executeSQL($conn, $indexSql);
}

// Insert admin user with CORRECT password hash
$plainPassword = 'admin123';
$hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

$sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $adminName, $adminEmail, $hashedPassword);

$adminName = 'Administrator';
$adminEmail = 'admin@scholarnepal.com';

if ($stmt->execute()) {
    $adminId = $stmt->insert_id;
    echo "<p style='color: green;'>✅ Admin user created successfully (ID: $adminId)</p>";
    
    // Verify the password
    $verifySql = "SELECT password FROM users WHERE email = 'admin@scholarnepal.com'";
    $result = $conn->query($verifySql);
    $storedHash = $result->fetch_assoc()['password'];
    
    if (password_verify('admin123', $storedHash)) {
        echo "<p style='color: green;'>✅ Password verification successful!</p>";
        echo "<p><strong>Login Credentials:</strong><br>";
        echo "Email: admin@scholarnepal.com<br>";
        echo "Password: admin123</p>";
    } else {
        echo "<p style='color: red;'>❌ Password verification failed!</p>";
        echo "<p>Stored hash: $storedHash</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Error creating admin: " . $conn->error . "</p>";
}

// Insert sample data
echo "<h3>Inserting Sample Data...</h3>";

// Sample students
$students = [
    ['Ram Sharma', 'ram@gmail.com', 'student'],
    ['Sita Gurung', 'sita@gmail.com', 'student'],
    ['Hari Yadav', 'hari@gmail.com', 'student'],
    ['Gita Magar', 'gita@gmail.com', 'student']
];

$studentIds = [];
foreach ($students as $student) {
    $hashedPassword = password_hash('password123', PASSWORD_DEFAULT);
    $sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $student[0], $student[1], $hashedPassword, $student[2]);
    
    if ($stmt->execute()) {
        $studentIds[] = $stmt->insert_id;
        echo "<p>✅ Student: {$student[0]} created</p>";
    }
}

// Sample scholarships
$scholarships = [
    [$adminId, 'National Merit Scholarship', 'Government scholarship for meritorious students', 'Government', 'Minimum GPA 3.5', '2024-12-31', 50000],
    [$adminId, 'Women in STEM Scholarship', 'Private scholarship for women in STEM', 'Private', 'Female students in STEM programs', '2024-11-30', 75000],
    [$adminId, 'University Entrance Scholarship', 'For top performers in entrance exams', 'University', 'Top 100 rank in entrance', '2024-10-31', 100000],
    [$adminId, 'International Study Grant', 'For students studying abroad', 'International', 'Admission to foreign university', '2024-09-30', 200000]
];

$scholarshipIds = [];
foreach ($scholarships as $scholarship) {
    $sql = "INSERT INTO scholarships (admin_id, title, description, scholarship_type, eligibility, deadline, amount) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isssssd", ...$scholarship);
    
    if ($stmt->execute()) {
        $scholarshipIds[] = $stmt->insert_id;
        echo "<p>✅ Scholarship: {$scholarship[1]} created</p>";
    }
}

echo "<h3 style='color: green;'>✅ Setup Complete!</h3>";
echo "<p>Database: <strong>scholarship_portal</strong></p>";
echo "<p>Admin Login: <strong>admin@scholarnepal.com</strong> / <strong>admin123</strong></p>";
echo "<p>Student Login: Use any student email with password: <strong>password123</strong></p>";

$conn->close();
?>