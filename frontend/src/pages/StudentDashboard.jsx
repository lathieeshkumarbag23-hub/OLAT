// src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, PlayCircle, BookOpen, Clock, Zap, Maximize, Play, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

export default function StudentDashboard() {
  const [lessons,     setLessons]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [activeView,  setActiveView]  = useState('courses');  // 'courses' | 'study'
  const [studyLesson, setStudyLesson] = useState(null);
  const [focusMode,   setFocusMode]   = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/lessons')
      .then(r => setLessons(r.data))
      .catch(() => setError('Failed to load lessons. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const openStudy = (lesson) => {
    setStudyLesson(lesson);
    setActiveView('study');
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${focusMode ? 'bg-gray-950 text-gray-300' : 'bg-gray-50 text-gray-900'}`}>

      {/* ── Top Nav ────────────────────────────────── */}
      <AnimatePresence>
        {!focusMode && (
          <motion.nav initial={{y:-80}} animate={{y:0}} exit={{y:-80}}
            className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-lg text-indigo-600 tracking-tight">Online learning assessment tool</span>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Student</span>
            </div>

            <div className="flex items-center gap-5">
              {/* Streak badge */}
              <div className="flex items-center bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full ring-1 ring-orange-200">
                <Flame className="h-4 w-4 mr-1" fill="currentColor" />
                <span className="font-bold text-sm">{user?.streak ?? 0} Day Streak</span>
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-gray-700 hidden md:block">{user?.name}</span>
              </div>

              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Page Body ──────────────────────────────── */}
      <main className={`max-w-7xl mx-auto px-6 py-10 transition-all ${focusMode ? 'py-16 px-10' : ''}`}>

        {/* ── Course Grid ───────────────────────────── */}
        {activeView === 'courses' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
            <header>
              <h1 className="text-4xl font-extrabold tracking-tight">My Courses</h1>
              <p className="text-gray-500 mt-1">Pick up where you left off!</p>
            </header>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {!loading && !error && lessons.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No courses available yet.</p>
                <p className="text-sm mt-1">Ask your teacher to publish a lesson!</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons.map((lesson, idx) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  onStudy={() => openStudy(lesson)}
                  onQuiz={() => navigate(`/quiz/${lesson.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Study Room ────────────────────────────── */}
        {activeView === 'study' && studyLesson && (
          <StudyRoom
            lesson={studyLesson}
            focusMode={focusMode}
            onBack={() => setActiveView('courses')}
            onToggleFocus={() => setFocusMode(f => !f)}
            onTakeQuiz={() => navigate(`/quiz/${studyLesson.id}`)}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lesson Card
// ─────────────────────────────────────────────────────────────
function LessonCard({ lesson, idx, onStudy, onQuiz }) {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-blue-500 to-cyan-600',
  ];
  const grad = gradients[idx % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
    >
      {/* Card header colour strip */}
      <div className={`h-2 bg-gradient-to-r ${grad}`} />

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`bg-gradient-to-br ${grad} p-3 rounded-2xl`}>
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          {lesson.student_score !== null 
            ? <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg">Completed: {lesson.student_score} pts</span>
            : lesson.has_quiz
              ? <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-lg">Quiz Available</span>
              : <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-lg">No Quiz Yet</span>
          }
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {lesson.title}
        </h3>
        <p className="text-gray-500 text-sm mb-5 line-clamp-2 min-h-[40px]">
          {lesson.description || 'Study this lesson to prepare for the quiz.'}
        </p>

        <p className="text-xs text-gray-400 mb-4">{lesson.material_count} material{lesson.material_count !== 1 ? 's' : ''} · by {lesson.teacher_name}</p>

        <div className="flex gap-3">
          <button onClick={onStudy}
            className="flex-1 bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
          >
            <PlayCircle className="h-4 w-4" /> Study
          </button>
          {lesson.has_quiz && lesson.student_score === null && (
            <button onClick={onQuiz}
              className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-sm font-semibold transition-colors ring-1 ring-inset ring-indigo-200 active:scale-95"
            >
              Take Quiz
            </button>
          )}
          {lesson.student_score !== null && (
            <div className="flex-1 bg-gray-50 text-gray-400 py-2.5 rounded-xl text-sm font-semibold flex flex-col items-center justify-center cursor-not-allowed border border-gray-100">
              Quiz Completed
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Study Room
// ─────────────────────────────────────────────────────────────
function StudyRoom({ lesson, focusMode, onBack, onToggleFocus, onTakeQuiz }) {
  const [details,    setDetails]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeMatIdx, setActiveMatIdx] = useState(0);

  useEffect(() => {
    API.get(`/lessons/${lesson.id}`)
      .then(r => setDetails(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const container = focusMode
    ? 'bg-gray-950 text-gray-200 border-gray-800'
    : 'bg-white text-gray-800 border-gray-100 shadow-xl';

  const activeMat = details?.materials?.[activeMatIdx];

  // Extract YouTube embed URL
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} className="max-w-4xl mx-auto space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className={`text-sm font-semibold hover:underline ${focusMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
          ← Back to Courses
        </button>
        <button onClick={onToggleFocus}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
            focusMode ? 'bg-gray-800 text-white hover:bg-gray-700 ring-1 ring-gray-600' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          <Maximize className="h-4 w-4" /> {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-indigo-400 animate-spin" /></div>
      ) : (
        <>
          {/* Material tabs */}
          {details?.materials?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {details.materials.map((m, i) => (
                <button key={m.id} onClick={() => setActiveMatIdx(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    i === activeMatIdx
                      ? 'bg-indigo-600 text-white shadow'
                      : focusMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.type === 'video' ? '🎬' : m.type === 'pdf' ? '📄' : m.type === 'ppt' ? '📊' : '🔗'} {m.title || `Material ${i+1}`}
                </button>
              ))}
            </div>
          )}

          {/* Content viewer */}
          <div className={`rounded-3xl overflow-hidden border ${container}`}>
            {activeMat ? (
              <>
                {activeMat.type === 'video' && getYoutubeEmbed(activeMat.url) ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={getYoutubeEmbed(activeMat.url)}
                      className="w-full h-full"
                      allowFullScreen
                      title="Online learning assessment tool"
                    />
                  </div>
                ) : activeMat.url ? (
                  <div className="p-8">
                    <p className={`text-sm mb-4 ${focusMode ? 'text-gray-400' : 'text-gray-500'}`}>External resource:</p>
                    <a href={activeMat.url} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-500 hover:text-indigo-400 underline font-medium break-all"
                    >
                      {activeMat.url}
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="p-10">
                <h2 className="text-2xl font-bold mb-3">{lesson.title}</h2>
                <p className={`leading-relaxed ${focusMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lesson.description || 'No description provided for this lesson.'}
                </p>
                <p className={`mt-4 text-sm ${focusMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No materials have been added to this lesson yet.
                </p>
              </div>
            )}
          </div>

          {/* Lesson info + CTA */}
          <div className={`p-6 rounded-3xl border ${container}`}>
            <h2 className="text-xl font-bold mb-2">{lesson.title}</h2>
            <p className={`leading-relaxed text-sm ${focusMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {lesson.description}
            </p>
            {lesson.has_quiz && lesson.student_score === null && (
              <div className="flex justify-end mt-6">
                <button onClick={onTakeQuiz}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 active:scale-95"
                >
                  Take Module Quiz <Zap className="h-4 w-4" fill="currentColor" />
                </button>
              </div>
            )}
            {lesson.has_quiz && lesson.student_score !== null && (
              <div className="flex justify-between items-center mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <div>
                    <p className={`text-sm font-bold text-amber-900`}>Quiz Completed!</p>
                    <p className={`text-xs text-amber-700`}>You cannot retake this quiz.</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {lesson.student_score} <span className="text-sm">pts</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
