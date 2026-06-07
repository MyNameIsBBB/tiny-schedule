"use client";

import React, { useTransition } from 'react';
import { Clock, CheckCircle2, Circle, Trash2, Hourglass } from 'lucide-react';
import { toggleTaskStatus, deleteTask } from '@/app/actions';

export default function TaskCard({ 
  id, title, tags, subtasksDone = 0, subtasksTotal = 0, deadline, estimatedMinutes, status 
}: { 
  id: string, 
  title: string, 
  tags: string[], 
  subtasksDone?: number, 
  subtasksTotal?: number, 
  deadline: Date | string | null, 
  estimatedMinutes: number | null, 
  status: string 
}) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = status === 'COMPLETED';
  const progressPercent = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await toggleTaskStatus(id, status);
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      startTransition(async () => {
        await deleteTask(id);
      });
    }
  };

  // Helper to format deadline
  const getDeadlineInfo = () => {
    if (!deadline) return { label: "No deadline", isOverdue: false, isToday: false };
    
    const d = new Date(deadline);
    const today = new Date();
    
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = dDate.getTime() - tDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: "Overdue", isOverdue: true, isToday: false };
    } else if (diffDays === 0) {
      return { label: "Today", isOverdue: false, isToday: true };
    } else if (diffDays === 1) {
      return { label: "Tomorrow", isOverdue: false, isToday: false };
    } else if (diffDays <= 7) {
      return { label: `${diffDays}d left`, isOverdue: false, isToday: false };
    } else {
      return { 
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), 
        isOverdue: false,
        isToday: false
      };
    }
  };

  const dlInfo = getDeadlineInfo();

  return (
    <div className={`bg-paper rounded-[2.5rem] p-6 lg:p-8 shadow-soft border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer
      ${isCompleted ? 'border-wheat-dark/50 opacity-75' : 'border-wheat'}
      ${isPending ? 'opacity-50' : ''}
    `}>
      <div className="flex justify-between items-start mb-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags && tags.length > 0 ? (
            tags.map((tag, i) => (
              <span key={i} className={`px-3 py-1 text-xs font-bold rounded-full ${isCompleted ? 'bg-paper-dark text-ink-light' : 'bg-wheat-dark/30 text-ink'}`}>
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-ink-light/50 italic px-2">No tags</span>
          )}
        </div>
        
        {/* Deadline & Estimated Time Badge */}
        <div className="flex items-center gap-2">
          {estimatedMinutes && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold
              ${isCompleted ? 'bg-wheat text-ink-light' : 'bg-wheat-dark/30 text-ink'}`}>
              <Hourglass size={12} />
              {estimatedMinutes}m
            </div>
          )}
          
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0
            ${isCompleted ? 'bg-wheat text-ink-light' : 
              dlInfo.isOverdue ? 'bg-red-100 text-red-600' :
              dlInfo.isToday ? 'bg-highlight/15 text-highlight' : 'bg-wheat-dark/40 text-ink'
            }
          `}>
            <Clock size={14} />
            {dlInfo.label}
          </div>
        </div>
      </div>
      
      {/* Task Content */}
      <div className="flex items-start gap-4 mb-2">
        <button onClick={handleToggle} disabled={isPending} className={`mt-1 shrink-0 transition-colors hover:scale-110 cursor-pointer
          ${isCompleted ? 'text-highlight' : 'text-wheat-dark hover:text-highlight'}
        `}>
          {isCompleted ? <CheckCircle2 size={28} fill="currentColor" className="text-paper" /> : <Circle size={28} strokeWidth={2.5} />}
        </button>
        
        <h3 className={`text-xl font-bold pt-1 leading-snug flex-1 ${isCompleted ? 'line-through text-ink-light' : 'text-ink'}`}>
          {title}
        </h3>
        
        <button 
          onClick={handleDelete}
          disabled={isPending}
          className="text-ink-light hover:text-red-500 p-2 shrink-0 cursor-pointer rounded-full hover:bg-paper-dark transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      {/* Progress Bar Area */}
      {subtasksTotal > 0 && (
        <div className="pl-[2.75rem] mt-4">
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
