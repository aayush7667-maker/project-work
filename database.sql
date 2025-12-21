-- Enhanced database schema for the scholarship portal

-- Users table (students and admins)
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
);

-- Student profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    education TEXT,
    skills TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
);

-- Scholarships table
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
);

-- Applications table
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
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- User sessions for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) 
VALUES ('Administrator', 'admin@scholarnepal.com', '$2y$10$YourHashedPasswordHere', 'admin');

-- Insert sample student (password: demo123)
INSERT IGNORE INTO users (name, email, password, role)
VALUES ('Demo Student', 'student@demo.com', '$2y$10$YourHashedPasswordHere', 'student');

-- Insert sample scholarships
INSERT IGNORE INTO scholarships (admin_id, title, description, scholarship_type, eligibility, deadline, amount, status) VALUES
(1, 'National Science Scholarship', 'Full scholarship for science students pursuing higher education in Nepal. Covers tuition, books, and living expenses.', 'Government', 'Science students with GPA 3.5+, family income below NPR 500,000', DATE_ADD(CURDATE(), INTERVAL 60 DAY), 150000.00, 'active'),
(1, 'Women in Technology Grant', 'Scholarship for female students pursuing computer science or IT degrees. Aimed at increasing gender diversity in tech.', 'Private', 'Female students enrolled in CS/IT programs, GPA 3.0+', DATE_ADD(CURDATE(), INTERVAL 45 DAY), 100000.00, 'active'),
(1, 'Rural Development Scholarship', 'For students from rural areas pursuing agriculture or development studies. Sponsored by local NGOs.', 'NGO', 'Students from rural municipalities, pursuing relevant degrees', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 75000.00, 'active');
