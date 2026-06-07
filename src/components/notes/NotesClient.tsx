"use client";

import React, { useState, useTransition } from 'react';
import { Plus, Trash2, Edit, Cpu, Code, Search, X } from 'lucide-react';
import { createNote, updateNote, deleteNote } from '@/app/actions';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: string; // 'SPEC' or 'SANDBOX'
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function NotesClient({ initialNotes }: { initialNotes: NoteItem[] }) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [activeTab, setActiveTab] = useState<'SPEC' | 'SANDBOX'>('SPEC');
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter notes based on active tab and search query
  const filteredNotes = notes.filter(note => {
    const matchesTab = note.type === activeTab;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      startTransition(async () => {
        const res = await deleteNote(id);
        if (res.success) {
          setNotes(prev => prev.filter(n => n.id !== id));
        }
      });
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      if (editingNote) {
        formData.append("id", editingNote.id);
        const res = await updateNote(formData);
        if (res.success) {
          const updatedTitle = formData.get("title") as string;
          const updatedContent = formData.get("content") as string;
          setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, title: updatedTitle, content: updatedContent, updatedAt: new Date().toISOString() } : n));
          setIsModalOpen(false);
          setEditingNote(null);
        }
      } else {
        formData.append("type", activeTab);
        const res = await createNote(formData);
        if (res.success) {
          // Just reload or refetch, since we don't return the new id, we can push to list or do a hard refresh.
          // For immediate client update, let's refresh page or just update client state:
          // Because we don't have the new ID immediately from createNote in actions.ts, let's trigger window.location.reload()
          // or we could fetch again. Since it's Next.js server action revalidatePath, reloading is fast, or we can just reload:
          window.location.reload();
        }
      }
    });
  };

  const openAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  return (
    <div className={`p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10 transition-opacity ${isPending ? 'opacity-75' : ''}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">Geeky Notes</h1>
          <p className="text-ink-light text-sm mt-1">Keep track of computer specs, server configs, and sandbox API tests.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={20} strokeWidth={3} /> Add Note
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8">
        {/* Tab Buttons */}
        <div className="bg-paper-dark p-1 rounded-2xl border border-wheat-dark/25 flex gap-1 self-start">
          <button 
            onClick={() => setActiveTab('SPEC')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all duration-200
              ${activeTab === 'SPEC' ? 'bg-wheat text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
          >
            <Cpu size={16} /> Spec & Configs
          </button>
          <button 
            onClick={() => setActiveTab('SANDBOX')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all duration-200
              ${activeTab === 'SANDBOX' ? 'bg-wheat text-ink shadow-soft' : 'text-ink-light hover:text-ink'}`}
          >
            <Code size={16} /> API & Sandbox
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:max-w-xs">
          <span className="absolute inset-y-0 left-4 flex items-center text-ink-light/50">
            <Search size={18} />
          </span>
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl pl-11 pr-4 py-2.5 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotes.map((note) => (
            <div 
              key={note.id} 
              className={`bg-paper-dark border-2 border-wheat rounded-[2.5rem] p-6 lg:p-8 flex flex-col justify-between shadow-soft hover:shadow-md transition-all group relative`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-ink pr-8">{note.title}</h3>
                  <span className="p-1.5 text-ink-light/40 group-hover:text-ink-light shrink-0">
                    {activeTab === 'SPEC' ? <Cpu size={20} /> : <Code size={20} />}
                  </span>
                </div>
                
                {/* Note Content */}
                {note.type === 'SANDBOX' ? (
                  // Sandbox notes: display as code snippet
                  <pre className="bg-ink/5 text-ink text-xs font-mono p-4 rounded-2xl overflow-x-auto border border-wheat-dark/25 max-h-48 leading-relaxed whitespace-pre-wrap">
                    <code>{note.content}</code>
                  </pre>
                ) : (
                  // Spec notes: display as parsed spec grid if it has key-value structure, or raw text
                  <div className="text-ink-light text-sm font-medium leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-wheat/60">
                <span className="text-xs text-ink-light/60 font-semibold">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(note)}
                    className="p-2 hover:bg-wheat rounded-xl text-ink transition-colors cursor-pointer"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-ink-light py-24 bg-paper-dark rounded-[2.5rem] border-2 border-dashed border-wheat-dark/40 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-wheat text-ink-light rounded-full flex items-center justify-center mb-4">
            {activeTab === 'SPEC' ? <Cpu size={32} /> : <Code size={32} />}
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">No notes found</h3>
          <p className="text-ink-light font-medium max-w-sm">
            {searchQuery ? "No notes matching your search query." : `Start tracking your ${activeTab === 'SPEC' ? 'PC/Server specs' : 'code snippets'}!`}
          </p>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="bg-paper w-full max-w-lg rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1 rounded-full hover:bg-paper-dark transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-ink">
              {editingNote ? 'Edit Note' : `Add ${activeTab === 'SPEC' ? 'Spec & Config' : 'API Sandbox'} Note`}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Title</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingNote?.title || ""}
                  placeholder={activeTab === 'SPEC' ? "e.g. Home Lab Server" : "e.g. Next.js Fetch Snippet"}
                  className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-5 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Content</label>
                <textarea 
                  name="content" 
                  required 
                  rows={activeTab === 'SANDBOX' ? 10 : 6}
                  defaultValue={editingNote?.content || ""}
                  placeholder={activeTab === 'SPEC' ? 
                    "CPU: AMD Ryzen 5 3600\nRAM: 32GB DDR4\nOS: Ubuntu Server 22.04\nStorage: 1TB NVMe" : 
                    "fetch('https://api.example.com/v1/data')\n  .then(res => res.json())\n  .then(data => console.log(data))"
                  }
                  className={`w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-5 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors ${activeTab === 'SANDBOX' ? 'font-mono text-sm' : ''}`}
                />
              </div>

              <button 
                type="submit" 
                disabled={isPending}
                className="mt-6 bg-highlight hover:bg-highlight-alt text-paper font-bold text-lg py-4 rounded-full shadow-soft transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? 'Saving...' : 'Save Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
