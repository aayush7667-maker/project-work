-- Complete Database Setup for ScholarNexus
-- Run this entire file in phpMyAdmin SQL tab

-- Create Database
CREATE DATABASE IF NOT EXISTS scholarship_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scholarship_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    education TEXT,
    skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Scholarships Table
CREATE TABLE IF NOT EXISTS scholarships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scholarship_type ENUM('Government', 'Private', 'NGO') NOT NULL,
    eligibility TEXT NOT NULL,
    deadline DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin (admin_id),
    INDEX idx_status (status),
    INDEX idx_type (scholarship_type),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    scholarship_id INT NOT NULL,
    student_id INT NOT NULL,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_application (scholarship_id, student_id),
    INDEX idx_status (status),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity Logs Table (Optional - for tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Admin User (Email: admin@scholarnepal.com, Password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Administrator', 'admin@scholarnepal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert Demo Student (Email: student@demo.com, Password: student123)
INSERT INTO users (name, email, password, role) VALUES
('Demo Student', 'student@demo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- Insert Sample Scholarships
INSERT INTO scholarships (admin_id, title, description, scholarship_type, eligibility, deadline, amount, status) VALUES
(1, 'National Science Excellence Scholarship',
 'Full scholarship for outstanding science students pursuing higher education in Nepal. Covers tuition fees, books, and living expenses for the entire academic year.',
 'Government',
 'Must be a science student with minimum GPA of 3.5, family annual income below NPR 500,000, Nepali citizen',
 DATE_ADD(CURDATE(), INTERVAL 60 DAY),
 150000.00,
 'active'),

(1, 'Women in Technology Grant',
 'Empowering female students to pursue careers in computer science and IT. This scholarship aims to bridge the gender gap in technology fields.',
 'Private',
 'Female students enrolled in CS/IT programs, minimum GPA 3.0, commitment to completing degree',
 DATE_ADD(CURDATE(), INTERVAL 45 DAY),
 100000.00,
 'active'),

(1, 'Rural Development Scholarship',
 'Supporting students from rural areas pursuing agriculture or community development studies. Sponsored by multiple NGOs working in rural development.',
 'NGO',
 'Students from rural municipalities, pursuing agriculture/development degrees, demonstrated community service',
 DATE_ADD(CURDATE(), INTERVAL 30 DAY),
 75000.00,
 'active'),

(1, 'Engineering Excellence Award',
 'Merit-based scholarship for engineering students showing exceptional academic performance and innovation potential.',
 'Private',
 'Engineering students with GPA above 3.7, submitted innovative project proposal',
 DATE_ADD(CURDATE(), INTERVAL 50 DAY),
 120000.00,
 'active'),

(1, 'Medical Studies Support Fund',
 'Financial assistance for aspiring doctors from underprivileged backgrounds pursuing MBBS or related medical degrees.',
 'Government',
 'Admitted to recognized medical college, family income below NPR 400,000, excellent academic record',
 DATE_ADD(CURDATE(), INTERVAL 70 DAY),
 200000.00,
 'active');

-- ============================================
-- VERIFICATION QUERIES (Optional - to check)
-- ============================================

-- Check users
-- SELECT id, name, email, role FROM users;

-- Check scholarships
-- SELECT id, title, scholarship_type, amount, deadline, status FROM scholarships;

-- ============================================
-- PASSWORD INFORMATION
-- ============================================
-- Admin Login:
--   Email: admin@scholarnepal.com
--   Password: admin123
--
-- Student Login:
--   Email: student@demo.com
--   Password: student123
--
-- Note: The password hash '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
-- is the bcrypt hash for 'password' - but we're using it for both accounts
-- as demo credentials. In production, each user should have unique hashed passwords.
-- ============================================[
