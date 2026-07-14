import React from 'react';
import { getTasks, getSchedules } from './actions';
import DashboardClient from '@/components/layout/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const [tasksRes, schedulesRes] = await Promise.all([
    getTasks(),
    getSchedules()
  ]);

  const tasks = (tasksRes.success && tasksRes.data) ? tasksRes.data : [];
  const schedules = (schedulesRes.success && schedulesRes.data) ? schedulesRes.data : [];

  return (
    <DashboardClient 
      initialTasks={tasks} 
      initialSchedules={schedules} 
    />
  );
}
