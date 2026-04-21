import { Inter } from 'next/font/google';
import './globals.css';
import NextAuthProvider from './providers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FocusIQ — AI Study Planner',
  description: 'AI builds your perfect study schedule using focus history, exams, and spaced repetition.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
