import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import QuizEngine from './pages/QuizEngine';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* We can place a Global Navbar here if needed, or inside dashboards */}
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/teacher/*" element={<TeacherDashboard />} />
          <Route path="/student/*" element={<StudentDashboard />} />
          <Route path="/quiz/:quizId" element={<QuizEngine />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
