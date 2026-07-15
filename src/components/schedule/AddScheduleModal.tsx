"use client";

import React, { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { createSchedule } from '@/app/actions';

export default function AddScheduleModal({ 
  isOpen, 
  onClose,
  defaultDate
}: { 
  isOpen: boolean; 
  onClose: () => void;
  defaultDate?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRoutine, setIsRoutine] = useState(false);
  const [routineDays, setRoutineDays] = useState<number[]>([]);
  const [routineType, setRoutineType] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');
  const [monthlyDay, setMonthlyDay] = useState(new Date().getDate());
  const [yearlyMonth, setYearlyMonth] = useState(new Date().getMonth() + 1);
  const [yearlyDay, setYearlyDay] = useState(new Date().getDate());

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createSchedule(formData);
      onClose();
    });
  }

  const todayStr = defaultDate || new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local time

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 box-border">
        <button onClick={onClose} className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1 rounded-full hover:bg-paper-dark transition-colors">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-ink">New Time Block</h2>
        
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Block Name</label>
            <input 
              name="title" 
              required 
              autoFocus
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
                defaultValue={todayStr}
                className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">End Date</label>
              <input 
                type="date"
                name="endDate" 
                required 
                defaultValue={todayStr}
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
                <p className="text-[11px] text-ink-light">Check this for weekly recurring schedules (e.g. Morning Routine)</p>
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
                  defaultValue="09:00"
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">End Time</label>
                <input 
                  type="time"
                  name="endTime" 
                  required={!isAllDay}
                  defaultValue="10:00"
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
                />
              </div>
            </div>
          )}

          <div className="border-t border-wheat-dark/20 pt-4 mt-2 flex flex-col gap-4 w-full box-border">
            <div className="flex items-center justify-between px-2 w-full box-border">
              <div>
                <label className="block text-sm font-bold text-ink">Is Fixed Cost? / Subscription</label>
                <p className="text-[11px] text-ink-light">Mark this block as a recurring monthly expense (e.g. VPS, Netflix)</p>
              </div>
              <input 
                type="checkbox"
                name="isFixedCost"
                value="true"
                className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
              />
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Cost (฿)</label>
              <input 
                type="number"
                step="0.01"
                name="cost" 
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
            {isPending ? 'Saving...' : 'Add Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
}
