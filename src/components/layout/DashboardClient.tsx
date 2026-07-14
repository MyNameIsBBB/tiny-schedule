"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TimeBlock from '@/components/schedule/TimeBlock';
import AddTaskModal from '@/components/tasks/AddTaskModal';

interface TaskItem {
  id: string;
  title: string;
  tags?: string[];
  status: string;
  deadline: Date | string | null;
  subtasks?: { id: string; title: string; completed: boolean }[];
  [key: string]: unknown;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  cost?: number | null;
  isFixedCost?: boolean;
  isAllDay?: boolean;
  [key: string]: unknown;
}

export default function DashboardClient({ 
  initialTasks, 
  initialSchedules
}: { 
  initialTasks: TaskItem[]; 
  initialSchedules: ScheduleItem[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [completedRoutines, setCompletedRoutines] = useState<{ [key: string]: boolean }>({});

  // Greeting State
  const [greeting, setGreeting] = useState({ text: "Good morning, Best!", icon: "☀️" });
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting({ text: "Good morning, Best!", icon: "☀️" });
      else if (hour >= 12 && hour < 17) setGreeting({ text: "Good afternoon, Best!", icon: "🌤️" });
      else if (hour >= 17 && hour < 21) setGreeting({ text: "Good evening, Best!", icon: "🌆" });
      else setGreeting({ text: "Good night, Best!", icon: "🌙" });
    };
    updateGreeting();
  }, []);

  useEffect(() => {
    // Load daily routines completion status and clean up old ones
    const todayKey = new Date().toLocaleDateString('en-CA');
    const completions: { [key: string]: boolean } = {};
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('routine-')) {
        if (key.startsWith(`routine-${todayKey}-`)) {
          const routineId = key.replace(`routine-${todayKey}-`, '');
          completions[routineId] = localStorage.getItem(key) === 'true';
        } else {
          keysToRemove.push(key);
        }
      }
    }
    setCompletedRoutines(completions);
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }, []);

  // Filter schedules to show only today's schedules (All day sorted to the top)
  const getTodaySchedules = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');
    
    return initialSchedules
      .filter((schedule) => {
        const scheduleDateStr = new Date(schedule.startTime).toLocaleDateString('en-CA');
        return !schedule.isRoutine && scheduleDateStr === todayStr;
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  };

  // Get today's active routines
  const getTodayRoutines = () => {
    const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
    return initialSchedules.filter(s => {
      if (!s.isRoutine) return false;
      const days = Array.isArray(s.routineDays) ? s.routineDays : [];
      return days.includes(todayDay);
    }).sort((a, b) => {
      const aHours = new Date(a.startTime).getHours();
      const bHours = new Date(b.startTime).getHours();
      if (aHours !== bHours) return aHours - bHours;
      return new Date(a.startTime).getMinutes() - new Date(b.startTime).getMinutes();
    });
  };

  const todayRoutines = getTodayRoutines();

  const handleToggleRoutine = (id: string) => {
    const todayKey = new Date().toLocaleDateString('en-CA');
    const key = `routine-${todayKey}-${id}`;
    const isCompleted = !completedRoutines[id];
    
    setCompletedRoutines(prev => ({
      ...prev,
      [id]: isCompleted
    }));
    
    if (isCompleted) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  const getRoutinePeriods = () => {
    const periods: { morning: ScheduleItem[], afternoon: ScheduleItem[], evening: ScheduleItem[] } = {
      morning: [],
      afternoon: [],
      evening: []
    };
    
    todayRoutines.forEach(r => {
      const startHour = new Date(r.startTime).getHours();
      if (startHour < 12) {
        periods.morning.push(r);
      } else if (startHour < 17) {
        periods.afternoon.push(r);
      } else {
        periods.evening.push(r);
      }
    });
    
    return periods;
  };
  
  const routinePeriods = getRoutinePeriods();
  const todaySchedules = getTodaySchedules();

  const calculateDuration = (start: string | Date, end: string | Date) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  // Focus tasks sorting (nearest deadline first, then tasks without deadlines)
  const getSortedFocusTasks = () => {
    return [...initialTasks]
      .filter(task => task.status !== 'COMPLETED')
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  };

  const focusTasks = getSortedFocusTasks();

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center p-6 bg-paper-dark sticky top-0 z-20 shadow-soft rounded-b-[2rem] mb-6">
        <div>
          <p className="text-sm text-ink-light font-medium">{greeting.text.split(',')[0]},</p>
          <h1 className="text-2xl font-bold">Best! {greeting.icon}</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 bg-highlight hover:bg-highlight-alt text-paper rounded-full flex items-center justify-center shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {/* Content Wrapper */}
      <div className={`flex-1 p-6 lg:p-10 flex flex-col gap-10 max-w-[1600px] mx-auto w-full transition-opacity ${isPending ? 'opacity-85' : ''}`}>
        
        {/* PC/Tablet Header */}
        <div className="hidden md:flex justify-between items-center w-full">
           <div>
             <p className="text-ink-light font-medium text-lg">{greeting.text.split(',')[0]},</p>
             <h1 className="text-3xl font-bold">Best! {greeting.icon}</h1>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
           >
             <Plus size={20} strokeWidth={3} /> Add Task
           </button>
        </div>

        {/* Row 1: Schedule & Tasks */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Timeline & Schedule Panel */}
          <section className="flex-1 lg:max-w-md xl:max-w-lg flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
              📅 Today&apos;s Schedule
            </h2>

            <div className="flex-1 bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 relative">
              <div className="flex flex-col gap-6 relative">
                {todaySchedules && todaySchedules.length > 0 ? (
                  todaySchedules.map((schedule: ScheduleItem, index: number) => {
                    const isAllDay = !!schedule.isAllDay;
                    const startTimeStr = isAllDay 
                      ? "All Day" 
                      : new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const durationStr = isAllDay 
                      ? "Full Day" 
                      : calculateDuration(schedule.startTime, schedule.endTime);
                    return (
                      <TimeBlock 
                        key={schedule.id}
                        id={schedule.id}
                        time={startTimeStr} 
                        label={schedule.cost ? `${schedule.title} (💸 ${schedule.cost}฿)` : schedule.title} 
                        duration={durationStr} 
                        color={schedule.isFixedCost ? "bg-amber-100 border-2 border-amber-300 text-amber-900" : "bg-wheat text-ink"}
                        isFirst={index === 0}
                        isLast={index === todaySchedules.length - 1}
                      />
                    );
                  })
                ) : (
                  <div className="text-center text-ink-light py-10 font-medium">No schedules for today.</div>
                )}
              </div>
            </div>
          </section>

          {/* Task Management Panel */}
          <section className="flex-[1.5] flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
              🎯 Today&apos;s Focus (Nearest First)
            </h2>

            <div className="flex flex-col gap-5">
              {focusTasks && focusTasks.length > 0 ? (
                focusTasks.map((task: TaskItem) => (
                  <TaskCard 
                    key={task.id}
                    id={task.id}
                    title={task.title} 
                    tags={task.tags || []} 
                    deadline={task.deadline}
                    status={task.status}
                    subtasks={task.subtasks}
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

            {/* Daily Routine Checklist Widget */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
                🔄 Daily Routine (กิจวัตรประจำวัน)
              </h2>

              <div className="bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 flex flex-col gap-6">
                {todayRoutines && todayRoutines.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {/* Morning Period */}
                    {routinePeriods.morning.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-3 px-1">🌅 ช่วงเช้า (Morning)</h4>
                        <div className="flex flex-col gap-3">
                          {routinePeriods.morning.map((routine) => {
                            const completed = !!completedRoutines[routine.id];
                            const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={routine.id} className="flex items-center gap-3 bg-paper p-4 rounded-2xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer" onClick={() => handleToggleRoutine(routine.id)}>
                                <input 
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() => {}}
                                  className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>{routine.title}</p>
                                  <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Period */}
                    {routinePeriods.afternoon.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-3 px-1">☀️ ช่วงกลางวัน (Afternoon)</h4>
                        <div className="flex flex-col gap-3">
                          {routinePeriods.afternoon.map((routine) => {
                            const completed = !!completedRoutines[routine.id];
                            const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={routine.id} className="flex items-center gap-3 bg-paper p-4 rounded-2xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer" onClick={() => handleToggleRoutine(routine.id)}>
                                <input 
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() => {}}
                                  className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>{routine.title}</p>
                                  <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evening Period */}
                    {routinePeriods.evening.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-3 px-1">🌙 ช่วงเย็น-ค่ำ (Evening)</h4>
                        <div className="flex flex-col gap-3">
                          {routinePeriods.evening.map((routine) => {
                            const completed = !!completedRoutines[routine.id];
                            const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={routine.id} className="flex items-center gap-3 bg-paper p-4 rounded-2xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer" onClick={() => handleToggleRoutine(routine.id)}>
                                <input 
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() => {}}
                                  className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>{routine.title}</p>
                                  <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-ink-light py-8 font-medium">ไม่มีกิจวัตรสำหรับวันนี้</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
