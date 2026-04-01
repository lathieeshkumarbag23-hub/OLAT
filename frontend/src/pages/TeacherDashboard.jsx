// src/pages/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, PenTool, BarChart3, LogOut,
  Plus, Trash2, Loader2, CheckCircle, AlertCircle, Sparkles, GripVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';

// ─────────────────────────────────────────────────────────────
// Teacher Dashboard — all tabs backed by real API calls
// ─────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col pt-8 pb-4 shrink-0 shadow-2xl z-20">
        <div className="px-6 mb-8">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
             <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0"><BookOpen size={16}/></div>
             Online learning assessment tool
          </h2>
          <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mt-1">Teacher Hub</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={<LayoutDashboard size={16}/>} label="Overview"       active={activeTab==='overview'}   onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={<BookOpen size={16}/>}        label="Lesson Builder" active={activeTab==='lessons'}    onClick={() => setActiveTab('lessons')} />
          <SidebarItem icon={<PenTool size={16}/>}         label="Quiz Creator"   active={activeTab==='quizzes'}   onClick={() => setActiveTab('quizzes')} />
          <SidebarItem icon={<BarChart3 size={16}/>}       label="Analytics"      active={activeTab==='analytics'} onClick={() => setActiveTab('analytics')} />
        </nav>

        <div className="px-4 border-t border-slate-800 pt-4">
          <div className="text-[11px] font-medium text-slate-500 px-4 mb-2 truncate">{user?.name}</div>
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-semibold">
            <LogOut size={14} className="mr-3" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-gray-50 relative">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(#4f46e5 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>

        <div className="h-32 bg-indigo-600 px-6 pt-6 flex items-start z-10 relative">
          <div className="text-white">
            <h1 className="text-xl font-bold">Welcome back, {user?.name.split(' ')[0]}!</h1>
            <p className="text-indigo-100 text-xs opacity-90 mt-0.5">Quickly manage your classes and learners.</p>
          </div>
        </div>

        <div className="px-6 -mt-12 z-10 relative pb-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-lg border border-gray-200/50 min-h-[60vh]"
          >
            {activeTab === 'overview'   && <OverviewTab />}
            {activeTab === 'lessons'    && <LessonBuilderTab />}
            {activeTab === 'quizzes'    && <QuizCreatorTab />}
            {activeTab === 'analytics'  && <AnalyticsTab />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-sm ${
        active ? 'bg-indigo-600 text-white shadow' : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [lessons, setLessons]     = useState([]);
  const [scores, setScores]       = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([API.get('/lessons'), API.get('/scores')])
      .then(([l, s]) => { setLessons(l.data); setScores(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const uniqueStudents = new Set(scores.map(s => s.student_email)).size;
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)
    : 0;

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-8">
      <SectionTitle>Dashboard Overview</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Live Lessons"   value={lessons.length} color="indigo" />
        <StatCard label="Total Students" value={uniqueStudents}  color="emerald" />
        <StatCard label="Avg Score"   value={`${avgScore}%`} color="amber" />
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-3">Recent Lessons</h4>
        <div className="space-y-3">
          {lessons.slice(0, 5).map(l => (
            <div key={l.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3 border border-gray-100">
              <div>
                <p className="font-semibold text-gray-800">{l.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{l.material_count} materials · {l.has_quiz ? '✅ Has quiz' : '⚠️ No quiz'}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {lessons.length === 0 && <p className="text-gray-400 text-center py-8">No lessons yet. Create one in the Lesson Builder!</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lesson Builder Tab
// ─────────────────────────────────────────────────────────────
function LessonBuilderTab() {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [materials,   setMaterials]   = useState([{ type: 'video', title: '', url: '' }]);
  const [lessons,     setLessons]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [toast,       setToast]       = useState(null); // { type, msg }

  const [editLessonId, setEditLessonId] = useState(null);

  const fetchLessons = () => {
    setFetching(true);
    API.get('/lessons')
      .then(r => setLessons(r.data))
      .catch(console.error)
      .finally(() => setFetching(false));
  };

  useEffect(fetchLessons, []);

  const addMaterial = () =>
    setMaterials(prev => [...prev, { type: 'video', title: '', url: '' }]);

  const updateMaterial = (i, field, val) =>
    setMaterials(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const removeMaterial = (i) =>
    setMaterials(prev => prev.filter((_, idx) => idx !== i));

  const handleEdit = async (lesson) => {
    setEditLessonId(lesson.id);
    setTitle(lesson.title);
    setDescription(lesson.description || '');
    setLoading(true);
    try {
      const { data } = await API.get(`/lessons/${lesson.id}`);
      if (data.materials && data.materials.length > 0) {
        setMaterials(data.materials.map(m => ({ type: m.type, title: m.title || '', url: m.url })));
      } else {
        setMaterials([{ type: 'video', title: '', url: '' }]);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch lesson details.');
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditLessonId(null);
    setTitle('');
    setDescription('');
    setMaterials([{ type: 'video', title: '', url: '' }]);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim()) return showToast('error', 'Lesson title is required.');
    setLoading(true);
    try {
      const payload = { title, description, materials: materials.filter(m => m.url.trim()) };
      if (editLessonId) {
        await API.put(`/lessons/${editLessonId}`, payload);
        showToast('success', 'Lesson updated successfully!');
      } else {
        await API.post('/lessons', payload);
        showToast('success', 'Lesson published successfully!');
      }
      cancelEdit();
      fetchLessons();
    } catch (err) {
      showToast('error', err.response?.data?.error || `Failed to ${editLessonId ? 'update' : 'publish'} lesson.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    try {
      await API.delete(`/lessons/${id}`);
      setLessons(prev => prev.filter(l => l.id !== id));
      if (editLessonId === id) cancelEdit();
      showToast('success', 'Lesson deleted.');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to delete lesson.');
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Lesson Builder</SectionTitle>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Form */}
      <form onSubmit={handlePublish} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800">{editLessonId ? '✏️ Edit Lesson' : 'Create New Lesson'}</h3>
          {editLessonId && (
            <button type="button" onClick={cancelEdit} className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel Edit</button>
          )}
        </div>

        <div>
          <label className="label">Lesson Title *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="input" placeholder="e.g. Introduction to Cell Biology" required />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} className="input min-h-[80px] resize-none" placeholder="What will students learn?" />
        </div>

        {/* Materials */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="label mb-0">Materials</label>
            <button type="button" onClick={addMaterial} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add Material
            </button>
          </div>

          <div className="space-y-3">
            {materials.map((m, i) => (
              <div key={i} className="flex gap-3 items-start bg-white rounded-xl p-3 border border-gray-200">
                <select value={m.type} onChange={e=>updateMaterial(i,'type',e.target.value)} className="input w-28 shrink-0">
                  <option value="video">🎬 Video</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="ppt">📊 PPT</option>
                  <option value="link">🔗 Link</option>
                </select>
                <input value={m.title} onChange={e=>updateMaterial(i,'title',e.target.value)} className="input flex-1" placeholder="Material title" />
                <input value={m.url} onChange={e=>updateMaterial(i,'url',e.target.value)} className="input flex-1" placeholder="URL / link" />
                <button type="button" onClick={() => removeMaterial(i)} className="text-red-400 hover:text-red-600 mt-2.5 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl shadow-[0_4px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {editLessonId ? 'Updating...' : 'Publishing...'}</> : (editLessonId ? '💾 Update Lesson' : '🚀 Publish Lesson')}
        </button>
      </form>

      {/* Existing Lessons */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4">Published Lessons ({lessons.length})</h3>
        {fetching ? <CenteredSpinner /> : (
          <div className="space-y-3">
            {lessons.map(l => (
              <div key={l.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 border border-gray-100 hover:border-indigo-200 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{l.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{l.material_count} materials · {l.has_quiz ? '✅ Quiz attached' : '⚠️ No quiz'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => handleEdit(l)} className="text-indigo-400 hover:text-indigo-600 text-sm font-semibold transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(l.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
            {lessons.length === 0 && <p className="text-gray-400 text-center py-6">No lessons yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quiz Creator Tab
// ─────────────────────────────────────────────────────────────
function QuizCreatorTab() {
  const [lessons,   setLessons]   = useState([]);
  const [lessonId,  setLessonId]  = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [loading,   setLoading]   = useState(false);
  const [toast,     setToast]     = useState(null);

  function defaultQuestion() {
    return {
      text: '',
      timeLimit: 20,
      points: 100,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]
    };
  }

  useEffect(() => {
    API.get('/lessons').then(r => setLessons(r.data)).catch(console.error);
  }, []);

  // Fetch existing quiz if the selected lesson has one
  useEffect(() => {
    if (!lessonId) {
      setQuizTitle('');
      setQuestions([defaultQuestion()]);
      return;
    }

    setLoading(true);
    API.get(`/quizzes/${lessonId}`)
      .then(r => {
        // If a quiz exists, populate it so the teacher can see it / edit it
        if (r.data && r.data.questions) {
          setQuizTitle(r.data.title || '');
          const loadedQuestions = r.data.questions.map(q => ({
            text: q.text,
            timeLimit: q.time_limit,
            points: q.points,
            options: [
              ...q.options.map(o => ({ text: o.text, isCorrect: Boolean(o.is_correct) })),
              ...Array(Math.max(0, 4 - (q.options?.length || 0))).fill({ text: '', isCorrect: false }) // Pad missing options
            ].slice(0, 4) // Ensure exact 4 length for UI structure
          }));
          setQuestions(loadedQuestions.length > 0 ? loadedQuestions : [defaultQuestion()]);
        }
      })
      .catch((err) => {
        // 404 means no quiz exists yet, which is fine!
        if (err.response?.status === 404) {
          setQuizTitle('');
          setQuestions([defaultQuestion()]);
        } else {
          console.error('Error fetching quiz:', err);
        }
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  const updateQ = (qi, field, val) =>
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: val } : q));

  const updateOpt = (qi, oi, field, val) =>
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = q.options.map((o, j) => {
        if (j !== oi) return field === 'isCorrect' ? { ...o, isCorrect: false } : o; // radio behaviour
        return { ...o, [field]: val };
      });
      return { ...q, options: opts };
    }));

  const addQuestion = () => setQuestions(prev => [...prev, defaultQuestion()]);
  const removeQuestion = (i) => setQuestions(prev => prev.filter((_, j) => j !== i));

  const handleAI = () => {
    // Simulated AI generation
    setQuestions([
      { text: 'What is the powerhouse of the cell?', timeLimit: 15, points: 100, options: [
        { text: 'Nucleus', isCorrect: false },
        { text: 'Mitochondria', isCorrect: true },
        { text: 'Ribosome', isCorrect: false },
        { text: 'Lysosome', isCorrect: false },
      ]},
      { text: 'Which organelle is responsible for protein synthesis?', timeLimit: 20, points: 100, options: [
        { text: 'Golgi Apparatus', isCorrect: false },
        { text: 'Ribosome', isCorrect: true },
        { text: 'Vacuole', isCorrect: false },
        { text: 'Mitochondria', isCorrect: false },
      ]},
    ]);
    showToast('success', 'AI generated 2 questions! Review and publish.');
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!lessonId) return showToast('error', 'Please select a lesson.');
    if (!quizTitle.trim()) return showToast('error', 'Quiz title is required.');

    setLoading(true);
    try {
      await API.post('/quizzes', {
        lessonId: Number(lessonId),
        title: quizTitle,
        questions,
      });
      showToast('success', 'Quiz published! Students can now take it.');
      setQuizTitle(''); setLessonId(''); setQuestions([defaultQuestion()]);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to publish quiz.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const COLORS = ['red','blue','yellow','green'];
  const BG = ['bg-red-500','bg-blue-500','bg-yellow-400','bg-green-500'];
  const TEXT = ['text-white','text-white','text-gray-900','text-white'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SectionTitle>Quiz Creator</SectionTitle>
        <button onClick={handleAI}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow hover:opacity-90 transition-opacity"
        >
          <Sparkles size={14} /> AI Questions
        </button>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Quiz meta */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <div>
            <label className="label">Attach to Lesson *</label>
            <select value={lessonId} onChange={e=>setLessonId(e.target.value)} className="input" required>
              <option value="">— Select a lesson —</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quiz Title *</label>
            <input value={quizTitle} onChange={e=>setQuizTitle(e.target.value)} className="input" placeholder="e.g. Biology Final Quiz" required />
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qi) => (
          <div key={qi} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Question header */}
            <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
              <span className="font-bold text-sm">Question {qi + 1}</span>
              <div className="flex items-center gap-4">
                <label className="text-gray-300 text-sm flex items-center gap-2">
                  ⏱
                  <select value={q.timeLimit} onChange={e=>updateQ(qi,'timeLimit',Number(e.target.value))} className="bg-gray-700 border-none text-white rounded-lg px-2 py-1 text-sm">
                    {[5,10,15,20,30,60].map(t=><option key={t} value={t}>{t}s</option>)}
                  </select>
                </label>
                <label className="text-gray-300 text-sm flex items-center gap-2">
                  ⭐
                  <select value={q.points} onChange={e=>updateQ(qi,'points',Number(e.target.value))} className="bg-gray-700 border-none text-white rounded-lg px-2 py-1 text-sm">
                    <option value={50}>50 pts</option>
                    <option value={100}>100 pts</option>
                    <option value={200}>200 pts</option>
                  </select>
                </label>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Question body */}
            <div className="p-4 space-y-3">
              <input
                value={q.text}
                onChange={e => updateQ(qi, 'text', e.target.value)}
                className="w-full text-base font-bold text-gray-800 placeholder-gray-300 border-b border-gray-100 focus:border-indigo-400 outline-none pb-1 bg-transparent"
                placeholder="Type your question here..."
                required
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                {q.options.map((opt, oi) => (
                  <div key={oi} className={`${BG[oi]} rounded-xl p-3 relative`}>
                    <input
                      value={opt.text}
                      onChange={e => updateOpt(qi, oi, 'text', e.target.value)}
                      className={`w-full font-bold text-sm placeholder-opacity-70 bg-transparent border-b border-white/20 focus:border-white outline-none pb-1 ${TEXT[oi]} placeholder:${TEXT[oi]}`}
                      placeholder={`Answer ${oi + 1}...`}
                    />
                    <label className={`flex items-center gap-2 mt-1.5 text-[10px] uppercase font-bold tracking-wider ${TEXT[oi]} cursor-pointer`}>
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={opt.isCorrect}
                        onChange={() => updateOpt(qi, oi, 'isCorrect', true)}
                        className="accent-white w-3 h-3"
                      />
                      Mark Correct
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addQuestion}
          className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
        >
          <Plus size={14} /> Add Question
        </button>

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2.5 rounded-xl shadow-[0_3px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : '🎮 Save Quiz'}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Analytics Tab
// ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/scores')
      .then(r => setScores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CenteredSpinner />;

  const avgScore = scores.length
    ? Math.round(scores.reduce((a,s) => a + s.score, 0) / scores.length)
    : 0;

  return (
    <div className="space-y-6">
      <SectionTitle>Analytics Hub — Gradebook</SectionTitle>

      {!scores.length ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No scores submitted yet. Share your quizzes with students!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
              <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider">Total Submissions</p>
              <p className="text-4xl font-extrabold text-indigo-700 mt-1">{scores.length}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm text-amber-600 font-semibold uppercase tracking-wider">Class Average</p>
              <p className="text-4xl font-extrabold text-amber-700 mt-1">{avgScore} pts</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Quiz</th>
                  <th className="px-6 py-4 font-semibold">Lesson</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.map(s => {
                  const pct = s.score;
                  const color = pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-800">{s.student_name}</td>
                      <td className="px-6 py-4 text-gray-600">{s.quiz_title}</td>
                      <td className="px-6 py-4 text-gray-600">{s.lesson_title}</td>
                      <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg font-bold text-sm ${color}`}>{s.score} pts</span></td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{new Date(s.completed_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  const MAP = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber:   'bg-amber-50  text-amber-700  ring-amber-200',
  };
  return (
    <div className={`p-5 rounded-2xl ring-1 shadow-sm ${MAP[color]}`}>
      <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black mt-1 tracking-tight">{value}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 mb-1">{children}</h2>;
}

function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
    </div>
  );
}
