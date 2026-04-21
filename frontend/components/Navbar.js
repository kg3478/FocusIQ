'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isAuthOrOnboarding = pathname === '/login' || pathname === '/onboarding';

  if (isAuthOrOnboarding) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#050816]/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Focus<span className="text-violet-400">IQ</span></span>
          </Link>

          <div className="flex items-center gap-6">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/analytics" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Analytics</Link>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-secondary py-2 px-4 text-sm">
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
