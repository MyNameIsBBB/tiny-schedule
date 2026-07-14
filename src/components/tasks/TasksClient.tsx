"use client";

import React, { useState, useTransition } from 'react';
import { Plus, CheckSquare, List, CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import AddTaskModal from './AddTaskModal';
import TaskCard from './TaskCard';
import { toggleTaskStatus } from '@/app/actions';
import { addToast } from '@/lib/notifications';

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

export default function TasksClient({ initialTasks }: { initialTasks: TaskItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

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

  const handleDayClick = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA');
    setSelectedDate(dateKey);
    setIsModalOpen(true);
  };

  const handleToggleTask = (taskId: string, currentStatus: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const res = await toggleTaskStatus(taskId, currentStatus);
      if (res.success && res.deleted) {
        addToast(`🎯 Task "${title}" completed & auto-deleted!`);
      }
    });
  };

  const calendarDays = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <>
      <div className={`p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10 transition-opacity ${isPending ? 'opacity-85' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">All Tasks</h1>
            <p className="text-xs text-ink-light font-semibold mt-0.5">Manage and check off your todos</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View switcher toggle */}
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
              <Plus size={18} strokeWidth={3} /> Add Task
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {initialTasks && initialTasks.length > 0 ? (
              initialTasks.map((task: TaskItem) => (
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
              <div className="col-span-full text-center text-ink-light py-20 bg-paper-dark rounded-[2.5rem] border-2 border-dashed border-wheat-dark cursor-pointer hover:bg-wheat/20 transition-colors flex flex-col items-center justify-center"
                   onClick={() => {
                     setSelectedDate(undefined);
                     setIsModalOpen(true);
                   }}>
                <div className="w-16 h-16 bg-wheat text-ink-light rounded-full flex items-center justify-center mb-4">
                  <CheckSquare size={32} />
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">No tasks found</h3>
                <p className="text-ink-light font-medium max-w-sm">You haven&apos;t added any tasks yet. Tap here to add your first task!</p>
              </div>
            )}
          </div>
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
                const dailyTasks = getTasksForDate(date);
                const displayTasks = dailyTasks.slice(0, 3);
                const extraCount = dailyTasks.length - 3;
                
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

                    {/* Task Checkbox List */}
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden mt-1.5">
                      {displayTasks.map((task) => {
                        const isCompleted = task.status === 'COMPLETED';
                        return (
                          <div 
                            key={task.id}
                            onClick={(e) => handleToggleTask(task.id, task.status, task.title, e)}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-all hover:bg-wheat/30 truncate text-left
                              ${isCompleted 
                                ? 'bg-wheat/40 text-ink-light border-wheat-dark/10 opacity-60 line-through' 
                                : 'bg-paper text-ink border-wheat-dark/25'}`}
                            title={task.title}
                          >
                            <span className="shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 size={10} className="text-highlight" />
                              ) : (
                                <Circle size={10} className="text-wheat-dark" />
                              )}
                            </span>
                            <span className="truncate flex-1">{task.title}</span>
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

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultDate={selectedDate}
      />
    </>
  );
}
