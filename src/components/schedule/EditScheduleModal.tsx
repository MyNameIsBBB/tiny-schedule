"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { X } from 'lucide-react';
import { updateSchedule } from '@/app/actions';

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

export default function EditScheduleModal({ 
  isOpen, 
  onClose,
  schedule
}: { 
  isOpen: boolean; 
  onClose: () => void;
  schedule: ScheduleItem | null;
}) {
  const [isPending, startTransition] = useTransition();
  
  // Local states matching the inputs
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRoutine, setIsRoutine] = useState(false);
  const [routineType, setRoutineType] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');
  const [routineDays, setRoutineDays] = useState<number[]>([]);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [yearlyMonth, setYearlyMonth] = useState(1);
  const [yearlyDay, setYearlyDay] = useState(1);

  // Sync state with schedule when it opens/updates
  useEffect(() => {
    if (schedule) {
      setIsAllDay(!!schedule.isAllDay);
      setIsRoutine(!!schedule.isRoutine);
      const rType = (schedule.routineType as 'WEEKLY' | 'MONTHLY' | 'YEARLY') || 'WEEKLY';
      setRoutineType(rType);
      
      const days = Array.isArray(schedule.routineDays) ? schedule.routineDays : [];
      if (rType === 'WEEKLY') {
        setRoutineDays(days);
      } else if (rType === 'MONTHLY') {
        setMonthlyDay(days[0] || 1);
      } else if (rType === 'YEARLY') {
        setYearlyDay(days[0] || 1);
      }
      setYearlyMonth(schedule.routineMonth || 1);
    }
  }, [schedule, isOpen]);

  if (!isOpen || !schedule) return null;

  // Helper date/time formatters
  const formatDate = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
  };

  const formatTime = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    return d.toISOString().split('T')[1].substring(0, 5); // HH:MM in UTC
  };

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateSchedule(schedule!.id, formData);
      if (res.success) {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 box-border">
        <button onClick={onClose} className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1 rounded-full hover:bg-paper-dark transition-colors">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-ink">Edit Time Block</h2>
        
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Block Name</label>
            <input 
              name="title" 
              required 
              autoFocus
              defaultValue={schedule.title}
              placeholder="e.g. Deep Work: Code Review"
              className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 w-full box-border">
            <div className="min-w-0">
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Start Date</label>
              <input 
                type="date"
                name="startDate" 
                required 
                defaultValue={formatDate(schedule.startTime)}
                className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">End Date</label>
              <input 
                type="date"
                name="endDate" 
                required 
                defaultValue={formatDate(schedule.endTime)}
                className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
              />
            </div>
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center justify-between px-2 py-1 w-full box-border">
            <div>
              <label className="block text-sm font-bold text-ink">All Day Event (เต็มวัน)</label>
              <p className="text-[11px] text-ink-light">Check this if the event has no specific time bounds</p>
            </div>
            <input 
              type="checkbox"
              name="isAllDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Is Routine Checkbox */}
          <div className="flex flex-col gap-2 px-2 py-1.5 w-full box-border border-t border-wheat-dark/15 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-ink">Is Repeating Routine? (กิจวัตรประจำวัน)</label>
                <p className="text-[11px] text-ink-light">Check this for weekly, monthly, or yearly recurring schedules</p>
              </div>
              <input 
                type="checkbox"
                name="isRoutine"
                checked={isRoutine}
                onChange={(e) => setIsRoutine(e.target.checked)}
                className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
              />
            </div>
            {isRoutine && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex bg-wheat/30 p-1 rounded-2xl border border-wheat-dark/25 w-full">
                  {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRoutineType(type)}
                      className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                        ${routineType === type ? 'bg-paper text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
                    >
                      {type === 'WEEKLY' ? 'Weekly' : type === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                    </button>
                  ))}
                </div>

                {routineType === 'WEEKLY' && (
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold text-ink-light ml-1">Repeat on Days (เลือกวัน):</label>
                    <div className="flex justify-between gap-1 w-full">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                        const selected = routineDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                setRoutineDays(routineDays.filter(d => d !== idx));
                              } else {
                                setRoutineDays([...routineDays, idx]);
                              }
                            }}
                            className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all cursor-pointer
                              ${selected 
                                ? 'bg-highlight border-highlight text-paper shadow-sm' 
                                : 'bg-paper-dark border-wheat text-ink-light hover:bg-wheat/10'}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {routineType === 'MONTHLY' && (
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label className="block text-xs font-bold text-ink-light ml-1">Every month on day (ทุกวันที่):</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={monthlyDay}
                        onChange={(e) => setMonthlyDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                        className="w-20 bg-paper-dark border-2 border-wheat focus:border-highlight rounded-xl px-3 py-2 outline-none text-ink font-medium transition-colors"
                      />
                      <span className="text-[10px] text-ink-light leading-tight">(เดือนไหนไม่มี เช่น 30 ก.พ. จะถือว่าเป็นวันสุดท้ายของเดือนนั้น)</span>
                    </div>
                  </div>
                )}

                {routineType === 'YEARLY' && (
                  <div className="flex gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-ink-light ml-1 mb-1">Month (เดือน):</label>
                      <select
                        value={yearlyMonth}
                        onChange={(e) => setYearlyMonth(parseInt(e.target.value))}
                        className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-xl px-3 py-2 outline-none text-ink font-semibold transition-colors"
                      >
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                          <option key={idx} value={idx + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-bold text-ink-light ml-1 mb-1">Day (วันที่):</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={yearlyDay}
                        onChange={(e) => setYearlyDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                        className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-xl px-3 py-2 outline-none text-ink font-medium transition-colors"
                      />
                    </div>
                  </div>
                )}

                <input type="hidden" name="routineType" value={routineType} />
                <input 
                  type="hidden" 
                  name="routineDays" 
                  value={
                    routineType === 'WEEKLY' 
                      ? routineDays.join(',') 
                      : routineType === 'MONTHLY' 
                      ? monthlyDay 
                      : yearlyDay
                  } 
                />
                <input 
                  type="hidden" 
                  name="routineMonth" 
                  value={routineType === 'YEARLY' ? yearlyMonth : ''} 
                />
              </div>
            )}
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4 w-full box-border">
              <div className="min-w-0">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Start Time</label>
                <input 
                  type="time"
                  name="startTime" 
                  required={!isAllDay}
                  defaultValue={formatTime(schedule.startTime)}
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">End Time</label>
                <input 
                  type="time"
                  name="endTime" 
                  required={!isAllDay}
                  defaultValue={formatTime(schedule.endTime)}
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
                />
              </div>
            </div>
          )}

          <div className="border-t border-wheat-dark/20 pt-4 mt-2 flex flex-col gap-4 w-full box-border">
            <div className="flex items-center justify-between px-2 w-full box-border">
              <div>
                <label className="block text-sm font-bold text-ink">Is Fixed Cost? / Subscription</label>
                <p className="text-[11px] text-ink-light">Mark this block as a recurring monthly expense</p>
              </div>
              <input 
                type="checkbox"
                name="isFixedCost"
                value="true"
                defaultChecked={!!schedule.isFixedCost}
                className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
              />
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Cost (฿)</label>
              <input 
                type="number"
                step="0.01"
                name="cost" 
                defaultValue={schedule.cost || ''}
                placeholder="e.g. 150"
                className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="mt-6 w-full bg-highlight hover:bg-highlight-alt text-paper font-bold text-lg py-4 rounded-full shadow-soft transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer box-border"
          >
            {isPending ? 'Saving...' : 'Update Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
}
