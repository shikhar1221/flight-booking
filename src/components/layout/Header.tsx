// frontend/src/components/Header.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Navbar } from './Navbar';

export function Header() {
    const { user } = useAuth();

  return (
    <header className="bg-white shadow">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold text-gray-900">
                    Port Easy
                  </a>
                </div>
              </div>
            </nav>
          </header>
  );
}