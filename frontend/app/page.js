import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <h1 className="max-w-4xl mx-auto text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Study Smarter, <br className="hidden md:block" />
          <span className="gradient-text">Not Harder</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10">
          AI builds your perfect study schedule using focus history, exams, and spaced repetition. Know exactly what to study every day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login" className="btn-primary text-lg px-8 py-4">Start Free</Link>
          <Link href="/login" className="btn-secondary text-lg px-8 py-4">Watch Demo</Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need to ace exams</h2>
            <p className="text-slate-400">Six powerful features working in sync to optimise your sessions.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🧠', title: 'AI Planner', desc: 'Builds daily schedule from exam dates and difficulty levels.' },
              { icon: '🔁', title: 'Spaced Repetition', desc: 'Times review sessions at the ideal interval for max retention.' },
              { icon: '⚡', title: 'Priority Engine', desc: 'Scores each subject by urgency and neglect.' },
              { icon: '📝', title: 'Session Logger', desc: 'AI reads your notes and detects when you are struggling.' },
              { icon: '📊', title: 'Analytics', desc: 'Weekly charts, streak tracking, and focus scores.' },
              { icon: '🔔', title: 'Smart Reminders', desc: 'Alerts before exams and for weak subjects.' }
            ].map((f, i) => (
              <div key={i} className="glass-card p-8">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, honest pricing</h2>
            <p className="text-slate-400">Start free. Upgrade when you need more power.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card p-10">
              <h3 className="text-slate-400 font-semibold mb-2">Free</h3>
              <div className="text-5xl font-bold text-white mb-6">₹0</div>
              <ul className="space-y-4 mb-8 text-slate-300">
                <li>✓ Up to 5 subjects</li>
                <li>✓ AI daily planner</li>
                <li>✓ Session logger</li>
              </ul>
              <Link href="/login" className="btn-secondary w-full">Get Started</Link>
            </div>
            <div className="glass-card p-10 border-violet-500/30 bg-violet-900/10">
              <h3 className="text-violet-400 font-semibold mb-2">Pro</h3>
              <div className="text-5xl font-bold text-white mb-6">₹299<span className="text-xl text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 text-slate-300">
                <li>✓ Unlimited subjects</li>
                <li>✓ Deep analytics & sentiment</li>
                <li>✓ Priority support</li>
              </ul>
              <Link href="/login" className="btn-primary w-full">Start Pro Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 text-center text-slate-500">
        <p>© {new Date().getFullYear()} FocusIQ. All rights reserved.</p>
      </footer>
    </div>
  );
}
