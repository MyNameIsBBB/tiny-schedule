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

import { importTasksAction } from '@/app/actions';
import { X } from 'lucide-react';

export default function TasksClient({ initialTasks }: { initialTasks: TaskItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed || !Array.isArray(parsed)) {
        throw new Error("JSON must be an array of objects");
      }
      
      startTransition(async () => {
        const res = await importTasksAction(parsed);
        if (res.success) {
          addToast(`Successfully imported ${res.count} tasks!`);
          setIsImportModalOpen(false);
          setJsonInput("");
          setErrorMsg("");
        } else {
          setErrorMsg(res.error || "Failed to import tasks");
        }
      });
    } catch (e: any) {
      setErrorMsg(`Invalid JSON: ${e.message}`);
    }
  };

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
            <h2 className="text-2xl font-bold mb-2 text-ink">Import Tasks (JSON)</h2>
            <p className="text-xs text-ink-light font-semibold mb-4">Paste a JSON array of tasks to import them in bulk.</p>
            
            <button
              onClick={() => setJsonInput(JSON.stringify([
                {
                  "title": "Design Landing Page Mockup",
                  "status": "TODO",
                  "startDate": "2026-07-15",
                  "deadline": "2026-07-20",
                  "tags": ["Design", "Urgent"],
                  "subtasks": [
                    { "title": "Research styles", "completed": true },
                    { "title": "Sketch wireframe", "completed": false }
                  ]
                },
                {
                  "title": "Refactor API Controllers",
                  "status": "IN_PROGRESS",
                  "tags": ["Backend"]
                }
              ], null, 2))}
              type="button"
              className="text-xs text-highlight hover:text-highlight-alt font-black mb-3 cursor-pointer self-start ml-2 bg-wheat/30 px-3 py-1.5 rounded-xl border border-wheat transition-colors"
            >
              💡 Load Example Template
            </button>

            <textarea
              className="flex-1 w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl p-4 outline-none text-ink font-mono text-[10px] placeholder:text-ink-light/50 transition-colors min-h-[250px] resize-none box-border"
              placeholder={`[\n  {\n    "title": "Clean codebase",\n    "status": "TODO",\n    "tags": ["Urgent"],\n    "subtasks": [\n      { "title": "Check types", "completed": false }\n    ]\n  }\n]`}
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
