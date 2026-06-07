"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Calendar, CheckSquare, Settings, FileText } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: <Home />, label: 'Dashboard' },
    { href: '/schedule', icon: <Calendar />, label: 'Schedule' },
    { href: '/tasks', icon: <CheckSquare />, label: 'Tasks' },
    { href: '/notes', icon: <FileText />, label: 'Notes' },
    { href: '/settings', icon: <Settings />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col md:flex-row font-sans">
      
      {/* Sidebar (PC/Tablet) */}
      <aside className="hidden md:flex flex-col w-24 lg:w-64 bg-paper-dark p-6 border-r border-wheat-dark/30 shadow-[4px_0_24px_rgba(74,62,61,0.02)] z-10 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-soft overflow-hidden shrink-0">
            <Image src="/logo.png" alt="TinySchedule Logo" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <h1 className="hidden lg:block text-2xl font-bold tracking-tight text-ink">Tiny<span className="text-highlight">Schedule</span></h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 w-full lg:w-auto cursor-pointer
                  ${active ? 'bg-wheat text-ink shadow-soft font-bold' : 'text-ink-light hover:bg-paper hover:text-ink font-medium'}`}>
                  <span className="shrink-0">{item.icon}</span>
                  <span className="hidden lg:block">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-24 md:pb-0">
        {children}

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 w-full bg-paper-dark border-t border-wheat-dark/30 p-4 flex justify-around items-center rounded-t-[2rem] shadow-[0_-4px_24px_rgba(74,62,61,0.05)] z-20 pb-safe">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`p-3 rounded-2xl cursor-pointer transition-colors ${active ? 'text-ink bg-wheat' : 'text-ink-light hover:text-ink'}`}>
                  {item.icon}
                </div>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
