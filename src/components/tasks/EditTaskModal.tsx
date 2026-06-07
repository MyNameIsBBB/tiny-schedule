"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { updateTask } from '@/app/actions';

interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  tags?: string[];
  status: string;
  deadline: Date | string | null;
  subtasks?: SubtaskItem[];
}

export default function EditTaskModal({ 
  isOpen, 
  onClose,
  task
}: { 
  isOpen: boolean; 
  onClose: () => void;
  task: TaskItem;
}) {
  const [isPending, startTransition] = useTransition();
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>(task.subtasks || []);
  const [subtaskInput, setSubtaskInput] = useState("");

  useEffect(() => {
    setSubtasks(task.subtasks || []);
  }, [task]);

  if (!isOpen) return null;

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      formData.append("id", task.id);
      formData.append("subtasksJson", JSON.stringify(subtasks));
      await updateTask(formData);
      onClose();
    });
  }

  const handleAddSubtask = (e: React.MouseEvent) => {
    e.preventDefault();
    if (subtaskInput.trim()) {
      const newSub: SubtaskItem = {
        id: `new-${Date.now()}-${Math.random()}`,
        title: subtaskInput.trim(),
        completed: false
      };
      setSubtasks([...subtasks, newSub]);
      setSubtaskInput("");
    }
  };

  const handleRemoveSubtask = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSubtasks(subtasks.filter(sub => sub.id !== id));
  };

  const initialDateStr = task.deadline 
    ? new Date(task.deadline).toLocaleDateString('en-CA') 
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 box-border">
        <button onClick={onClose} className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1 rounded-full hover:bg-paper-dark transition-colors">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-ink">Edit Task</h2>
        
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Task Name</label>
            <input 
              name="title" 
              required 
              defaultValue={task.title}
              placeholder="e.g. Design UI Mockup"
              className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
            />
          </div>
          
          <div className="w-full">
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Tags (comma separated)</label>
            <input 
              name="tags" 
              defaultValue={task.tags?.join(", ") || ""}
              placeholder="e.g. Design, Urgent"
              className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Deadline</label>
            <input 
              type="date"
              name="deadline" 
              defaultValue={initialDateStr}
              className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium transition-colors box-border"
            />
          </div>

          {/* Subtasks Section */}
          <div className="border-t border-wheat-dark/20 pt-4 mt-2 w-full box-border">
            <label className="block text-sm font-bold text-ink-light mb-2 ml-2">Subtasks (งานย่อย)</label>
            
            <div className="flex gap-2 mb-3 w-full box-border">
              <input 
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Add subtask..."
                className="flex-1 min-w-0 bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-2 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
              />
              <button 
                onClick={handleAddSubtask}
                className="bg-wheat hover:bg-wheat-dark text-ink p-3 rounded-2xl transition-colors cursor-pointer shrink-0"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>

            {subtasks.length > 0 && (
              <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1 w-full box-border">
                {subtasks.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between bg-paper-dark/50 border border-wheat rounded-xl px-4 py-2 text-sm font-medium w-full box-border">
                    <span className={`text-ink break-all pr-2 ${sub.completed ? "line-through text-ink-light" : ""}`}>{sub.title}</span>
                    <button 
                      onClick={(e) => handleRemoveSubtask(sub.id, e)}
                      className="text-ink-light hover:text-red-500 transition-colors p-1 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="mt-6 w-full bg-highlight hover:bg-highlight-alt text-paper font-bold text-lg py-4 rounded-full shadow-soft transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer box-border"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
