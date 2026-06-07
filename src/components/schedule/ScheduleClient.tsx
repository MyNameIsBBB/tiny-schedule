"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AddScheduleModal from './AddScheduleModal';
import TimeBlock from './TimeBlock';

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  [key: string]: unknown;
}

export default function ScheduleClient({ initialSchedules }: { initialSchedules: ScheduleItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full pb-24 md:pb-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-ink">My Schedule</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus size={20} strokeWidth={3} /> Add Block
          </button>
        </div>

        <div className="bg-paper-dark rounded-[2.5rem] p-6 lg:p-10 shadow-soft border border-wheat-dark/20 relative">
          <div className="absolute left-10 lg:left-14 top-12 bottom-12 w-1 bg-wheat-dark/40 rounded-full" />
          
          <div className="flex flex-col gap-6 relative pl-2 lg:pl-6">
            {initialSchedules && initialSchedules.length > 0 ? (
              initialSchedules.map((schedule: ScheduleItem) => {
                const startTimeStr = new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <TimeBlock 
                    key={schedule.id}
                    time={startTimeStr} 
                    label={schedule.title} 
                    duration="1h" 
                    color="bg-wheat text-ink" 
                  />
                );
              })
            ) : (
              <div className="text-center text-ink-light py-20 cursor-pointer hover:bg-wheat/20 rounded-[2.5rem] transition-colors border-2 border-dashed border-wheat-dark"
                   onClick={() => setIsModalOpen(true)}>
                <h3 className="text-xl font-bold text-ink mb-2">Your day is empty</h3>
                <p>Tap here to add your first time block.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddScheduleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
