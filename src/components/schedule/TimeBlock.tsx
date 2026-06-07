import React from 'react';

export default function TimeBlock({ 
  time, label, duration, color, active = false 
}: { 
  time: string, label: string, duration: string, color: string, active?: boolean 
}) {
  return (
    <div className="flex items-start gap-4 relative z-10 group cursor-pointer">
      <div className="w-14 pt-3 text-right shrink-0">
        <span className={`text-sm font-bold ${active ? 'text-highlight' : 'text-ink-light group-hover:text-ink transition-colors'}`}>{time}</span>
      </div>
      <div className="relative shrink-0 flex justify-center w-6">
        <div className={`w-5 h-5 rounded-full mt-3 border-[4px] border-paper-dark z-20 transition-all duration-300
          ${active ? 'bg-highlight scale-110 shadow-[0_0_0_4px_rgba(232,163,101,0.2)]' : 'bg-wheat-dark group-hover:bg-ink'}`} 
        />
      </div>
      <div className={`flex-1 rounded-[2rem] p-5 shadow-soft transition-transform duration-300 group-hover:-translate-y-1 ${color} ${active ? 'border-2 border-highlight/30' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-base sm:text-lg leading-tight">{label}</h4>
          <span className="text-xs font-bold px-3 py-1 bg-white/50 rounded-full shrink-0 text-ink-light">{duration}</span>
        </div>
      </div>
    </div>
  );
}
