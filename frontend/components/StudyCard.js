'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function StudyCard({ subject, email, onLogged }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mins, setMins] = useState(subject.recommendedMinutes || 30);
  const [focus, setFocus] = useState(3);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.logSession(email, {
        subjectId: subject.id,
        minutes: Number(mins),
        focusRating: Number(focus),
        note,
      });
      setIsOpen(false);
      setNote('');
      if (onLogged) onLogged();
    } catch (err) {
      alert('Failed to log session');
    } finally {
      setLoading(false);
    }
  };

  const isHighPriority = subject.priority > 7;
  const isMedPriority = subject.priority > 4;

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-full h-1 ${
        isHighPriority ? 'bg-red-500' : isMedPriority ? 'bg-orange-500' : 'bg-emerald-500'
      }`} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{subject.name}</h3>
          <p className="text-sm text-slate-400">{subject.reason}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white leading-none">{subject.recommendedMinutes}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Mins</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <span className={`badge ${isHighPriority ? 'bg-red-500/20 text-red-400' : isMedPriority ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          Priority {subject.priority}
        </span>
        {subject.isDueRevision && <span className="badge bg-violet-500/20 text-violet-400">🔄 Review Due</span>}
      </div>

      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="btn-secondary w-full py-2.5 text-sm">
          Log Session
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 pt-5 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-1">Time Studied (mins)</label>
            <input type="number" min="5" step="5" required value={mins} onChange={(e) => setMins(e.target.value)} className="input-field py-2" />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-1 flex justify-between">
              <span>Focus Quality</span>
              <span className="text-violet-400">{focus}/5</span>
            </label>
            <input type="range" min="1" max="5" step="1" value={focus} onChange={(e) => setFocus(e.target.value)} className="w-full accent-violet-500" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Distracted</span><span>Laser Focused</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes (AI analyzes sentiment)</label>
            <textarea 
              placeholder="Any struggles?" 
              value={note} onChange={(e) => setNote(e.target.value)} 
              className="input-field py-2 h-20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2 text-sm">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
