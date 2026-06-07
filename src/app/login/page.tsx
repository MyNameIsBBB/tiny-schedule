"use client";

import React, { useState, useTransition } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { loginUser } from '../actions';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const res = await loginUser(password);
      if (res.success) {
        // Redirection is handled inside server action/middleware,
        // but since next.js actions returning response can also let us reload/redirect:
        window.location.href = '/';
      } else {
        setError(res.error || 'Login failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-paper-dark rounded-[2.5rem] p-8 md:p-10 shadow-soft border-2 border-wheat flex flex-col items-center">
        {/* Cozy Logo Container */}
        <div className="w-20 h-20 bg-wheat text-ink rounded-full flex items-center justify-center mb-6 shadow-soft border-4 border-paper">
          <Lock size={32} strokeWidth={2.5} className="text-highlight" />
        </div>

        <h1 className="text-3xl font-extrabold text-ink mb-2 tracking-tight">TinySchedule</h1>
        <p className="text-ink-light text-center font-medium mb-8 max-w-xs text-sm">
          Enter password to access your cozy daily planner.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              autoFocus
              className="w-full bg-paper border-2 border-wheat focus:border-highlight rounded-2xl px-5 py-4 pr-12 outline-none text-ink font-semibold placeholder:text-ink-light/40 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-highlight hover:bg-highlight-alt text-paper rounded-xl flex items-center justify-center shadow-soft transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center mt-1 animate-pulse">
              {error}
            </p>
          )}

          <div className="text-center mt-6">
            <span className="text-xs text-ink-light/50 font-semibold">
              TinySchedule Homelab Edition
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
