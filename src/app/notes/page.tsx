import React from 'react';
import { getNotes } from '@/app/actions';
import NotesClient from '@/components/notes/NotesClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotesPage() {
  const res = await getNotes();
  const notes = (res.success && res.data) ? res.data : [];

  return <NotesClient initialNotes={notes} />;
}
