"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { logoutUser } from '../actions';

export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [isPending, startTransition] = useTransition();

  // Load persisted theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('tiny_theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (t: string) => {
    if (t === 'dark') {
      document.documentElement.style.setProperty('--color-paper', '#231D1C');
      document.documentElement.style.setProperty('--color-paper-dark', '#1A1514');
      document.documentElement.style.setProperty('--color-wheat', '#382D2B');
      document.documentElement.style.setProperty('--color-wheat-dark', '#4A3B39');
      document.documentElement.style.setProperty('--color-ink', '#F5EFE6');
      document.documentElement.style.setProperty('--color-ink-light', '#C7B9B5');
    } else {
      document.documentElement.style.setProperty('--color-paper', '#FDFBF7');
      document.documentElement.style.setProperty('--color-paper-dark', '#F7F4EB');
      document.documentElement.style.setProperty('--color-wheat', '#E6DFD3');
      document.documentElement.style.setProperty('--color-wheat-dark', '#D4C9B5');
      document.documentElement.style.setProperty('--color-ink', '#4A3E3D');
      document.documentElement.style.setProperty('--color-ink-light', '#6B5A58');
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('tiny_theme', nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      startTransition(async () => {
        await logoutUser();
      });
    }
  };

  return (
    <div className={`p-6 lg:p-10 max-w-4xl mx-auto w-full pb-24 md:pb-10 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <h1 className="text-3xl font-bold text-ink mb-8">Settings</h1>
      
      <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
        <h2 className="text-xl font-bold text-ink mb-4">Appearance</h2>
        <div className="flex items-center justify-between py-4 border-b border-wheat-dark/30">
          <div>
            <p className="font-bold text-ink">Wheat & Paper Theme</p>
            <p className="text-sm text-ink-light">Toggle between cozy light and dark paper themes.</p>
          </div>
          <button 
            onClick={handleThemeToggle}
            className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300
              ${theme === 'dark' ? 'bg-highlight' : 'bg-wheat-dark'}`}
          >
            <div className={`w-4 h-4 bg-paper rounded-full shadow-sm transition-transform duration-300
              ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} 
            />
          </button>
        </div>
        
        <h2 className="text-xl font-bold text-ink mt-8 mb-4">Account</h2>
        <div className="flex items-center justify-between py-4 border-b border-wheat-dark/30">
          <div>
            <p className="font-bold text-ink">Sign Out</p>
            <p className="text-sm text-ink-light">Log out of your account on this device.</p>
          </div>
          <button 
            onClick={handleLogout}
            disabled={isPending}
            className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-full font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
