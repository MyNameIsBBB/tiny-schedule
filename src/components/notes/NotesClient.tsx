"use client";

import React, { useState, useTransition } from 'react';
import { Plus, Trash2, Edit, Search, X, FileText } from 'lucide-react';
import { createNote, updateNote, deleteNote } from '@/app/actions';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function NotesClient({ initialNotes }: { initialNotes: NoteItem[] }) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [imageUrlVal, setImageUrlVal] = useState("");
  const [isPending, startTransition] = useTransition();

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    return note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           note.content.toLowerCase().includes(searchQuery.toLowerCase());
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
    formData.append("imageUrl", imageUrlVal);
    
    startTransition(async () => {
      if (editingNote) {
        formData.append("id", editingNote.id);
        const res = await updateNote(formData);
        if (res.success) {
          const updatedTitle = formData.get("title") as string;
          const updatedContent = formData.get("content") as string;
          setNotes(prev => prev.map(n => n.id === editingNote.id ? { 
            ...n, 
            title: updatedTitle, 
            content: updatedContent, 
            imageUrl: imageUrlVal || null, 
            updatedAt: new Date().toISOString() 
          } : n));
          setIsModalOpen(false);
          setEditingNote(null);
          setImageUrlVal("");
        }
      } else {
        formData.append("type", "NOTE");
        const res = await createNote(formData);
        if (res.success) {
          window.location.reload();
        }
      }
    });
  };

  const openAddModal = () => {
    setEditingNote(null);
    setImageUrlVal("");
    setIsModalOpen(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNote(note);
    setImageUrlVal(note.imageUrl || "");
    setIsModalOpen(true);
  };

  const parseInlineMarkdown = (text: string) => {
    let t = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-ink">$1</strong>');
    t = t.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    return t;
  };

  const renderMarkdown = (text: string) => {
    if (!text) return "";
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = html.split('\n');
    let inList = false;
    let inOrderedList = false;
    
    const parsedLines = lines.map(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('### ')) {
        return `<h4 class="text-sm font-black text-ink mt-3 mb-1">${parseInlineMarkdown(trimmed.slice(4))}</h4>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h3 class="text-base font-black text-ink mt-4 mb-2">${parseInlineMarkdown(trimmed.slice(3))}</h3>`;
      }
      if (trimmed.startsWith('# ')) {
        return `<h2 class="text-lg font-black text-ink mt-5 mb-2">${parseInlineMarkdown(trimmed.slice(2))}</h2>`;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = parseInlineMarkdown(trimmed.slice(2));
        let prefix = '';
        if (!inList) {
          inList = true;
          prefix = '<ul class="list-disc pl-5 my-2 flex flex-col gap-1 text-ink-light font-medium">';
        }
        return prefix + `<li>${content}</li>`;
      } else if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
        inList = false;
        return '</ul>' + (line ? `<p class="mb-1">${parseInlineMarkdown(line)}</p>` : '<div class="h-2"></div>');
      }

      const olMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (olMatch) {
        const content = parseInlineMarkdown(olMatch[2]);
        let prefix = '';
        if (!inOrderedList) {
          inOrderedList = true;
          prefix = '<ol class="list-decimal pl-5 my-2 flex flex-col gap-1 text-ink-light font-medium">';
        }
        return prefix + `<li>${content}</li>`;
      } else if (inOrderedList && !trimmed.match(/^(\d+)\.\s(.*)/)) {
        inOrderedList = false;
        return '</ol>' + (line ? `<p class="mb-1">${parseInlineMarkdown(line)}</p>` : '<div class="h-2"></div>');
      }

      return line ? `<p class="mb-1">${parseInlineMarkdown(line)}</p>` : '<div class="h-2"></div>';
    });

    if (inList) parsedLines.push('</ul>');
    if (inOrderedList) parsedLines.push('</ol>');

    return parsedLines.join('\n');
  };

  return (
    <div className={`p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10 transition-opacity ${isPending ? 'opacity-75' : ''}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">My Notes</h1>
          <p className="text-ink-light text-sm mt-1">Keep track of ideas, specs, and random thoughts.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus size={20} strokeWidth={3} /> Add Note
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md mb-8">
        <span className="absolute inset-y-0 left-4 flex items-center text-ink-light/50">
          <Search size={18} />
        </span>
        <input 
          type="text" 
          placeholder="Search notes..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl pl-11 pr-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors"
        />
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
                {note.imageUrl && (
                  <div className="mb-5 overflow-hidden rounded-[1.8rem] border-2 border-wheat max-h-52 flex items-center justify-center bg-paper shadow-sm">
                    <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-ink pr-8">{note.title}</h3>
                  <span className="p-1.5 text-ink-light/40 group-hover:text-ink-light shrink-0">
                    <FileText size={20} />
                  </span>
                </div>
                
                {/* Flexible Markdown note content */}
                <div 
                  className="text-ink-light text-sm font-medium leading-relaxed markdown-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                />
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
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">No notes found</h3>
          <p className="text-ink-light font-medium max-w-sm">
            {searchQuery ? "No notes matching your search query." : "Start writing down your ideas!"}
          </p>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="bg-paper w-full max-w-lg rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 box-border">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 text-ink-light hover:text-ink cursor-pointer p-1 rounded-full hover:bg-paper-dark transition-colors"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-ink">
              {editingNote ? 'Edit Note' : 'Add Note'}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="w-full">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Title</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingNote?.title || ""}
                  placeholder="e.g. Project Ideas"
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Content (Supports markdown lists & bold)</label>
                <textarea 
                  name="content" 
                  required 
                  rows={6}
                  defaultValue={editingNote?.content || ""}
                  placeholder={"1. Think of ideas\n2. Write them down\n\n- Quick note\n- **Bold text**"}
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Image URL (Optional)</label>
                <input 
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={imageUrlVal}
                  onChange={(e) => setImageUrlVal(e.target.value)}
                  className="w-full max-w-full bg-paper-dark border-2 border-wheat focus:border-highlight rounded-2xl px-4 py-3 outline-none text-ink font-medium placeholder:text-ink-light/50 transition-colors box-border"
                />
              </div>

              <div className="w-full">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-2">Or Upload Image File</label>
                <div className="flex gap-3 items-center mt-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrlVal(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="note-image-upload"
                  />
                  <label 
                    htmlFor="note-image-upload"
                    className="bg-wheat hover:bg-wheat-dark text-ink font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-sm"
                  >
                    Choose Image...
                  </label>
                  {imageUrlVal && (
                    <button 
                      type="button"
                      onClick={() => setImageUrlVal("")}
                      className="bg-red-50 hover:bg-red-100 text-red-500 font-bold px-3 py-2.5 rounded-xl transition-colors text-sm cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                {imageUrlVal && (
                  <div className="mt-3 relative w-full h-32 rounded-2xl overflow-hidden border-2 border-wheat bg-paper flex items-center justify-center">
                    <img src={imageUrlVal} alt="Note Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isPending}
                className="mt-4 w-full bg-highlight hover:bg-highlight-alt text-paper font-bold text-lg py-4 rounded-full shadow-soft transition-transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 cursor-pointer box-border"
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
