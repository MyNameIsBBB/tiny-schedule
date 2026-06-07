import React from 'react';
import { getTasks, getSchedules, getTodayWater, getTodayExpenses, getWeeklyFixedCosts } from './actions';
import DashboardClient from '@/components/layout/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Dashboard() {
  const [tasksRes, schedulesRes, waterRes, expensesRes, fixedCostsRes] = await Promise.all([
    getTasks(),
    getSchedules(),
    getTodayWater(),
    getTodayExpenses(),
    getWeeklyFixedCosts()
  ]);

  const tasks = (tasksRes.success && tasksRes.data) ? tasksRes.data : [];
  const schedules = (schedulesRes.success && schedulesRes.data) ? schedulesRes.data : [];
  const waterMl = (waterRes.success && typeof waterRes.data === 'number') ? waterRes.data : 0;
  const expenses = (expensesRes.success && expensesRes.data) ? expensesRes.data : [];
  const fixedCosts = (fixedCostsRes.success && fixedCostsRes.data) ? fixedCostsRes.data : [];

  return (
    <DashboardClient 
      initialTasks={tasks} 
      initialSchedules={schedules} 
      initialWaterMl={waterMl}
      initialExpenses={expenses}
      weeklyFixedCosts={fixedCosts}
    />
  );
}
