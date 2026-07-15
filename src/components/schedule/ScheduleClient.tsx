"use client";

import React, { useState, useTransition } from 'react';
import { Plus, CalendarDays, ChevronLeft, ChevronRight, List, LayoutGrid, X } from 'lucide-react';
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
  
  // Timeline View States
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [timelinePivot, setTimelinePivot] = useState<Date>(new Date());

  // Helper to compare dates at midnight local time
  const getMidnightDate = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Get dates for the selected timeline week
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

  // Timeline calculations
  const weekDates = getTimelineWeekDates(timelinePivot);
  const startOfWeek = getMidnightDate(weekDates[0]);
  const endOfWeek = getMidnightDate(weekDates[6]);
  const todayStr = new Date().toLocaleDateString('en-CA');

  const timelineSchedules = initialSchedules.filter(s => {
    if (s.isRoutine) return false;
    const sStart = getMidnightDate(s.startTime);
    const sEnd = getMidnightDate(s.endTime);
    return sStart <= endOfWeek && sEnd >= startOfWeek;
  });

  const timelineRoutines = initialSchedules.filter(s => !!s.isRoutine);

  const getGridSpan = (startTime: Date | string, endTime: Date | string) => {
    const start = getMidnightDate(startTime);
    const end = getMidnightDate(endTime);

    // Find start index (0 to 6)
    let startIdx = 0;
    if (start >= startOfWeek) {
      startIdx = weekDates.findIndex(d => getMidnightDate(d).getTime() === start.getTime());
    }

    // Find end index (0 to 6)
    let endIdx = 6;
    if (end <= endOfWeek) {
      endIdx = weekDates.findIndex(d => getMidnightDate(d).getTime() === end.getTime());
    }

    if (startIdx === -1) startIdx = 0;
    if (endIdx === -1) endIdx = 6;

    return {
      startCol: startIdx + 3,
      endCol: endIdx + 4,
      isContinuedStart: start < startOfWeek,
      isContinuedEnd: end > endOfWeek
    };
  };

  const getTimelineWeekLabel = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">My Schedule</h1>
            <p className="text-xs text-ink-light font-semibold mt-0.5">Plan your cozy days & habits</p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* View Switcher Toggle */}
            <div className="flex bg-wheat/30 p-1 rounded-2xl border border-wheat-dark/25">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                  ${viewMode === 'list' ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
              >
                <List size={14} /> List
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                  ${viewMode === 'timeline' ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
              >
                <LayoutGrid size={14} /> Timeline
              </button>
            </div>

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
        {viewMode === 'list' && (
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
          )
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="flex flex-col gap-6">
            {/* Week navigation */}
            <div className="flex justify-between items-center bg-paper-dark px-6 py-4 rounded-[2rem] border border-wheat-dark/25 shadow-soft">
              <h2 className="text-base font-extrabold text-ink">{getTimelineWeekLabel()}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimelinePivot(new Date(timelinePivot.getFullYear(), timelinePivot.getMonth(), timelinePivot.getDate() - 7))}
                  className="p-2 hover:bg-wheat/20 text-ink rounded-xl border border-wheat cursor-pointer transition-colors"
                  title="Previous Week"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setTimelinePivot(new Date())}
                  className="px-3 py-2 bg-wheat hover:bg-wheat-dark text-ink font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  This Week
                </button>
                <button
                  onClick={() => setTimelinePivot(new Date(timelinePivot.getFullYear(), timelinePivot.getMonth(), timelinePivot.getDate() + 7))}
                  className="p-2 hover:bg-wheat/20 text-ink rounded-xl border border-wheat cursor-pointer transition-colors"
                  title="Next Week"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="bg-paper rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 overflow-x-auto">
              <div className="min-w-[900px] flex flex-col gap-2">
                {/* Header Row */}
                <div className="grid grid-cols-9 gap-3 border-b border-wheat-dark/20 pb-4 mb-2">
                  <div className="col-span-2 font-bold text-ink-light text-xs uppercase tracking-wider pl-2 self-end">Schedule Item</div>
                  {weekDates.map((d, idx) => {
                    const dateStr = d.toLocaleDateString('en-CA');
                    const isToday = dateStr === new Date().toLocaleDateString('en-CA');
                    return (
                      <div key={idx} className="col-span-1 text-center flex flex-col items-center">
                        <span className="text-[10px] uppercase font-black text-ink-light tracking-wide">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                        <span className={`w-7 h-7 flex items-center justify-center text-xs font-black rounded-full mt-1.5 transition-colors
                          ${isToday ? 'bg-highlight text-paper shadow-sm' : 'text-ink'}`}>
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Rows Content */}
                {timelineSchedules.length === 0 && timelineRoutines.filter(r => weekDates.some(d => routineOccursOnDate(r, d))).length === 0 ? (
                  <div className="text-center py-20 text-ink-light font-bold text-sm bg-paper-dark/30 rounded-3xl border-2 border-dashed border-wheat-dark/20">
                    No active schedule blocks for this week.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Normal schedules */}
                    {timelineSchedules.map((schedule) => {
                      const span = getGridSpan(schedule.startTime, schedule.endTime);
                      if (!span) return null;

                      const isAllDay = !!schedule.isAllDay;
                      const timeStr = isAllDay
                        ? "All Day"
                        : `${new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} - ${new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}`;
                      
                      const durationStr = isAllDay
                        ? "Full Day"
                        : calculateDuration(schedule.startTime, schedule.endTime);

                      const isFixed = !!schedule.isFixedCost;
                      const bgClass = isFixed 
                        ? "bg-amber-100 hover:bg-amber-200/70 border-amber-300 text-amber-950" 
                        : "bg-wheat hover:bg-wheat-dark/50 border-wheat-dark text-ink";

                      return (
                        <div key={schedule.id} className="grid grid-cols-9 gap-3 items-center py-2 hover:bg-wheat/10 rounded-2xl transition-colors">
                          <div className="col-span-2 pl-2 pr-4 min-w-0">
                            <h4 className="font-bold text-xs text-ink truncate" title={schedule.title}>{schedule.title}</h4>
                            <p className="text-[9px] text-ink-light font-bold mt-0.5">
                              {schedule.cost ? `💸 ${schedule.cost}฿` : "No cost"}
                            </p>
                          </div>
                          
                          {/* Spanning Bar */}
                          <div 
                            style={{ 
                              gridColumnStart: span.startCol, 
                              gridColumnEnd: span.endCol 
                            }}
                            onClick={() => setEditingSchedule(schedule)}
                            className={`col-span-1 rounded-full p-2 border shadow-soft cursor-pointer transition-all flex flex-col justify-center items-center text-center relative group min-h-[46px] select-none
                              ${bgClass}
                              ${span.isContinuedStart ? 'rounded-l-none border-l-dashed border-l-4' : ''}
                              ${span.isContinuedEnd ? 'rounded-r-none border-r-dashed border-r-4' : ''}`}
                          >
                            <span className="font-extrabold text-[10px] sm:text-xs leading-tight truncate w-full px-1">{schedule.title}</span>
                            <span className="text-[8px] font-bold opacity-85 mt-0.5">{timeStr} ({durationStr})</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Routines */}
                    {timelineRoutines.map((routine) => {
                      const activeDays = weekDates.map((d, index) => ({
                        date: d,
                        index,
                        isActive: routineOccursOnDate(routine, d)
                      })).filter(x => x.isActive);

                      if (activeDays.length === 0) return null;

                      return (
                        <div key={routine.id} className="grid grid-cols-9 gap-3 items-center py-2 hover:bg-wheat/10 rounded-2xl transition-colors">
                          <div className="col-span-2 pl-2 pr-4 min-w-0">
                            <h4 className="font-bold text-xs text-ink truncate" title={routine.title}>🔄 {routine.title}</h4>
                            <p className="text-[9px] text-ink-light font-bold mt-0.5">
                              {routine.cost ? `💸 ${routine.cost}฿` : "Routine"}
                            </p>
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
                                onClick={() => setEditingSchedule(routine)}
                                className="rounded-full p-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-950 shadow-soft cursor-pointer transition-all flex flex-col justify-center items-center text-center min-h-[46px] select-none"
                              >
                                <span className="font-extrabold text-[10px] leading-tight truncate w-full px-1">{routine.title}</span>
                                <span className="text-[8px] font-bold opacity-85 mt-0.5">{timeStr}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
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
