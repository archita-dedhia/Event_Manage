-- CampusEvents Database Setup Script
-- This script creates the database, tables, and inserts sample data.

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `saas_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `saas_app`;

-- 2. Create Tables

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `moodle_id` VARCHAR(50) UNIQUE,
    `department` VARCHAR(100),
    `user_type` VARCHAR(50) NOT NULL, -- 'student' or 'admin'
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (`email`)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (`name`)
);

-- Events Table
CREATE TABLE IF NOT EXISTS `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `date` VARCHAR(50) NOT NULL, -- YYYY-MM-DD
    `end_date` VARCHAR(50),
    `time` VARCHAR(50) NOT NULL, -- HH:MM
    `end_time` VARCHAR(50),
    `duration` VARCHAR(100),
    `location` VARCHAR(255) NOT NULL,
    `category_id` INT NOT NULL,
    `organizer_id` INT NOT NULL,
    `capacity` INT NOT NULL,
    `attendees` INT DEFAULT 0,
    `image` TEXT,
    `pdf_url` TEXT,
    `website_url` TEXT,
    `is_rsvp_based` BOOLEAN DEFAULT FALSE,
    `rsvp_url` TEXT,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX (`title`)
);

-- Event Images Table
CREATE TABLE IF NOT EXISTS `event_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `url` TEXT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
);

-- Participants Table
CREATE TABLE IF NOT EXISTS `participants` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `event_id` INT NOT NULL,
    `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(50) NOT NULL DEFAULT 'registered', -- registered, attended, cancelled
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
);

-- 3. Insert Sample Data

-- Sample Categories
INSERT IGNORE INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Technology', 'Tech talks, hackathons, coding workshops'),
(2, 'Cultural', 'Arts, music, dance, cultural events'),
(3, 'Business', 'Entrepreneurship, career talks, networking'),
(4, 'Workshop', 'Skill-building workshops and seminars'),
(5, 'Entertainment', 'Concerts, movies, comedy shows'),
(6, 'Career', 'Job fairs, recruitment drives'),
(7, 'Sports', 'Sports competitions and fitness events');

-- Sample Users
-- Password for both is 'password123' (hashed with bcrypt)
INSERT IGNORE INTO `users` (`id`, `email`, `password`, `full_name`, `user_type`) VALUES
(1, 'admin@campus.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa31S', 'Admin User', 'admin');

INSERT IGNORE INTO `users` (`id`, `email`, `password`, `full_name`, `moodle_id`, `department`, `user_type`) VALUES
(2, 'student@campus.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGa31S', 'Student User', '12345678', 'Computer Science', 'student');

-- Sample Events
INSERT IGNORE INTO `events` (`id`, `title`, `description`, `date`, `time`, `location`, `category_id`, `organizer_id`, `capacity`, `attendees`, `image`) VALUES
(1, 'AI and Future of Work', 'Join us for an insightful session on how AI is shaping the future of various industries.', '2026-03-18', '14:00', 'Auditorium A', 1, 1, 200, 156, 'tech-conference'),
(2, 'Spring Music Festival', 'Celebrate the arrival of spring with a day of live music performances.', '2026-03-20', '11:00', 'Campus Green', 5, 1, 1000, 450, 'music-concert'),
(3, 'Startup Pitch Competition', 'Witness the next generation of entrepreneurs as they pitch their innovative ideas.', '2026-04-20', '16:30', 'Business School Room 102', 3, 1, 100, 88, 'startup-pitch'),
(4, 'Photography Workshop', 'Learn the fundamentals of photography from professional photographers.', '2026-04-25', '10:00', 'Art Studio', 4, 1, 30, 25, 'ai-workshop'),
(5, 'Career Fair 2026', 'Connect with top employers and explore internship and job opportunities.', '2026-05-05', '09:00', 'Main Gymnasium', 6, 1, 500, 320, 'career-fair'),
(6, 'Global Food Festival', 'Experience flavors from around the world at our annual food festival.', '2026-05-15', '12:00', 'Student Union Plaza', 2, 1, 800, 600, 'cultural-festival');
