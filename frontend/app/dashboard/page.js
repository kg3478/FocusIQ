'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import StudyCard from '@/components/StudyCard';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [schedule, setSchedule] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      const user = await api.syncUser(session.user.email, session.user.name, session.user.image);
      if (!user.onboarded) {
        router.push('/onboarding');
        return;
      }
      
      const [schedRes, statsRes] = await Promise.all([
        api.getSchedule(session.user.email),
        api.getAnalytics(session.user.email)
      ]);
      
      setSchedule(schedRes.schedule);
      setReminders(schedRes.reminders);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-10 bg-white/5 rounded-lg w-1/3 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-white/5 rounded-2xl" />
            <div className="h-48 bg-white/5 rounded-2xl" />
          </div>
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {session?.user?.name || 'Student'}
        </h1>
        <p className="text-slate-400">Here is your AI-optimized study plan for today.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="glass-card p-6 bg-gradient-to-br from-violet-900/20 to-transparent border-violet-500/20">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Productivity Score</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{stats.productivityScore}</span>
              <span className="text-sm text-slate-400">/100</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500" style={{ width: `${stats.productivityScore}%` }} />
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current Streak</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{stats.streak}</span>
              <span className="text-sm text-slate-400">days 🔥</span>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total Time</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{Math.floor(stats.totalMinutes / 60)}</span>
              <span className="text-sm text-slate-400">h</span>
              <span className="text-2xl font-bold text-white ml-1">{stats.totalMinutes % 60}</span>
              <span className="text-sm text-slate-400">m</span>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Avg Focus</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{stats.avgFocus}</span>
              <span className="text-sm text-slate-400">/5 🧠</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-white">Today's Plan</h2>
            <Link href="/analytics" className="text-sm font-semibold text-violet-400 hover:text-violet-300">View Analytics →</Link>
          </div>
          
          <div className="space-y-4">
            {schedule.length > 0 ? (
              schedule.map(sub => (
                <StudyCard key={sub.id} subject={sub} email={session.user.email} onLogged={loadData} />
              ))
            ) : (
              <div className="glass-card p-10 text-center border-dashed border-white/20">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-slate-400">You have no subjects scheduled for today. Take a break!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          
          <div className="glass-card p-6 border-white/5">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-violet-400">⚡</span> Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              <Link href="/onboarding" className="btn-secondary w-full py-2.5 text-sm">
                + Add Subject
              </Link>
              <button onClick={loadData} className="btn-secondary w-full py-2.5 text-sm border-white/5">
                🔄 Refresh Plan
              </button>
            </div>
          </div>

          <div className="glass-card p-6 border-white/5">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <span className="text-red-400">🔔</span> Weak Subjects & Alerts
            </h2>
            <div className="space-y-3">
              {reminders.length > 0 ? (
                reminders.map((r, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${
                    r.severity === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                  }`}>
                    <div className="font-bold text-sm mb-1">{r.subject}</div>
                    <div className="text-xs opacity-80">{r.message}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  You're all caught up! No weak subjects.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 border-violet-500/20 bg-violet-500/5">
            <h3 className="font-bold text-white mb-2">Quote of the Day</h3>
            <p className="text-sm text-slate-400 italic">"The secret of getting ahead is getting started."</p>
            <p className="text-xs text-slate-500 mt-2 text-right">— Mark Twain</p>
          </div>
        </div>
      </div>
    </div>
  );
}
