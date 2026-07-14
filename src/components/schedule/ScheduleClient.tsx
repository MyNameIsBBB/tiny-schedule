"use client";

import React, { useState } from 'react';
import { Plus, CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import AddScheduleModal from './AddScheduleModal';
import TimeBlock from './TimeBlock';

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  isRoutine?: boolean;
  routineDays?: number[];
  isAllDay?: boolean;
  cost?: number | null;
  isFixedCost?: boolean;
  [key: string]: unknown;
}

export default function ScheduleClient({ initialSchedules }: { initialSchedules: ScheduleItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Group schedules by Date for the List View
  const groupSchedulesByDate = () => {
    const normalSchedules = initialSchedules.filter(s => !s.isRoutine);
    const routineSchedules = initialSchedules.filter(s => !!s.isRoutine);

    // Get dates for the current week (Monday to Sunday)
    const today = new Date();
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

    const groups: { [key: string]: ScheduleItem[] } = {};

    // 1. Group normal schedules
    normalSchedules.forEach((schedule) => {
      const dateKey = new Date(schedule.startTime).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(schedule);
    });

    // 2. Project routines onto the current week's dates
    weekDates.forEach((date) => {
      const dayOfWeek = date.getDay();
      const dateKey = date.toLocaleDateString('en-CA');

      const activeRoutines = routineSchedules.filter(r => {
        const days = Array.isArray(r.routineDays) ? r.routineDays : [];
        return days.includes(dayOfWeek);
      });

      activeRoutines.forEach((routine) => {
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        const setTimeToDate = (targetDate: Date, timeDate: Date | string) => {
          const d = new Date(targetDate);
          const t = new Date(timeDate);
          d.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
          return d;
        };

        const startTimeProj = setTimeToDate(date, routine.startTime);
        const endTimeProj = setTimeToDate(date, routine.endTime);

        groups[dateKey].push({
          ...routine,
          startTime: startTimeProj,
          endTime: endTimeProj,
          title: `🔄 ${routine.title}`
        });
      });
    });

    // Sort each group by time
    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
    });

    return groups;
  };

  const scheduleGroups = groupSchedulesByDate();
  const dateKeys = Object.keys(scheduleGroups).sort();

  const getFriendlyDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // Prevent timezone shift
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
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

  const getSchedulesForDate = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA');
    const dayOfWeek = date.getDay();
    
    // Normal schedules
    const normal = initialSchedules.filter(s => {
      if (s.isRoutine) return false;
      const sDateStr = new Date(s.startTime).toLocaleDateString('en-CA');
      return sDateStr === dateKey;
    });
    
    // Repeat routines
    const routines = initialSchedules.filter(s => {
      if (!s.isRoutine) return false;
      const days = Array.isArray(s.routineDays) ? s.routineDays : [];
      return days.includes(dayOfWeek);
    }).map(r => {
      const setTimeToDate = (targetDate: Date, timeDate: Date | string) => {
        const d = new Date(targetDate);
        const t = new Date(timeDate);
        d.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds());
        return d;
      };
      return {
        ...r,
        startTime: setTimeToDate(date, r.startTime),
        endTime: setTimeToDate(date, r.endTime),
        title: `🔄 ${r.title}`
      };
    });
    
    return [...normal, ...routines].sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  };

  const handleDayClick = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA');
    setSelectedDate(dateKey);
    setIsModalOpen(true);
  };

  const calendarDays = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">My Schedule</h1>
            <p className="text-xs text-ink-light font-semibold mt-0.5">Plan your cozy days & habits</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher Toggle */}
            <div className="flex bg-wheat/40 p-1 rounded-2xl border border-wheat-dark/30 shadow-inner">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                  ${viewMode === 'list' ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
              >
                <List size={14} /> List
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                  ${viewMode === 'calendar' ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
              >
                <CalendarDays size={14} /> Calendar
              </button>
            </div>

            <button 
              onClick={() => {
                setSelectedDate(undefined);
                setIsModalOpen(true);
              }}
              className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
            >
              <Plus size={18} strokeWidth={3} /> Add Block
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* List View */
          dateKeys.length > 0 ? (
            <div className="flex flex-col gap-10">
              {dateKeys.map((dateKey) => {
                const items = scheduleGroups[dateKey];
                return (
                  <div key={dateKey} className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-wheat/30 rounded-2xl w-fit">
                      <CalendarDays size={18} className="text-highlight" />
                      <h3 className="font-bold text-sm text-ink-light uppercase tracking-wider">
                        {getFriendlyDate(dateKey)}
                      </h3>
                    </div>

                    <div className="bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 relative">
                      <div className="flex flex-col gap-6 relative">
                        {items.map((schedule, index) => {
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
                          const isFixed = !!schedule.isFixedCost;
                          return (
                            <TimeBlock 
                              key={schedule.id}
                              id={schedule.id}
                              time={startTimeStr} 
                              label={displayTitle} 
                              duration={durationStr} 
                              color={isFixed ? "bg-amber-100 border-2 border-amber-300 text-amber-900" : "bg-wheat text-ink"}
                              isFirst={index === 0}
                              isLast={index === items.length - 1}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-paper-dark rounded-[2.5rem] p-10 py-20 shadow-soft border-2 border-dashed border-wheat-dark/30 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-wheat/10 transition-colors"
                 onClick={() => {
                   setSelectedDate(undefined);
                   setIsModalOpen(true);
                 }}>
              <div className="w-16 h-16 bg-wheat text-ink-light rounded-full flex items-center justify-center mb-4">
                <CalendarDays size={32} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Your schedule is empty</h3>
              <p className="text-ink-light font-medium max-w-sm">Tap here to plan your day and create your first time block.</p>
            </div>
          )
        ) : (
          /* Monthly Calendar View */
          <div className="bg-paper-dark rounded-[2.5rem] p-6 sm:p-8 shadow-soft border border-wheat-dark/20 flex flex-col gap-6">
            {/* Calendar Controls */}
            <div className="flex justify-between items-center bg-paper px-4 py-3 rounded-2xl border border-wheat/60 shadow-sm">
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
                  onClick={() => setCurrentDate(new Date())}
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

            {/* Grid Layout */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Day headers */}
              {weekDays.map(d => (
                <div key={d} className="text-center font-extrabold text-[10px] sm:text-xs text-ink-light uppercase py-2 tracking-wider">
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                const cellDateKey = date.toLocaleDateString('en-CA');
                const isToday = cellDateKey === todayStr;
                const dailyItems = getSchedulesForDate(date);
                const displayItems = dailyItems.slice(0, 3);
                const extraCount = dailyItems.length - 3;
                
                return (
                  <div 
                    key={idx}
                    onClick={() => handleDayClick(date)}
                    className={`min-h-[75px] sm:min-h-[105px] bg-paper hover:bg-wheat/10 border-2 rounded-2xl p-1.5 sm:p-2.5 flex flex-col transition-all cursor-pointer select-none group
                      ${isCurrentMonth ? 'border-wheat/40' : 'border-wheat/10 opacity-40'}
                      ${isToday ? 'border-highlight shadow-sm' : 'hover:border-wheat-dark/30'}`}
                  >
                    {/* Day number */}
                    <div className="flex justify-between items-center mb-1">
                      <span className={`w-5 h-5 flex items-center justify-center text-xs font-black rounded-full
                        ${isToday ? 'bg-highlight text-paper shadow-sm' : 'text-ink'}`}>
                        {date.getDate()}
                      </span>
                      <Plus size={12} className="text-highlight opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Schedule Badges */}
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1.5">
                      {displayItems.map((item) => {
                        const timeStr = item.isAllDay 
                          ? "All Day" 
                          : new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        return (
                          <div 
                            key={item.id}
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded-lg truncate text-left border
                              ${item.isFixedCost 
                                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                : 'bg-wheat/60 text-ink border-wheat-dark/20'}`}
                            title={`${timeStr} - ${item.title}`}
                          >
                            <span className="opacity-80 mr-0.5 font-normal">{timeStr}:</span> {item.title}
                          </div>
                        );
                      })}
                      {extraCount > 0 && (
                        <div className="text-[8px] font-black text-highlight text-right pr-1">
                          +{extraCount} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AddScheduleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultDate={selectedDate}
      />
    </>
  );
}
