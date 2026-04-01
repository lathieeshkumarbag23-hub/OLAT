// src/pages/QuizEngine.jsx
// Real DB-backed quiz engine:
//  1. GETs quiz from /api/quizzes/:lessonId
//  2. Runs the timed question loop
//  3. POSTs final score to /api/scores
//  4. Shows results page with rank returned from server
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trophy, ArrowRight, Zap, RefreshCw, Star,
  ArrowLeft, Loader2, AlertCircle, CheckCircle,
  XCircle, BookOpen
} from 'lucide-react';
import API from '../api/client';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const OPTION_STYLES = [
  { bg: 'bg-red-500',    shadow: 'shadow-[0_6px_0_0_#b91c1c]', hover: 'hover:bg-red-600',    text: 'text-white',      icon: '▲' },
  { bg: 'bg-blue-500',   shadow: 'shadow-[0_6px_0_0_#1d4ed8]', hover: 'hover:bg-blue-600',   text: 'text-white',      icon: '◆' },
  { bg: 'bg-yellow-400', shadow: 'shadow-[0_6px_0_0_#92400e]', hover: 'hover:bg-yellow-500', text: 'text-gray-900',   icon: '●' },
  { bg: 'bg-green-500',  shadow: 'shadow-[0_6px_0_0_#15803d]', hover: 'hover:bg-green-600',  text: 'text-white',      icon: '■' },
];

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function QuizEngine() {
  const { lessonId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  // ── Fetch state ──────────────────────────────────
  const [quiz,    setQuiz]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  // ── Quiz play state ──────────────────────────────
  const [phase,         setPhase]         = useState('loading'); // loading | countdown | question | feedback | results
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [selectedOptId, setSelectedOptId] = useState(null);  // option DB id
  const [score,         setScore]         = useState(0);
  const [correctCount,  setCorrectCount]  = useState(0);
  const [rank,          setRank]          = useState(null);
  const [savingScore,   setSavingScore]   = useState(false);
  const [badgeEarned,   setBadgeEarned]   = useState(false);

  const timerRef = useRef(null);

  // ── 1. Fetch Quiz data ───────────────────────────
  useEffect(() => {
    setLoading(true);
    API.get(`/quizzes/${lessonId}`)
      .then(r => {
        setQuiz(r.data);
        setPhase('countdown');
      })
      .catch(err => {
        setFetchErr(err.response?.data?.error || 'Failed to load quiz. Is there a quiz for this lesson?');
        setPhase('error');
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  // ── 2. Countdown (3-2-1) then start first question ──
  useEffect(() => {
    if (phase !== 'countdown') return;
    let count = 3;
    setTimeLeft(count);
    const id = setInterval(() => {
      count -= 1;
      setTimeLeft(count);
      if (count <= 0) {
        clearInterval(id);
        beginQuestion(0);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ── 3. Per-question timer ────────────────────────
  const beginQuestion = useCallback((idx) => {
    if (!quiz) return;
    const q = quiz.questions[idx];
    setCurrentIdx(idx);
    setSelectedOptId(null);
    setTimeLeft(q.time_limit);
    setPhase('question');
  }, [quiz]);

  useEffect(() => {
    if (phase !== 'question' || !quiz) return;
    const q = quiz.questions[currentIdx];

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up — show feedback with no selection
          setPhase('feedback');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, currentIdx, quiz]);

  // ── 4. Answer selection ──────────────────────────
  const handleSelectOption = (opt) => {
    if (phase !== 'question') return;
    clearInterval(timerRef.current);

    setSelectedOptId(opt.id);
    setPhase('feedback');

    if (opt.is_correct) {
      const q = quiz.questions[currentIdx];
      // Speed bonus: points × (timeLeft / timeLimit) rounded to nearest 10
      const speedFactor = timeLeft / q.time_limit;
      const earned = Math.max(10, Math.round(q.points * speedFactor / 10) * 10);
      setScore(prev => prev + earned);
      setCorrectCount(prev => prev + 1);
    }
  };

  // ── 5. Move to next question or finish ───────────
  const handleNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < quiz.questions.length) {
      beginQuestion(nextIdx);
    } else {
      finishQuiz();
    }
  };

  // ── 6. Finish: POST score then show results ──────
  const finishQuiz = async () => {
    setPhase('saving');
    setSavingScore(true);

    // Check for perfect score badge
    if (correctCount + (selectedOptId && quiz.questions[currentIdx].options.find(o=>o.id===selectedOptId)?.is_correct ? 1 : 0) === quiz.questions.length) {
      setBadgeEarned(true);
    }

    try {
      const { data } = await API.post('/scores', { quizId: quiz.id, score });
      setRank(data.rank);
    } catch (err) {
      console.error('Failed to save score:', err);
      setRank(null); // Still show results even if save fails
    } finally {
      setSavingScore(false);
      setPhase('results');
    }
  };

  // ── 7. Confetti on results ────────────────────────
  useEffect(() => {
    if (phase !== 'results') return;
    const shootConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 60, spread: 110, origin: { y: 0.5 }, angle: 60 }), 300);
        setTimeout(() => confetti({ particleCount: 60, spread: 110, origin: { y: 0.5 }, angle: 120 }), 400);
      } catch { /* ignore */ }
    };
    shootConfetti();
  }, [phase]);

  // ─────────────────────────────────────────────────
  // RENDER PHASES
  // ─────────────────────────────────────────────────

  // Error state
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-red-100 text-center max-w-md w-full">
          <AlertCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Unavailable</h2>
          <p className="text-gray-500 mb-6">{fetchErr}</p>
          <button onClick={() => navigate('/student')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Countdown (3-2-1 screen)
  if (phase === 'countdown' || phase === 'loading') {
    return (
      <div className="min-h-screen bg-indigo-700 flex flex-col items-center justify-center font-sans text-white">
        <motion.div
          key={timeLeft}
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          className="text-[10rem] font-black leading-none select-none drop-shadow-2xl"
        >
          {loading ? <Loader2 className="h-24 w-24 mx-auto animate-spin opacity-60" /> : timeLeft || '🚀'}
        </motion.div>
        <p className="mt-6 text-2xl font-bold opacity-80">{quiz?.title}</p>
        <p className="text-indigo-200 mt-2 text-lg">{quiz?.questions?.length} questions</p>
      </div>
    );
  }

  // Saving state
  if (phase === 'saving') {
    return (
      <div className="min-h-screen bg-indigo-700 flex flex-col items-center justify-center font-sans text-white gap-4">
        <Loader2 className="h-16 w-16 animate-spin opacity-80" />
        <p className="text-2xl font-bold">Saving your score...</p>
      </div>
    );
  }

  // Results screen
  if (phase === 'results') {
    const total     = quiz.questions.length;
    const pct       = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const isPerfect = correctCount === total;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-indigo-900 to-gray-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl text-center max-w-lg w-full"
        >
          {/* Trophy */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="h-24 w-24 mx-auto text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] mb-4" />
          </motion.div>

          <h1 className="text-4xl font-extrabold mb-1">Quiz Complete!</h1>
          <p className="text-indigo-200 text-lg mb-6">{quiz.title}</p>

          {/* Score ring */}
          <div className="relative w-36 h-36 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none"
                stroke={isPerfect ? '#fbbf24' : '#818cf8'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * pct / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold">{pct}%</span>
              <span className="text-xs text-indigo-300">{correctCount}/{total} correct</span>
            </div>
          </div>

          {/* Points */}
          <div className="text-5xl font-extrabold text-yellow-400 mb-2 drop-shadow">
            {score.toLocaleString()} <span className="text-2xl text-indigo-200">pts</span>
          </div>

          {/* Rank */}
          {rank && (
            <div className="mt-2 mb-4 text-indigo-200 font-medium">
              Your rank on this quiz: <span className="font-extrabold text-white text-xl">#{rank}</span>
            </div>
          )}

          {/* Perfect badge */}
          {isPerfect && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.6 }}
              className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 font-extrabold px-5 py-2.5 rounded-full shadow-lg mb-6"
            >
              <Star className="h-5 w-5" fill="currentColor" /> Perfect Score Badge!
            </motion.div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => navigate('/student')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-6 rounded-2xl transition-colors backdrop-blur-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" /> Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // QUESTION + FEEDBACK (main game loop)
  // ─────────────────────────────────────────────────
  const currentQ    = quiz.questions[currentIdx];
  const totalTime   = currentQ.time_limit;
  const timeFraction = timeLeft / totalTime;
  const isUrgent    = timeLeft <= 5 && phase === 'question';

  // Determine selected option object
  const selectedOpt = selectedOptId != null
    ? currentQ.options.find(o => o.id === selectedOptId)
    : null;
  const answeredCorrectly = selectedOpt?.is_correct ?? false;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans select-none">

      {/* ── Top bar ──────────────────────────────── */}
      <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        {/* Quiz title + progress */}
        <div className="flex flex-col">
          <span className="font-extrabold text-gray-800 text-lg leading-tight">{quiz.title}</span>
          <span className="text-xs text-gray-500">{currentIdx + 1} / {quiz.questions.length}</span>
        </div>

        {/* Timer ring */}
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <motion.circle
              cx="30" cy="30" r="26"
              fill="none"
              stroke={isUrgent ? '#ef4444' : '#4f46e5'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="163"  /* 2π × 26 */
              strokeDashoffset={163 - 163 * timeFraction}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xl font-black ${isUrgent ? 'text-red-600 animate-pulse' : 'text-indigo-700'}`}>
            {timeLeft}
          </span>
        </div>

        {/* Score */}
        <div className="bg-gray-900 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow">
          <Zap className="h-4 w-4 text-yellow-400" fill="currentColor" />
          {score.toLocaleString()}
        </div>
      </header>

      {/* ── Progress bar ─────────────────────────── */}
      <div className="h-1 bg-gray-200">
        <motion.div
          className="h-full bg-indigo-500"
          animate={{ width: `${((currentIdx) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* ── Main content area ─────────────────────── */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 md:px-8 py-6 gap-6">

        {/* Question box */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`q-${currentIdx}`}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="bg-white rounded-[2rem] shadow-xl px-8 py-10 text-center border border-gray-100 relative overflow-hidden"
          >
            {/* Q number pill */}
            <span className="absolute top-5 left-6 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
              Q{currentIdx + 1}
            </span>
            {/* Points pill */}
            <span className="absolute top-5 right-6 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star className="h-3 w-3" fill="currentColor" /> {currentQ.points} pts
            </span>

            <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-snug mt-4 px-4">
              {currentQ.text}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Answer options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {currentQ.options.map((opt, oi) => {
            const style = OPTION_STYLES[oi % OPTION_STYLES.length];
            const isSel = selectedOptId === opt.id;

            let classes = `${style.bg} ${style.hover} ${style.shadow} ${style.text}`;
            let overlay = null;

            if (phase === 'feedback') {
              if (opt.is_correct) {
                classes = 'bg-green-500 text-white shadow-[0_0_0_4px_rgba(34,197,94,0.4)] scale-105 ring-4 ring-green-300';
                overlay = <CheckCircle className="h-8 w-8" />;
              } else if (isSel && !opt.is_correct) {
                classes = 'bg-red-500 text-white opacity-90';
                overlay = <XCircle className="h-8 w-8" />;
              } else {
                classes = 'opacity-30 grayscale pointer-events-none scale-95';
              }
            }

            return (
              <motion.button
                key={opt.id}
                whileHover={phase === 'question' ? { scale: 1.02, y: -2 } : {}}
                whileTap={phase === 'question' ? { scale: 0.97 } : {}}
                onClick={() => handleSelectOption(opt)}
                disabled={phase !== 'question'}
                className={`
                  ${classes}
                  p-6 md:p-7 rounded-3xl font-extrabold text-xl md:text-2xl
                  transition-all duration-300 text-left relative overflow-hidden
                  flex items-center gap-4 shadow-md cursor-pointer
                `}
              >
                {/* Shape icon */}
                <div className="w-11 h-11 bg-black/15 rounded-xl flex items-center justify-center shrink-0 text-2xl">
                  {style.icon}
                </div>

                <span className="flex-1 leading-tight">{opt.text}</span>

                {/* Feedback icon on the right */}
                {phase === 'feedback' && overlay && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="shrink-0"
                  >
                    {overlay}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* ── Feedback footer (slides up after selection) ── */}
      <AnimatePresence>
        {phase === 'feedback' && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`fixed bottom-0 inset-x-0 z-50 px-6 py-5 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t ${
              answeredCorrectly
                ? 'bg-green-50 border-green-200'
                : selectedOpt
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'
            }`}
          >
            {/* Feedback message */}
            <div className="flex items-center gap-3 text-xl font-bold">
              {answeredCorrectly ? (
                <>
                  <CheckCircle className="h-7 w-7 text-green-500 shrink-0" />
                  <div>
                    <p className="text-green-700">Correct! 🎉</p>
                    <p className="text-sm font-medium text-green-600">Keep it up!</p>
                  </div>
                </>
              ) : selectedOpt ? (
                <>
                  <XCircle className="h-7 w-7 text-red-500 shrink-0" />
                  <div>
                    <p className="text-red-700">Incorrect</p>
                    <p className="text-sm font-medium text-red-500">
                      Correct: <span className="font-bold">{currentQ.options.find(o => o.is_correct)?.text}</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <RefreshCw className="h-7 w-7 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-orange-700">Time's Up!</p>
                    <p className="text-sm font-medium text-orange-500">
                      Answer: <span className="font-bold">{currentQ.options.find(o => o.is_correct)?.text}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Next / Finish button */}
            <button
              onClick={handleNext}
              className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-extrabold text-lg shadow-[0_5px_0_0_#374151] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 shrink-0"
            >
              {currentIdx + 1 < quiz.questions.length ? (
                <><span>Next</span><ArrowRight className="h-5 w-5" strokeWidth={3} /></>
              ) : (
                <><span>Finish</span><Trophy className="h-5 w-5 text-yellow-400" /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
