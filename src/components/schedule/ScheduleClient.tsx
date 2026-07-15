"use client";

import React, { useState, useTransition } from 'react';
import { Plus, CalendarDays, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
import AddScheduleModal from './AddScheduleModal';
import EditScheduleModal from './EditScheduleModal';
import TimeBlock from './TimeBlock';
import { importSchedulesAction } from '@/app/actions';
import { addToast } from '@/lib/notifications';

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
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

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

    const getDatesInRange = (start: Date, end: Date) => {
      const dates: string[] = [];
      const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (current <= last) {
        dates.push(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
      }
      return dates;
    };

    // 1. Group normal schedules
    normalSchedules.forEach((schedule) => {
      const start = new Date(schedule.startTime);
      const end = new Date(schedule.endTime);
      const dates = getDatesInRange(start, end);
      
      dates.forEach((dateKey) => {
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(schedule);
      });
    });

    // 2. Project routines onto the current week's dates
    weekDates.forEach((date) => {
      const dayOfWeek = date.getDay();
      const dateKey = date.toLocaleDateString('en-CA');
      const dateOfMonth = date.getDate();
      const monthOfYear = date.getMonth() + 1; // 1-12
      const year = date.getFullYear();

      const activeRoutines = routineSchedules.filter(r => {
        const days = Array.isArray(r.routineDays) ? r.routineDays : [];
        const routineType = (r.routineType as string) || "WEEKLY";

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
          const targetMonth = r.routineMonth as number || 1;
          if (monthOfYear !== targetMonth) return false;
          
          const daysInMonth = new Date(year, targetMonth, 0).getDate();
          const actualDay = Math.min(targetDay, daysInMonth);
          return dateOfMonth === actualDay;
        }
        return false;
      });

      activeRoutines.forEach((routine) => {
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        const setTimeToDate = (targetDate: Date, timeDate: Date | string) => {
          const d = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
          const t = new Date(timeDate);
          d.setUTCHours(t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds(), t.getUTCMilliseconds());
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

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed || !Array.isArray(parsed)) {
        throw new Error("JSON must be an array of objects");
      }
      
      startTransition(async () => {
        const res = await importSchedulesAction(parsed);
        if (res.success) {
          addToast(`Successfully imported ${res.count} schedules!`);
          setIsImportModalOpen(false);
          setJsonInput("");
          setErrorMsg("");
        } else {
          setErrorMsg(res.error || "Failed to import schedules");
        }
      });
    } catch (e: any) {
      setErrorMsg(`Invalid JSON: ${e.message}`);
    }
  };

  return (
    <>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">My Schedule</h1>
            <p className="text-xs text-ink-light font-semibold mt-0.5">Plan your cozy days & habits</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-wheat hover:bg-wheat-dark text-ink px-5 py-3 rounded-full flex items-center gap-1.5 font-bold shadow-soft transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
            >
              Import JSON
            </button>
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

        {/* List View */}
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
                          : new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
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
                            onEdit={() => setEditingSchedule(schedule)}
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
        )}
      </div>

      <AddScheduleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultDate={selectedDate}
      />

      <EditScheduleModal 
        isOpen={!!editingSchedule} 
        onClose={() => setEditingSchedule(null)} 
        schedule={editingSchedule}
      />

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper w-full max-w-md rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative max-h-[90vh] flex flex-col box-border animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { 
                setIsImportModalOpen(false); 
                setErrorMsg(""); 
                setJsonInput(""); 
              }} 
              className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1.5 rounded-full hover:bg-paper-dark transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-2 text-ink">Import Schedules (JSON)</h2>
            <p className="text-xs text-ink-light font-semibold mb-4">Paste a JSON array of schedules to import them in bulk.</p>
            
            <button
              onClick={() => setJsonInput(JSON.stringify([
                {
                  "title": "VPS Subscription",
                  "startTime": "2026-07-15T00:00:00",
                  "endTime": "2026-07-15T23:59:00",
                  "isAllDay": true,
                  "isRoutine": true,
                  "routineType": "MONTHLY",
                  "routineDays": [30],
                  "cost": 150,
                  "isFixedCost": true
                },
                {
                  "title": "Weekly Gym Routine",
                  "startTime": "2026-07-15T18:00:00",
                  "endTime": "2026-07-15T19:30:00",
                  "isRoutine": true,
                  "routineType": "WEEKLY",
                  "routineDays": [1, 3, 5]
                }
              ], null, 2))}
              type="button"
              className="text-xs text-highlight hover:text-highlight-alt font-black mb-3 cursor-pointer self-start ml-2 bg-wheat/30 px-3 py-1.5 rounded-xl border border-wheat transition-colors"
            >
              💡 Load Example Template
            </button>

            <textarea
              className="flex-1 w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl p-4 outline-none text-ink font-mono text-[10px] placeholder:text-ink-light/50 transition-colors min-h-[250px] resize-none box-border"
              placeholder={`[\n  {\n    "title": "VPS Subscription",\n    "cost": 150,\n    "isFixedCost": true,\n    "isRoutine": true,\n    "routineType": "MONTHLY",\n    "routineDays": [30]\n  }\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            
            {errorMsg && (
              <p className="text-xs text-red-500 font-bold mt-2 ml-2">{errorMsg}</p>
            )}
            
            <button
              onClick={handleImportSubmit}
              disabled={isPending || !jsonInput.trim()}
              className="mt-6 w-full bg-highlight hover:bg-highlight-alt text-paper font-bold text-base py-3.5 rounded-full shadow-soft transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer box-border"
            >
              {isPending ? "Importing..." : "Import JSON"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
