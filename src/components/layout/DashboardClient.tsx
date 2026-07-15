"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CheckSquare, Circle, CheckCircle2, LayoutGrid, X } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import AddScheduleModal from '@/components/schedule/AddScheduleModal';
import EditScheduleModal from '@/components/schedule/EditScheduleModal';
import { deleteSchedule, deleteTask, toggleTaskStatus } from '@/app/actions';

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
  const [isMobileAgendaOpen, setIsMobileAgendaOpen] = useState(false);
  const [completedRoutines, setCompletedRoutines] = useState<{ [key: string]: boolean }>({});
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Timeline states
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');
  const [timelinePivot, setTimelinePivot] = useState<Date>(new Date());

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

  // Timeline Helpers
  const getMidnightDate = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const getTimelineWeekDates = (pivot: Date) => {
    const today = new Date(pivot);
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const routineOccursOnDate = (routine: ScheduleItem, date: Date) => {
    const dayOfWeek = date.getDay(); // 0: Sun, 1: Mon...
    const dateOfMonth = date.getDate();
    const monthOfYear = date.getMonth() + 1;
    const year = date.getFullYear();
    const days = Array.isArray(routine.routineDays) ? routine.routineDays : [];
    const routineType = (routine.routineType as string) || "WEEKLY";

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
      const targetMonth = routine.routineMonth as number || 1;
      if (monthOfYear !== targetMonth) return false;
      
      const daysInMonth = new Date(year, targetMonth, 0).getDate();
      const actualDay = Math.min(targetDay, daysInMonth);
      return dateOfMonth === actualDay;
    }
    return false;
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
    const cellDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    
    return initialSchedules
      .filter((schedule) => {
        if (schedule.isRoutine) return false;
        const sStart = new Date(schedule.startTime);
        const sEnd = new Date(schedule.endTime);
        const startDate = new Date(Date.UTC(sStart.getUTCFullYear(), sStart.getUTCMonth(), sStart.getUTCDate()));
        const endDate = new Date(Date.UTC(sEnd.getUTCFullYear(), sEnd.getUTCMonth(), sEnd.getUTCDate()));
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
        const aHours = new Date(a.startTime).getUTCHours();
        const bHours = new Date(b.startTime).getUTCHours();
        if (aHours !== bHours) return aHours - bHours;
        return new Date(a.startTime).getUTCMinutes() - new Date(b.startTime).getUTCMinutes();
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

  // Reusable rendering function for the daily agenda contents
  const renderAgendaListContent = () => {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Routines section */}
        <div>
          <h3 className="text-xs font-bold text-ink-light mb-3 px-1 flex items-center gap-1.5 uppercase tracking-wider">
            🔄 Daily Routines ({selectedRoutines.length})
          </h3>
          <div className="flex flex-col gap-3">
            {selectedRoutines.length > 0 ? (
              selectedRoutines.map((routine) => {
                const completed = !!completedRoutines[routine.id];
                const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                const displayTitle = routine.cost 
                  ? `${routine.title} (💸 ${routine.cost}฿)` 
                  : routine.title;
                
                return (
                  <div 
                    key={routine.id} 
                    onClick={() => handleToggleRoutine(routine.id)}
                    className="flex items-center gap-3 bg-emerald-50/60 p-4 rounded-r-2xl rounded-l-md border border-emerald-100/50 border-l-4 border-l-emerald-500 shadow-soft transition-all hover:bg-emerald-100/40 cursor-pointer"
                  >
                    <span className="shrink-0 text-emerald-600">
                      {completed ? (
                        <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Circle size={20} strokeWidth={2.5} className="text-emerald-500" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm leading-snug text-emerald-950 ${completed ? 'line-through opacity-60 font-medium' : ''}`}>
                        {displayTitle}
                      </p>
                      <p className="text-[10px] text-emerald-700/80 font-bold mt-1">🕒 Time: {timeStr}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-ink-light font-bold bg-paper-dark/30 rounded-2xl border border-wheat-dark/15">
                No routines for this day.
              </div>
            )}
          </div>
        </div>

        {/* Schedules section */}
        <div>
          <h3 className="text-xs font-bold text-ink-light mb-3 px-1 flex items-center gap-1.5 uppercase tracking-wider">
            📅 Schedule Blocks ({selectedSchedules.length})
          </h3>
          <div className="flex flex-col gap-3">
            {selectedSchedules.length > 0 ? (
              selectedSchedules.map((schedule) => {
                const isAllDay = !!schedule.isAllDay;
                const startTimeStr = isAllDay 
                  ? "All Day" 
                  : new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                const endTimeStr = isAllDay 
                  ? "" 
                  : new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                const durationStr = isAllDay 
                  ? "Full Day" 
                  : calculateDuration(schedule.startTime, schedule.endTime);
                
                const displayTitle = schedule.cost 
                  ? `${schedule.title} (💸 ${schedule.cost}฿)` 
                  : schedule.title;

                const isFixed = !!schedule.isFixedCost;
                const bgClass = isFixed ? "bg-amber-50/80 border-amber-200 text-amber-950" : "bg-orange-50/80 border-orange-200 text-ink";
                const borderLClass = isFixed ? "border-l-amber-500" : "border-l-highlight";
                const textTimeClass = isFixed ? "text-amber-800/80" : "text-highlight/90";

                return (
                  <div 
                    key={schedule.id}
                    className={`group flex flex-col gap-1.5 p-4 rounded-r-2xl rounded-l-md border border-l-4 shadow-soft transition-all hover:translate-x-0.5 ${bgClass} ${borderLClass}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm sm:text-base leading-tight">{displayTitle}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-white/60 rounded-full shrink-0">{durationStr}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs font-bold ${textTimeClass}`}>
                        🕒 {isAllDay ? "All Day Event" : `${startTimeStr} - ${endTimeStr}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSchedule(schedule);
                            setIsMobileAgendaOpen(false);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-highlight hover:text-highlight-alt font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this block?")) {
                              startTransition(async () => {
                                await deleteSchedule(schedule.id);
                              });
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-ink-light font-bold bg-paper-dark/30 rounded-2xl border border-wheat-dark/15">
                No schedules for this day.
              </div>
            )}
          </div>
        </div>

        {/* Tasks section */}
        <div>
          <h3 className="text-xs font-bold text-ink-light mb-3 px-1 flex items-center gap-1.5 uppercase tracking-wider">
            🎯 Tasks Due ({selectedTasks.length})
          </h3>
          <div className="flex flex-col gap-3">
            {selectedTasks.length > 0 ? (
              selectedTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const startStr = task.startDate 
                  ? new Date(task.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : null;
                const endStr = task.deadline 
                  ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : null;
                
                const timeStr = startStr && endStr 
                  ? `${startStr} - ${endStr}`
                  : endStr 
                  ? `Due by ${endStr}`
                  : startStr
                  ? `Starts ${startStr}`
                  : "No date set";

                return (
                  <div 
                    key={task.id}
                    className="flex items-start gap-3 bg-sky-50/60 p-4 rounded-r-2xl rounded-l-md border border-sky-100/50 border-l-4 border-l-sky-500 shadow-soft transition-all hover:bg-sky-100/40"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(async () => {
                          await toggleTaskStatus(task.id, task.status);
                        });
                      }}
                      className="mt-1 shrink-0 text-sky-600 hover:scale-110 transition-transform cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={20} className="text-sky-600 fill-sky-50" />
                      ) : (
                        <Circle size={20} strokeWidth={2.5} className="text-sky-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm leading-snug text-sky-950 ${isCompleted ? 'line-through opacity-60 font-medium' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-sky-700/80 font-bold mt-1">📅 Time: {timeStr}</p>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-white/60 text-sky-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this task?")) {
                            startTransition(async () => {
                              await deleteTask(task.id);
                            });
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-ink-light font-bold bg-paper-dark/30 rounded-2xl border border-wheat-dark/15">
                No tasks due on this date.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Timeline calculations for Dashboard
  const dbWeekDates = getTimelineWeekDates(timelinePivot);
  const dbStartOfWeek = getMidnightDate(dbWeekDates[0]);
  const dbEndOfWeek = getMidnightDate(dbWeekDates[6]);
  const dbTodayStr = new Date().toLocaleDateString('en-CA');

  // Filter schedules active this week
  const dbTimelineSchedules = initialSchedules.filter(s => {
    if (s.isRoutine) return false;
    const sStart = getMidnightDate(s.startTime);
    const sEnd = getMidnightDate(s.endTime);
    return sStart <= dbEndOfWeek && sEnd >= dbStartOfWeek;
  });

  const dbTimelineRoutines = initialSchedules.filter(s => !!s.isRoutine);

  // Filter tasks active this week
  const dbTimelineTasks = initialTasks.filter(t => {
    const start = t.startDate ? getMidnightDate(t.startDate) : (t.deadline ? getMidnightDate(t.deadline) : null);
    const end = t.deadline ? getMidnightDate(t.deadline) : (t.startDate ? getMidnightDate(t.startDate) : null);
    if (!start || !end) return false;
    return start <= dbEndOfWeek && end >= dbStartOfWeek;
  });

  const getDbGridSpan = (startTime: Date | string, endTime: Date | string) => {
    const start = getMidnightDate(startTime);
    const end = getMidnightDate(endTime);

    // Find start index (0 to 6)
    let startIdx = 0;
    if (start >= dbStartOfWeek) {
      startIdx = dbWeekDates.findIndex(d => getMidnightDate(d).getTime() === start.getTime());
    }

    // Find end index (0 to 6)
    let endIdx = 6;
    if (end <= dbEndOfWeek) {
      endIdx = dbWeekDates.findIndex(d => getMidnightDate(d).getTime() === end.getTime());
    }

    if (startIdx === -1) startIdx = 0;
    if (endIdx === -1) endIdx = 6;

    return {
      startCol: startIdx + 3,
      endCol: endIdx + 4,
      isContinuedStart: start < dbStartOfWeek,
      isContinuedEnd: end > dbEndOfWeek
    };
  };

  const getDbTaskGridSpan = (startDate: Date | string | null | undefined, deadline: Date | string | null | undefined) => {
    const start = startDate ? getMidnightDate(startDate) : (deadline ? getMidnightDate(deadline) : null);
    const end = deadline ? getMidnightDate(deadline) : (startDate ? getMidnightDate(startDate) : null);
    if (!start || !end) return null;

    // Find start index (0 to 6)
    let startIdx = 0;
    if (start >= dbStartOfWeek) {
      startIdx = dbWeekDates.findIndex(d => getMidnightDate(d).getTime() === start.getTime());
    }

    // Find end index (0 to 6)
    let endIdx = 6;
    if (end <= dbEndOfWeek) {
      endIdx = dbWeekDates.findIndex(d => getMidnightDate(d).getTime() === end.getTime());
    }

    if (startIdx === -1) startIdx = 0;
    if (endIdx === -1) endIdx = 6;

    return {
      startCol: startIdx + 3,
      endCol: endIdx + 4,
      isContinuedStart: start < dbStartOfWeek,
      isContinuedEnd: end > dbEndOfWeek
    };
  };

  const getDbTimelineWeekLabel = () => {
    const start = dbWeekDates[0];
    const end = dbWeekDates[6];
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <>
      <div className={`flex-1 p-4 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full transition-opacity ${isPending ? 'opacity-85' : ''}`}>
        
        {/* Responsive Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">
          
          {/* LEFT: Calendar Section */}
          <section className="flex-1 flex flex-col bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 h-fit">
            
            {/* Calendar Header Controls */}
            <div className="flex justify-between items-center bg-paper px-4 py-3 rounded-2xl border border-wheat/60 shadow-sm mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-extrabold text-ink">{viewMode === 'month' ? monthName : "Weekly Timeline"}</h2>
                
                {/* View Switcher Toggle */}
                <div className="flex bg-wheat/30 p-0.5 rounded-xl border border-wheat-dark/20 ml-2">
                  <button
                    onClick={() => setViewMode('month')}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                      ${viewMode === 'month' ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('timeline');
                      setTimelinePivot(selectedDate);
                    }}
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer
                      ${viewMode === 'timeline' ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
                  >
                    Timeline
                  </button>
                </div>
              </div>

              {viewMode === 'month' && (
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
                      setTimelinePivot(today);
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
              )}
            </div>

            {/* Apple Calendar Month Grid */}
            {viewMode === 'month' && (
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
                      onClick={() => {
                        setSelectedDate(date);
                        setTimelinePivot(date);
                        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                          setIsMobileAgendaOpen(true);
                        }
                      }}
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
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="flex flex-col gap-6 flex-1 min-h-0">
                {/* Week Selector / Header info */}
                <div className="flex justify-between items-center bg-paper px-4 py-3 rounded-2xl border border-wheat/60 shadow-sm shrink-0">
                  <h2 className="text-xs sm:text-sm font-extrabold text-ink">{getDbTimelineWeekLabel()}</h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTimelinePivot(new Date(timelinePivot.getFullYear(), timelinePivot.getMonth(), timelinePivot.getDate() - 7))}
                      className="p-1 hover:bg-paper-dark text-ink rounded-lg border border-wheat cursor-pointer transition-colors"
                      title="Previous Week"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        setTimelinePivot(today);
                        setSelectedDate(today);
                      }}
                      className="px-2 py-1 bg-wheat hover:bg-wheat-dark text-ink font-bold text-[9px] rounded-lg cursor-pointer transition-colors"
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => setTimelinePivot(new Date(timelinePivot.getFullYear(), timelinePivot.getMonth(), timelinePivot.getDate() + 7))}
                      className="p-1 hover:bg-paper-dark text-ink rounded-lg border border-wheat cursor-pointer transition-colors"
                      title="Next Week"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Grid */}
                <div className="bg-paper rounded-[2.5rem] p-4 lg:p-6 shadow-soft border border-wheat-dark/20 overflow-x-auto flex-1">
                  <div className="min-w-[800px] flex flex-col gap-4">
                    {/* Header Columns */}
                    <div className="grid grid-cols-9 gap-2 border-b border-wheat-dark/20 pb-3 mb-1">
                      <div className="col-span-2 font-bold text-ink-light text-[10px] uppercase tracking-wider pl-1 self-end">Item details</div>
                      {dbWeekDates.map((d, idx) => {
                        const dateStr = d.toLocaleDateString('en-CA');
                        const isToday = dateStr === new Date().toLocaleDateString('en-CA');
                        const isSelected = dateStr === selectedDate.toLocaleDateString('en-CA');
                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setSelectedDate(d);
                              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                                setIsMobileAgendaOpen(true);
                              }
                            }}
                            className={`col-span-1 text-center flex flex-col items-center cursor-pointer p-1 rounded-xl transition-all
                              ${isSelected ? 'bg-highlight/5 border border-highlight/20' : 'hover:bg-wheat/20'}`}
                          >
                            <span className="text-[9px] uppercase font-black text-ink-light tracking-wide">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            <span className={`w-6 h-6 flex items-center justify-center text-xs font-black rounded-full mt-1 transition-colors
                              ${isToday ? 'bg-highlight text-paper shadow-sm' : 'text-ink'}`}>
                              {d.getDate()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Timeline Data */}
                    {dbTimelineSchedules.length === 0 && dbTimelineTasks.length === 0 && dbTimelineRoutines.filter(r => dbWeekDates.some(d => routineOccursOnDate(r, d))).length === 0 ? (
                      <div className="text-center py-16 text-ink-light font-bold text-xs bg-paper-dark/30 rounded-3xl border-2 border-dashed border-wheat-dark/20">
                        No active schedules or tasks for this week.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {/* Tasks Section */}
                        {dbTimelineTasks.length > 0 && (
                          <div className="flex flex-col gap-2.5">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">🎯 Tasks</h3>
                            <div className="flex flex-col gap-2">
                              {dbTimelineTasks.map((task) => {
                                const span = getDbTaskGridSpan(task.startDate, task.deadline);
                                if (!span) return null;

                                const isCompleted = task.status === 'COMPLETED';
                                const bgClass = isCompleted 
                                  ? "bg-slate-100/50 border-slate-200 text-slate-400 line-through" 
                                  : "bg-sky-50 hover:bg-sky-100/70 border-sky-200 text-sky-950";

                                return (
                                  <div key={task.id} className="grid grid-cols-9 gap-2 items-center py-1 hover:bg-wheat/10 rounded-xl transition-colors">
                                    <div className="col-span-2 pl-1 pr-3 min-w-0">
                                      <h4 className={`font-bold text-[11px] text-ink truncate ${isCompleted ? 'line-through opacity-50' : ''}`} title={task.title}>{task.title}</h4>
                                      <p className="text-[8px] text-ink-light font-bold mt-0.5 uppercase tracking-wide">
                                        {task.status}
                                      </p>
                                    </div>
                                    
                                    {/* Spanning Bar */}
                                    <div 
                                      style={{ 
                                        gridColumnStart: span.startCol, 
                                        gridColumnEnd: span.endCol 
                                      }}
                                      onClick={() => {
                                        setSelectedDate(task.deadline ? new Date(task.deadline) : (task.startDate ? new Date(task.startDate) : new Date()));
                                      }}
                                      className={`col-span-1 rounded-xl p-1.5 border shadow-soft cursor-pointer transition-all flex flex-col justify-center items-center text-center relative min-h-[38px] select-none
                                        ${bgClass}
                                        ${span.isContinuedStart ? 'rounded-l-none border-l-dashed border-l-2' : ''}
                                        ${span.isContinuedEnd ? 'rounded-r-none border-r-dashed border-r-2' : ''}`}
                                    >
                                      <span className="font-extrabold text-[9px] sm:text-[10px] leading-tight truncate w-full px-1">{task.title}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Schedules Section */}
                        {(dbTimelineSchedules.length > 0 || dbTimelineRoutines.filter(r => dbWeekDates.some(d => routineOccursOnDate(r, d))).length > 0) && (
                          <div className="flex flex-col gap-2.5 border-t border-wheat-dark/15 pt-4">
                            <h3 className="text-[10px] font-black text-highlight uppercase tracking-widest pl-1">📅 Schedules</h3>
                            <div className="flex flex-col gap-2">
                              {/* Normal schedules */}
                              {dbTimelineSchedules.map((schedule) => {
                                const span = getDbGridSpan(schedule.startTime, schedule.endTime);
                                if (!span) return null;

                                const isAllDay = !!schedule.isAllDay;
                                const timeStr = isAllDay
                                  ? "All Day"
                                  : `${new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}`;

                                const isFixed = !!schedule.isFixedCost;
                                const bgClass = isFixed 
                                  ? "bg-amber-100 hover:bg-amber-200/70 border-amber-200 text-amber-950" 
                                  : "bg-wheat hover:bg-wheat-dark/50 border-wheat-dark text-ink";

                                return (
                                  <div key={schedule.id} className="grid grid-cols-9 gap-2 items-center py-1 hover:bg-wheat/10 rounded-xl transition-colors">
                                    <div className="col-span-2 pl-1 pr-3 min-w-0">
                                      <h4 className="font-bold text-[11px] text-ink truncate" title={schedule.title}>{schedule.title}</h4>
                                      <p className="text-[8px] text-ink-light font-bold mt-0.5">
                                        {schedule.cost ? `💸 ${schedule.cost}฿` : "Schedule"}
                                      </p>
                                    </div>
                                    
                                    {/* Spanning Bar */}
                                    <div 
                                      style={{ 
                                        gridColumnStart: span.startCol, 
                                        gridColumnEnd: span.endCol 
                                      }}
                                      onClick={() => setEditingSchedule(schedule)}
                                      className={`col-span-1 rounded-xl p-1.5 border shadow-soft cursor-pointer transition-all flex flex-col justify-center items-center text-center relative min-h-[38px] select-none
                                        ${bgClass}
                                        ${span.isContinuedStart ? 'rounded-l-none border-l-dashed border-l-2' : ''}
                                        ${span.isContinuedEnd ? 'rounded-r-none border-r-dashed border-r-2' : ''}`}
                                    >
                                      <span className="font-extrabold text-[9px] sm:text-[10px] leading-tight truncate w-full px-1">{schedule.title}</span>
                                      <span className="text-[7px] font-bold opacity-80 mt-0.5">{timeStr}</span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Routines */}
                              {dbTimelineRoutines.map((routine) => {
                                const activeDays = dbWeekDates.map((d, index) => ({
                                  date: d,
                                  index,
                                  isActive: routineOccursOnDate(routine, d)
                                })).filter(x => x.isActive);

                                if (activeDays.length === 0) return null;

                                return (
                                  <div key={routine.id} className="grid grid-cols-9 gap-2 items-center py-1 hover:bg-wheat/10 rounded-xl transition-colors">
                                    <div className="col-span-2 pl-1 pr-3 min-w-0">
                                      <h4 className="font-bold text-[11px] text-ink truncate" title={routine.title}>🔄 {routine.title}</h4>
                                      <p className="text-[8px] text-ink-light font-bold mt-0.5">Routine</p>
                                    </div>

                                    {activeDays.map((ad) => {
                                      const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
                                      return (
                                        <div
                                          key={ad.index}
                                          style={{
                                            gridColumnStart: ad.index + 3,
                                            gridColumnEnd: ad.index + 4
                                          }}
                                          onClick={() => {
                                            setSelectedDate(ad.date);
                                            handleToggleRoutine(routine.id);
                                          }}
                                          className="rounded-xl p-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-950 shadow-soft cursor-pointer transition-all flex flex-col justify-center items-center text-center min-h-[38px] select-none"
                                        >
                                          <span className="font-extrabold text-[9px] leading-tight truncate w-full px-1">{routine.title}</span>
                                          <span className="text-[7px] font-bold opacity-80 mt-0.5">{timeStr}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT: Selected Day Agenda & Details (Shown only on Desktop/Tablet screen sizes) */}
          <aside className="hidden lg:flex w-full lg:w-96 xl:w-[420px] shrink-0 flex-col gap-6">
            
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
              {renderAgendaListContent()}
            </div>
          </aside>

        </div>
      </div>

      {/* MOBILE AGENDA DETAIL MODAL */}
      {isMobileAgendaOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-paper w-full max-w-lg rounded-[2.5rem] shadow-xl border-2 border-wheat-dark p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 box-border">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsMobileAgendaOpen(false)} 
              className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1.5 rounded-full hover:bg-paper-dark transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            
            <h2 className="text-xl font-black text-ink mb-1 mt-2">Day Details</h2>
            <p className="text-xs font-bold text-highlight mb-6">{formattedSelectedDateHeader}</p>
            
            {/* Scrollable Agenda List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
              {renderAgendaListContent()}
            </div>
            
            {/* Quick Add buttons at bottom */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-wheat-dark/15">
              <button 
                onClick={() => {
                  setIsScheduleModalOpen(true);
                  setIsMobileAgendaOpen(false);
                }}
                className="flex-1 bg-highlight hover:bg-highlight-alt text-paper px-4 py-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-soft transition-all hover:scale-103 active:scale-97 cursor-pointer text-sm"
              >
                <Plus size={16} strokeWidth={3} /> Add Block
              </button>
              <button 
                onClick={() => {
                  setIsTaskModalOpen(true);
                  setIsMobileAgendaOpen(false);
                }}
                className="flex-1 bg-ink hover:bg-ink-light text-paper px-4 py-3.5 rounded-full flex items-center justify-center gap-1.5 font-bold shadow-soft transition-all hover:scale-103 active:scale-97 cursor-pointer text-sm"
              >
                <Plus size={16} strokeWidth={3} /> Add Task
              </button>
            </div>
          </div>
        </div>
      )}

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
      <EditScheduleModal 
        isOpen={!!editingSchedule} 
        onClose={() => setEditingSchedule(null)} 
        schedule={editingSchedule}
      />
    </>
  );
}
