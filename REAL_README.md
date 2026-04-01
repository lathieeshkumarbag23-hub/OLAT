# 🚀 Kahoootix - Professional E-Learning Platform

A database-driven, interactive learning platform featuring Teacher & Student portals with real-time quiz logic, gamification, and professional SaaS aesthetics.

---

## 🛠️ Prerequisites

1.  **Node.js** (v18 or higher recommended)
2.  **MySQL Server** (XAMPP / WAMP / MySQL Installer)
    -   Host: `localhost`
    -   Username: `root`
    -   Password: (Empty by default)

---

## 🏗️ Step 1: Database Setup

Make sure your MySQL server is currently **RUNNING** on your PC.

1.  Open a terminal in the `backend` folder.
2.  Run the automated setup script:
    ```bash
    node setup-db.js  # This creates the DB and seeds the Teacher account
    ```
    *Note: If your MySQL root has a password, use: `node setup-db.js YOUR_PASSWORD`*

---

## 🟢 Step 2: Running the Application

### **1. Start the Backend API** (Terminal A)
Open a terminal in the `backend` folder and run:
```bash
npm install
npm run dev
```
*The API will listen on `http://127.0.0.1:8080`*

### **2. Start the Frontend App** (Terminal B)
Open a NEW terminal in the `frontend` folder and run:
```bash
npm install
npm run dev
```
*The App will run on `http://localhost:5173`*

---

## 🔑 Login Credentials

#### **Teacher Account (Admin):**
This account is automatically created during Step 1.
-   **Email**: `admin@teacher.com`
-   **Password**: `securepassword123`

#### **Student Account:**
-   Go to the Sign Up section and create any new account. One-click registration is active!

---

## 🎨 Creative Features Included:
-   ✅ **Gamsified Quiz Engine**: Speed-based scoring, color-coded answers, and live Ranking recomputation.
-   ✅ **Teacher Portal**: Create lessons, attach YouTube/PDF materials, and build complex quizzes.
-   ✅ **AI Placeholder**: Simulated AI question generation in the Quiz Creator.
-   ✅ **Focus Mode**: A dark, distraction-free environment for reading student materials.
-   ✅ **Streak Tracking**: Database-backed login streaks for student engagement.
