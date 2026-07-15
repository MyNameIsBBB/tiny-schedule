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
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className={`p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10 transition-opacity ${isPending ? 'opacity-85' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink">All Tasks</h1>
            <p className="text-xs text-ink-light font-semibold mt-0.5">Manage and check off your todos</p>
          </div>

          <div className="flex items-center gap-3">
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

        {/* List View */}
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
      </div>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultDate={selectedDate}
      />
    </>
  );
}
