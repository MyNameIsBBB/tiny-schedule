"use client";

import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToToasts, ToastMessage } from '@/lib/notifications';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-3rem)] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-paper/90 backdrop-blur-md border-2 border-wheat-dark shadow-lg rounded-[1.5rem] p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 relative"
        >
          <div className="w-8 h-8 rounded-full bg-highlight/15 text-highlight flex items-center justify-center shrink-0">
            <Bell size={16} />
          </div>
          <div className="flex-1 text-sm font-bold text-ink pr-6">
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  );
}
