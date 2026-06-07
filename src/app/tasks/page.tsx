import React from 'react';
import { getTasks } from '@/app/actions';
import TasksClient from '@/components/tasks/TasksClient';

export default async function TasksPage() {
  const res = await getTasks();
  const tasks = (res.success && res.data) ? res.data : [];

  return <TasksClient initialTasks={tasks} />;
}
