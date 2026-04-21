'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      api.getAnalytics(session.user.email)
        .then(data => { setStats(data); setLoading(false); })
        .catch(console.error);
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        {[1,2,3,4].map(i => <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const COLORS = ['#8B5CF6', '#22D3EE', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">Deep dive into your study performance.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Weekly Study Time */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-6">7-Day Study Streak (Mins)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} 
                />
                <Bar dataKey="minutes" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Trend */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-6">Focus Heatmap / Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} 
                />
                <Line type="monotone" dataKey="focus" stroke="#22D3EE" strokeWidth={3} dot={{ fill: '#22D3EE', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-6">Time per Subject</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            {stats.subjects?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.subjects} dataKey="minutes" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                    {stats.subjects.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">No data yet</p>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {stats.subjects?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Neglected Subjects Alert */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-red-400 mb-6">Neglected Subjects Alert</h3>
          {stats.neglected?.length > 0 ? (
            <div className="space-y-4">
              {stats.neglected.map((n, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                  <span className="font-semibold text-white">{n.name}</span>
                  <span className="text-sm text-red-400">{n.daysSince} days ago</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-center">
              <div>
                <div className="text-4xl mb-3">✅</div>
                <div className="text-slate-400 text-sm">Great job! You haven't neglected any subjects.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
