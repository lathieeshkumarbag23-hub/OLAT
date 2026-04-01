# 🚀 Full-Stack Deployment Guide (Vercel + Render + Aiven)

This document outlines the exact environment variables and database setup required to deploy the **Online Learning Assessment Tool**.

## 1. Database Setup (Aiven.io)
Copy the following SQL script and run it in your Aiven MySQL Console or via any MySQL client (HeidiSQL, Workbench) after connecting to your Aiven service.

> [!IMPORTANT]
> Aiven usually creates a database named `defaultdb`. Ensure you run these commands against that database.

```sql
-- Kahoootix / Online Learning Assessment Tool - Schema
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

CREATE TABLE IF NOT EXISTS Lessons (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id   INT UNSIGNED NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Materials (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL,
  type         ENUM('video','pdf','ppt','link') NOT NULL,
  title        VARCHAR(255),
  url          TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES Lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Quizzes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES Lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Questions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id      INT UNSIGNED NOT NULL,
  text         TEXT NOT NULL,
  time_limit   SMALLINT UNSIGNED DEFAULT 20,
  points       SMALLINT UNSIGNED DEFAULT 100,
  sort_order   TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES Quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Options (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id  INT UNSIGNED NOT NULL,
  text         VARCHAR(500) NOT NULL,
  is_correct   BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Scores (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id   INT UNSIGNED NOT NULL,
  quiz_id      INT UNSIGNED NOT NULL,
  score        INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id)    REFERENCES Quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Default Teacher Account: admin@teacher.com / securepassword123
INSERT IGNORE INTO Users (role, name, email, password_hash)
VALUES (
  'teacher',
  'Admin Teacher',
  'admin@teacher.com',
  '$2b$12$DGlWBH7Nmc2Fg9Ze5YB5v.slLK/FmA9iOh72ndj28mNKiwavQIGQ.'
);
```

---

## 2. Backend Environment Variables (Render)
Add these variables in the **Dashboard > Your Web Service > Environment** tab on Render.com.

| Key | Value (Description) |
| :--- | :--- |
| `PORT` | `5000` |
| `JWT_SECRET` | `your-super-secret-key-change-this` |
| `DB_HOST` | *(From Aiven Connection Info)* |
| `DB_PORT` | *(From Aiven Connection Info - usually 12067)* |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *(From Aiven Connection Info)* |
| `DB_NAME` | `defaultdb` |
| `FRONTEND_URL` | `https://your-frontend-app.vercel.app` (The Vercel URL) |

---

## 3. Frontend Environment Variables (Vercel)
Add this variable in the **Dashboard > Your Project > Settings > Environment Variables** on Vercel.com.

| Key | Value (Description) |
| :--- | :--- |
| `VITE_API_URL` | `https://your-backend-app.onrender.com/api` |

---

## 4. Deployment Instructions
1.  **Backend (Render)**:
    - Create a "Web Service".
    - Connect your GitHub repo and select the `backend` folder as the root (or use the root if your repo is structured that way).
    - If you used `render.yaml`, just use the "Blueprints" feature.
2.  **Frontend (Vercel)**:
    - Create a "New Project".
    - Connect GitHub and select the `frontend` folder.
    - Framework: `Vite`.
    - Build Command: `npm run build`.
    - Output Directory: `dist`.
