"use client";

import React, { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteSchedule } from '@/app/actions';

export default function TimeBlock({ 
  id, time, label, duration, color, active = false, isFirst = false, isLast = false 
}: { 
  id?: string, time: string, label: string, duration: string, color: string, active?: boolean, isFirst?: boolean, isLast?: boolean 
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    if (confirm("Are you sure you want to delete this schedule block?")) {
      startTransition(async () => {
        await deleteSchedule(id);
      });
    }
  };

  return (
    <div className={`flex items-stretch gap-4 relative z-10 group cursor-pointer transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      {/* Time column */}
      <div className="w-14 pt-3 text-right shrink-0">
        <span className={`text-sm font-bold ${active ? 'text-highlight' : 'text-ink-light group-hover:text-ink transition-colors'}`}>{time}</span>
      </div>
      
      {/* Dot and Timeline segment */}
      <div className="relative shrink-0 flex justify-center w-6">
        {/* Line segment centered in this block */}
        <div className={`absolute w-[2px] bg-wheat-dark/30 left-1/2 -translate-x-1/2 
          ${isFirst ? 'top-5' : 'top-0'} 
          ${isLast ? 'bottom-auto h-5' : 'bottom-0'}`} 
        />
        {/* Orange Dot */}
        <div className={`w-5 h-5 rounded-full mt-3 border-[4px] border-paper-dark z-20 transition-all duration-300
          ${active ? 'bg-highlight scale-110 shadow-[0_0_0_4px_rgba(232,163,101,0.2)]' : 'bg-wheat-dark group-hover:bg-ink'}`} 
        />
      </div>
      
      {/* Content Card */}
      <div className={`flex-1 rounded-[2rem] p-5 shadow-soft transition-all duration-300 group-hover:-translate-y-1 ${color} ${active ? 'border-2 border-highlight/30' : ''}`}>
        <div className="flex justify-between items-center gap-2">
          <h4 className="font-bold text-base sm:text-lg leading-tight">{label}</h4>
          
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-3 py-1 bg-white/50 rounded-full text-ink-light">{duration}</span>
            {id && (
              <button 
                onClick={handleDelete}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-ink-light hover:text-red-500 rounded-full hover:bg-white/40 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
