'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [subjects, setSubjects] = useState([{ id: 1, name: '', difficulty: 3, examDate: '' }]);
  const [dailyHours, setDailyHours] = useState(4);
  const [loading, setLoading] = useState(false);

  const addSubject = () => {
    if (subjects.length >= 8) return;
    setSubjects([...subjects, { id: Date.now(), name: '', difficulty: 3, examDate: '' }]);
  };

  const updateSubject = (id, field, value) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSubject = (id) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const payload = {
        subjects: subjects.filter(s => s.name.trim() !== '').map(s => ({
          name: s.name.trim(),
          difficulty: Number(s.difficulty),
          examDate: s.examDate || null,
        })),
        dailyHours,
        preferredTime: 'morning'
      };

      await api.syncUser(session.user.email, session.user.name, session.user.image);
      await api.onboard(session.user.email, payload);
      router.push('/dashboard');
    } catch (err) {
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Let's build your plan</h1>
          <p className="text-slate-400">Tell the AI about your courses and exams.</p>
        </div>

        <div className="glass-card p-8 sm:p-10">
          <h2 className="text-xl font-bold text-white mb-6">Your Subjects</h2>
          
          <div className="space-y-6 mb-8">
            {subjects.map((sub, i) => (
              <div key={sub.id} className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-white">Subject {i + 1}</h3>
                  {subjects.length > 1 && (
                    <button onClick={() => removeSubject(sub.id)} className="text-red-400 text-sm hover:text-red-300">Remove</button>
                  )}
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
                    <input 
                      type="text" value={sub.name} onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                      placeholder="e.g. Data Structures" className="input-field py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 flex justify-between">
                      <span>Difficulty</span><span className="text-violet-400">{sub.difficulty}/5</span>
                    </label>
                    <input 
                      type="range" min="1" max="5" value={sub.difficulty} onChange={(e) => updateSubject(sub.id, 'difficulty', e.target.value)}
                      className="w-full accent-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Exam Date (Optional)</label>
                    <input 
                      type="date" value={sub.examDate} onChange={(e) => updateSubject(sub.id, 'examDate', e.target.value)}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addSubject} className="btn-secondary w-full mb-10 py-3">
            + Add Subject
          </button>

          <h2 className="text-xl font-bold text-white mb-6">Study Capacity</h2>
          <div className="mb-10 p-6 rounded-xl border border-white/5 bg-white/[0.02] text-center">
            <div className="text-4xl font-bold text-white mb-4">{dailyHours} <span className="text-lg text-slate-400 font-normal">hrs/day</span></div>
            <input 
              type="range" min="1" max="12" step="0.5" value={dailyHours} onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full max-w-xs accent-violet-500"
            />
          </div>

          <button onClick={handleSubmit} disabled={loading || !subjects[0].name} className="btn-primary w-full py-4 text-lg">
            {loading ? 'Building Plan...' : 'Generate AI Plan ✨'}
          </button>
        </div>
      </div>
    </div>
  );
}
