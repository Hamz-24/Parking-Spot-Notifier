-- Create database
CREATE DATABASE IF NOT EXISTS parking_db;
USE parking_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parking_spots table
CREATE TABLE IF NOT EXISTS parking_spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    status ENUM('Free', 'Occupied') DEFAULT 'Free',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert dummy data
INSERT INTO parking_spots (location, status) VALUES 
('A1 - Main Entrance', 'Free'),
('A2 - Main Entrance', 'Occupied'),
('B1 - East Wing', 'Free'),
('B2 - East Wing', 'Free'),
('C1 - Underground', 'Occupied'),
('D1 - VIP', 'Free');
