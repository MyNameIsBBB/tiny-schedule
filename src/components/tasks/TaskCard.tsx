"use client";

import React, { useTransition } from 'react';
import { Clock, CheckCircle2, Circle, MoreHorizontal } from 'lucide-react';
import { toggleTaskStatus } from '@/app/actions';

export default function TaskCard({ 
  id, title, tags, subtasksDone = 0, subtasksTotal = 0, timeLeft, status 
}: { 
  id: string, title: string, tags: string[], subtasksDone?: number, subtasksTotal?: number, timeLeft: string, status: string 
}) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = status === 'COMPLETED';
  const progressPercent = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
  
  const handleToggle = () => {
    startTransition(() => {
      toggleTaskStatus(id, status);
    });
  };

  return (
    <div className={`bg-paper rounded-[2.5rem] p-6 lg:p-8 shadow-soft border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer
      ${isCompleted ? 'border-wheat-dark/50 opacity-75' : 'border-wheat'}
      ${isPending ? 'opacity-50' : ''}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2">
          {tags && tags.map((tag, i) => (
            <span key={i} className={`px-3 py-1 text-xs font-bold rounded-full ${isCompleted ? 'bg-paper-dark text-ink-light' : 'bg-wheat-dark/30 text-ink'}`}>
              {tag}
            </span>
          ))}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0
          ${isCompleted ? 'bg-wheat text-ink-light' : 'bg-highlight/15 text-highlight'}
        `}>
          <Clock size={14} />
          {timeLeft}
        </div>
      </div>
      
      <div className="flex items-start gap-4 mb-6">
        <button onClick={handleToggle} disabled={isPending} className={`mt-1 shrink-0 transition-colors hover:scale-110 cursor-pointer
          ${isCompleted ? 'text-highlight' : 'text-wheat-dark hover:text-highlight'}
        `}>
          {isCompleted ? <CheckCircle2 size={28} fill="currentColor" className="text-paper" /> : <Circle size={28} strokeWidth={2.5} />}
        </button>
        <h3 className={`text-xl font-bold pt-1 leading-snug ${isCompleted ? 'line-through text-ink-light' : 'text-ink'}`}>
          {title}
        </h3>
        <button className="ml-auto text-ink-light hover:text-ink p-2 shrink-0 cursor-pointer">
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      {/* Progress Bar Area */}
      {subtasksTotal > 0 && (
        <div className="pl-[2.75rem]">
          <div className="flex justify-between text-sm font-bold text-ink-light mb-2">
            <span>Subtasks</span>
            <span>{subtasksDone}/{subtasksTotal}</span>
          </div>
          <div className="w-full h-3 bg-paper-dark rounded-full overflow-hidden border border-wheat-dark/30">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-wheat-dark' : 'bg-highlight'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
