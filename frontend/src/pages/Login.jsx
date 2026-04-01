// src/pages/Login.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode]       = useState('login');   // 'login' | 'register'
  const [role, setRole]       = useState('student'); // 'student' | 'teacher'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Block teacher registration from UI
    if (mode === 'register' && role === 'teacher') {
      setError('Teacher registration is not allowed. Please contact your administrator.');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(email, password);
      } else {
        user = await register(name, email, password);
      }
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">Online learning assessment tool</h1>
          <p className="text-gray-500 text-sm mt-1">Interactive Learning Platform</p>
        </div>

        {/* Mode tabs: Login / Register */}
        <div className="mx-8 bg-gray-100 p-1 rounded-2xl flex mb-2">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === m
                  ? 'bg-white text-indigo-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Role Toggle (visible in both modes) */}
        <div className="mx-8 mt-4 bg-gray-100 p-1 rounded-2xl flex">
          {['student', 'teacher'].map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                role === r
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'student' ? '🎓 I am a Student' : '📚 I am a Teacher'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-4">
          {/* Name field — register only */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
                placeholder="Alex Johnson"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
              placeholder="you@school.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
