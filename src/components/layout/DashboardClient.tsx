"use client";

import React, { useState } from 'react';
import { Plus, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TimeBlock from '@/components/schedule/TimeBlock';
import AddTaskModal from '@/components/tasks/AddTaskModal';

interface TaskItem {
  id: string;
  title: string;
  tags?: string[];
  status: string;
  [key: string]: unknown;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  [key: string]: unknown;
}

export default function DashboardClient({ initialTasks, initialSchedules }: { initialTasks: TaskItem[], initialSchedules: ScheduleItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center p-6 bg-paper-dark sticky top-0 z-20 shadow-soft rounded-b-[2rem] mb-6">
        <div>
          <p className="text-sm text-ink-light font-medium">Good morning,</p>
          <h1 className="text-2xl font-bold">Best! ☀️</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 bg-highlight hover:bg-highlight-alt text-paper rounded-full flex items-center justify-center shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {/* Content Wrapper */}
      <div className="flex-1 p-6 lg:p-10 flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-[1600px] mx-auto w-full">
        
        {/* PC/Tablet Header (Only visible on larger screens) */}
        <div className="hidden md:flex lg:hidden justify-between items-center w-full mb-4">
           <div>
             <p className="text-ink-light font-medium text-lg">Good morning,</p>
             <h1 className="text-3xl font-bold">Best! ☀️</h1>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
           >
             <Plus size={20} strokeWidth={3} /> Add New
           </button>
        </div>
        
        {/* Timeline & Schedule Panel (Left side on PC) */}
        <section className="flex-1 lg:max-w-md xl:max-w-lg flex flex-col">
          <div className="hidden lg:flex justify-between items-end mb-8">
            <div>
              <p className="text-ink-light font-medium mb-1">Good morning, Best! ☀️</p>
              <h2 className="text-3xl font-bold">Today&apos;s Schedule</h2>
            </div>
          </div>

          {/* Timeline Area */}
          <div className="flex-1 bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 relative">
            <div className="absolute left-10 top-12 bottom-12 w-1 bg-wheat-dark/40 rounded-full" />
            
            <div className="flex flex-col gap-6 relative">
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
                <div className="text-center text-ink-light mt-10">No schedules for today.</div>
              )}
            </div>
          </div>
        </section>

        {/* Task Management Panel (Right side on PC) */}
        <section className="flex-[1.5] flex flex-col">
          <div className="hidden lg:flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Today&apos;s Focus</h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus size={20} strokeWidth={3} /> Add Task
            </button>
          </div>

          {/* Mobile Title */}
          <div className="lg:hidden flex justify-between items-center mb-6 mt-8">
            <h2 className="text-2xl font-bold">Today&apos;s Focus</h2>
            <button className="md:hidden text-ink-light hover:text-ink cursor-pointer"><MoreHorizontal /></button>
          </div>

          <div className="flex flex-col gap-5">
            {initialTasks && initialTasks.length > 0 ? (
              initialTasks.map((task: TaskItem) => (
                <TaskCard 
                  key={task.id}
                  id={task.id}
                  title={task.title} 
                  tags={task.tags || []} 
                  subtasksDone={0} 
                  subtasksTotal={0} 
                  timeLeft="Today" 
                  status={task.status}
                />
              ))
            ) : (
              <div className="bg-paper-dark border-2 border-wheat-dark border-dashed rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-wheat/20 transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="w-16 h-16 bg-wheat text-ink-light rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink">All caught up!</h3>
                <p className="text-ink-light font-medium mt-1">Tap to add a new task.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
