"use client";

import React, { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import AddScheduleModal from './AddScheduleModal';
import TimeBlock from './TimeBlock';

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  [key: string]: unknown;
}

export default function ScheduleClient({ initialSchedules }: { initialSchedules: ScheduleItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group schedules by Date
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

        {dateKeys.length > 0 ? (
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
               onClick={() => setIsModalOpen(true)}>
            <div className="w-16 h-16 bg-wheat text-ink-light rounded-full flex items-center justify-center mb-4">
              <CalendarDays size={32} />
            </div>
            <h3 className="text-xl font-bold text-ink mb-2">Your schedule is empty</h3>
            <p className="text-ink-light font-medium max-w-sm">Tap here to plan your day and create your first time block.</p>
          </div>
        )}
      </div>

      <AddScheduleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
