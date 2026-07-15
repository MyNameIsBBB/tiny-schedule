"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CheckSquare, ListTodo, Circle, CheckCircle2 } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TimeBlock from '@/components/schedule/TimeBlock';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import AddScheduleModal from '@/components/schedule/AddScheduleModal';

interface TaskItem {
  id: string;
  title: string;
  tags?: string[];
  status: string;
  startDate?: Date | string | null;
  deadline: Date | string | null;
  subtasks?: { id: string; title: string; completed: boolean }[];
  [key: string]: unknown;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  isRoutine?: boolean;
  routineType?: string;
  routineDays?: number[];
  routineMonth?: number | null;
  isAllDay?: boolean;
  cost?: number | null;
  isFixedCost?: boolean;
  [key: string]: unknown;
}

export default function DashboardClient({ 
  initialTasks, 
  initialSchedules
}: { 
  initialTasks: TaskItem[]; 
  initialSchedules: ScheduleItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
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

  // Selected date YYYY-MM-DD string helper
  const getSelectedDateKey = () => {
    return selectedDate.toLocaleDateString('en-CA');
  };

  // Load routine checklist completions for the currently selected date
  useEffect(() => {
    const dateKey = getSelectedDateKey();
    const completions: { [key: string]: boolean } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`routine-${dateKey}-`)) {
        const routineId = key.replace(`routine-${dateKey}-`, '');
        completions[routineId] = localStorage.getItem(key) === 'true';
      }
    }
    setCompletedRoutines(completions);
  }, [selectedDate]);

  // Routine checkoff handler
  const handleToggleRoutine = (id: string) => {
    const dateKey = getSelectedDateKey();
    const key = `routine-${dateKey}-${id}`;
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

  // Calendar Helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const firstDayWeekday = firstDay.getDay(); // 0: Sun, 1: Mon...
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Padding previous month days
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Padding next month days to fill 42 cells (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Projection logic for normal schedules on a date
  const getSchedulesForDate = (date: Date) => {
    const cellDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return initialSchedules
      .filter((schedule) => {
        if (schedule.isRoutine) return false;
        const sStart = new Date(schedule.startTime);
        const sEnd = new Date(schedule.endTime);
        const startDate = new Date(sStart.getFullYear(), sStart.getMonth(), sStart.getDate());
        const endDate = new Date(sEnd.getFullYear(), sEnd.getMonth(), sEnd.getDate());
        return cellDate >= startDate && cellDate <= endDate;
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  };

  // Projection logic for repeating routines on a date
  const getRoutinesForDate = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0-6
    const dateOfMonth = date.getDate(); // 1-31
    const monthOfYear = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();

    return initialSchedules
      .filter((s) => {
        if (!s.isRoutine) return false;
        const days = Array.isArray(s.routineDays) ? s.routineDays : [];
        const routineType = s.routineType || "WEEKLY";

        if (routineType === "WEEKLY") {
          return days.includes(dayOfWeek);
        } else if (routineType === "MONTHLY") {
          if (days.length === 0) return false;
          const targetDay = days[0];
          const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
          const actualDay = Math.min(targetDay, daysInMonth);
          return dateOfMonth === actualDay;
        } else if (routineType === "YEARLY") {
          if (days.length === 0) return false;
          const targetDay = days[0];
          const targetMonth = s.routineMonth as number || 1;
          if (monthOfYear !== targetMonth) return false;
          
          const daysInMonth = new Date(year, targetMonth, 0).getDate();
          const actualDay = Math.min(targetDay, daysInMonth);
          return dateOfMonth === actualDay;
        }
        return false;
      })
      .sort((a, b) => {
        const aHours = new Date(a.startTime).getHours();
        const bHours = new Date(b.startTime).getHours();
        if (aHours !== bHours) return aHours - bHours;
        return new Date(a.startTime).getMinutes() - new Date(b.startTime).getMinutes();
      });
  };

  // Projection logic for tasks active on a date
  const getTasksForDate = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA');
    const cellDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return initialTasks.filter(task => {
      if (!task.deadline && !task.startDate) return false;
      
      if (task.startDate && task.deadline) {
        const s = new Date(task.startDate);
        const d = new Date(task.deadline);
        const sDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
        const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return cellDate >= sDate && cellDate <= dDate;
      }
      
      const singleDate = task.deadline ? new Date(task.deadline) : new Date(task.startDate!);
      const singleDateStr = singleDate.toLocaleDateString('en-CA');
      return singleDateStr === dateKey;
    });
  };

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

  // Selected Day Items
  const selectedSchedules = getSchedulesForDate(selectedDate);
  const selectedRoutines = getRoutinesForDate(selectedDate);
  const selectedTasks = getTasksForDate(selectedDate);

  const calendarDays = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('en-CA');
  const selectedDateStr = getSelectedDateKey();

  const formattedSelectedDateHeader = selectedDate.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <>
      <div className={`flex-1 p-4 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full transition-opacity ${isPending ? 'opacity-85' : ''}`}>
        
        {/* Responsive Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
          
          {/* LEFT: Calendar Section */}
          <section className="flex-1 flex flex-col bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 h-fit">
            
            {/* Calendar Header Controls */}
            <div className="flex justify-between items-center bg-paper px-4 py-3 rounded-2xl border border-wheat/60 shadow-sm mb-6 shrink-0">
              <h2 className="text-lg font-extrabold text-ink">{monthName}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-paper-dark text-ink rounded-xl border border-wheat cursor-pointer transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDate(today);
                  }}
                  className="px-3 py-2 bg-wheat hover:bg-wheat-dark text-ink font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-paper-dark text-ink rounded-xl border border-wheat cursor-pointer transition-colors"
                  title="Next Month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Apple Calendar Month Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-1.5 flex-1 min-w-0">
              {weekDays.map(d => (
                <div key={d} className="text-center font-extrabold text-[10px] sm:text-xs text-ink-light uppercase py-1 tracking-wider">
                  {d}
                </div>
              ))}

              {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                const cellDateKey = date.toLocaleDateString('en-CA');
                const isToday = cellDateKey === todayStr;
                const isSelected = cellDateKey === selectedDateStr;
                
                // Fetch counts to render minimal Apple-style dots
                const hasSchedules = getSchedulesForDate(date).length > 0;
                const hasRoutines = getRoutinesForDate(date).length > 0;
                const hasTasks = getTasksForDate(date).length > 0;
                
                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square min-h-[48px] md:min-h-[75px] bg-paper hover:bg-wheat/10 border-2 rounded-2xl p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer select-none group
                      ${isCurrentMonth ? 'border-wheat/40' : 'border-wheat/10 opacity-30'}
                      ${isSelected ? 'border-highlight shadow-sm bg-highlight/5' : 'hover:border-wheat-dark/30'}`}
                  >
                    {/* Day Number inside clean circle */}
                    <span className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-xs md:text-sm font-black rounded-full transition-colors
                      ${isToday ? 'bg-highlight text-paper shadow-sm' : isSelected ? 'bg-ink text-paper' : 'text-ink'}`}>
                      {date.getDate()}
                    </span>

                    {/* Apple Calendar Dots */}
                    <div className="flex gap-1 justify-center items-center h-2 overflow-hidden mb-1">
                      {hasSchedules && (
                        <span className="w-1.5 h-1.5 rounded-full bg-highlight shrink-0" title="Schedules" />
                      )}
                      {hasRoutines && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" title="Routines" />
                      )}
                      {hasTasks && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="Tasks" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT: Selected Day Agenda & Details */}
          <aside className="w-full lg:w-96 xl:w-[420px] shrink-0 flex flex-col gap-6">
            
            {/* Header / Greetings block */}
            <div className="bg-paper-dark rounded-[2rem] p-6 shadow-soft border border-wheat-dark/20 flex flex-col justify-between relative">
              <div>
                <p className="text-xs text-ink-light font-bold mb-0.5">{greeting.text.split(',')[0]},</p>
                <h1 className="text-2xl font-extrabold text-ink leading-tight">Best! {greeting.icon}</h1>
              </div>
              <div className="border-t border-wheat-dark/15 pt-3 mt-3">
                <span className="text-xs text-ink-light font-bold uppercase tracking-wider block mb-1">Selected Date</span>
                <p className="font-extrabold text-sm text-highlight">{formattedSelectedDateHeader}</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex gap-4">
              <button 
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex-1 bg-highlight hover:bg-highlight-alt text-paper px-4 py-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-soft transition-all hover:scale-103 active:scale-97 cursor-pointer text-sm"
              >
                <Plus size={16} strokeWidth={3} /> Add Block
              </button>
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="flex-1 bg-ink hover:bg-ink-light text-paper px-4 py-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-soft transition-all hover:scale-103 active:scale-97 cursor-pointer text-sm"
              >
                <Plus size={16} strokeWidth={3} /> Add Task
              </button>
            </div>

            {/* Detail Lists */}
            <div className="flex flex-col gap-6 max-h-[60vh] lg:max-h-none lg:overflow-visible overflow-y-auto pr-1">
              
              {/* routines */}
              <div>
                <h3 className="text-sm font-bold text-ink-light mb-3 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  🔄 Daily Routines ({selectedRoutines.length})
                </h3>
                <div className="bg-paper-dark rounded-[2rem] p-5 shadow-soft border border-wheat-dark/20 flex flex-col gap-3">
                  {selectedRoutines.length > 0 ? (
                    selectedRoutines.map((routine) => {
                      const completed = !!completedRoutines[routine.id];
                      const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const displayTitle = routine.cost 
                        ? `${routine.title} (💸 ${routine.cost}฿)` 
                        : routine.title;
                      return (
                        <div 
                          key={routine.id} 
                          onClick={() => handleToggleRoutine(routine.id)}
                          className="flex items-center gap-3 bg-paper p-3.5 rounded-xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer"
                        >
                          <span className="shrink-0 text-highlight">
                            {completed ? (
                              <CheckCircle2 size={20} fill="currentColor" className="text-highlight fill-paper" />
                            ) : (
                              <Circle size={20} strokeWidth={2.5} />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>
                              {displayTitle}
                            </p>
                            <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-ink-light font-bold">No routines for this day.</div>
                  )}
                </div>
              </div>

              {/* schedules */}
              <div>
                <h3 className="text-sm font-bold text-ink-light mb-3 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  📅 Schedule Blocks ({selectedSchedules.length})
                </h3>
                <div className="bg-paper-dark rounded-[2rem] p-5 shadow-soft border border-wheat-dark/20 flex flex-col gap-5">
                  {selectedSchedules.length > 0 ? (
                    selectedSchedules.map((schedule: ScheduleItem, index: number) => {
                      const isAllDay = !!schedule.isAllDay;
                      const startTimeStr = isAllDay 
                        ? "All Day" 
                        : new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const durationStr = isAllDay 
                        ? "Full Day" 
                        : calculateDuration(schedule.startTime, schedule.endTime);
                      
                      const displayTitle = schedule.cost 
                        ? `${schedule.title} (💸 ${schedule.cost}฿)` 
                        : schedule.title;
                      
                      return (
                        <TimeBlock 
                          key={schedule.id}
                          id={schedule.id}
                          time={startTimeStr} 
                          label={displayTitle} 
                          duration={durationStr} 
                          color={schedule.isFixedCost ? "bg-amber-100 border-2 border-amber-300 text-amber-900" : "bg-wheat text-ink"}
                          isFirst={index === 0}
                          isLast={index === selectedSchedules.length - 1}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-ink-light font-bold">No schedules for this day.</div>
                  )}
                </div>
              </div>

              {/* tasks */}
              <div>
                <h3 className="text-sm font-bold text-ink-light mb-3 px-1 flex items-center gap-1.5 uppercase tracking-wider">
                  🎯 Tasks Due ({selectedTasks.length})
                </h3>
                <div className="flex flex-col gap-4">
                  {selectedTasks.length > 0 ? (
                    selectedTasks.map((task: TaskItem) => (
                      <TaskCard 
                        key={task.id}
                        id={task.id}
                        title={task.title} 
                        tags={task.tags || []} 
                        startDate={task.startDate}
                        deadline={task.deadline}
                        status={task.status}
                        subtasks={task.subtasks}
                      />
                    ))
                  ) : (
                    <div className="bg-paper-dark rounded-[2rem] p-6 shadow-soft border border-wheat-dark/20 text-center text-xs text-ink-light font-bold">
                      No tasks due on this date.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Add Modals */}
      <AddTaskModal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        defaultDate={selectedDateStr}
      />
      <AddScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        defaultDate={selectedDateStr}
      />
    </>
  );
}
