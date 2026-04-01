-- ================================================
-- Kahoootix E-Learning Platform - MySQL Schema
-- Run this script in phpMyAdmin or MySQL CLI
-- ================================================

CREATE DATABASE IF NOT EXISTS elearning_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE elearning_platform;

-- ------------------------------------------------
-- 1. Users
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role         ENUM('teacher', 'student') NOT NULL,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  streak       INT UNSIGNED DEFAULT 0,
  last_login   DATE NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------
-- 2. Lessons
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Lessons (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id   INT UNSIGNED NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------
-- 3. Materials  (video | pdf | ppt | link)
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Materials (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL,
  type         ENUM('video','pdf','ppt','link') NOT NULL,
  title        VARCHAR(255),
  url          TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES Lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------
-- 4. Quizzes
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Quizzes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES Lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------
-- 5. Questions
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Questions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id      INT UNSIGNED NOT NULL,
  text         TEXT NOT NULL,
  time_limit   SMALLINT UNSIGNED DEFAULT 20,
  points       SMALLINT UNSIGNED DEFAULT 100,
  sort_order   TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES Quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------
-- 6. Options
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Options (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id  INT UNSIGNED NOT NULL,
  text         VARCHAR(500) NOT NULL,
  is_correct   BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------
-- 7. Scores
-- ------------------------------------------------
CREATE TABLE IF NOT EXISTS Scores (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id   INT UNSIGNED NOT NULL,
  quiz_id      INT UNSIGNED NOT NULL,
  score        INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id)    REFERENCES Quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------
-- SEED: Restricted teacher account
-- Email:    admin@teacher.com
-- Password: securepassword123
-- Hash generated with bcrypt rounds=12 (verified)
-- ------------------------------------------------
INSERT IGNORE INTO Users (role, name, email, password_hash)
VALUES (
  'teacher',
  'Admin Teacher',
  'admin@teacher.com',
  '$2b$12$DGlWBH7Nmc2Fg9Ze5YB5v.slLK/FmA9iOh72ndj28mNKiwavQIGQ.'
);
