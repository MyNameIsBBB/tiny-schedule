"use client";

import React, { useTransition } from 'react';
import { X } from 'lucide-react';
import { createTask } from '@/app/actions';

export default function AddTaskModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createTask(formData);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1 rounded-full hover:bg-paper-dark transition-colors">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-ink">New Task</h2>
        
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Task Name</label>
            <input 
              name="title" 
              required 
              autoFocus
              placeholder="e.g. Design UI Mockup"
              className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-5 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Tags (comma separated)</label>
            <input 
              name="tags" 
              placeholder="e.g. Design, Urgent"
              className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-5 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Deadline</label>
              <input 
                type="date"
                name="deadline" 
                className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Est. Time (mins)</label>
              <input 
                type="number"
                name="estimatedMinutes" 
                min="1"
                placeholder="e.g. 45"
                className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="mt-6 bg-highlight hover:bg-highlight-alt text-paper font-bold text-lg py-4 rounded-full shadow-soft transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? 'Saving...' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
