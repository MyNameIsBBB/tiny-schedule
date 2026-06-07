import React from 'react';
import { getSchedules } from '@/app/actions';
import ScheduleClient from '@/components/schedule/ScheduleClient';

export default async function SchedulePage() {
  const res = await getSchedules();
  const schedules = (res.success && res.data) ? res.data : [];

  return <ScheduleClient initialSchedules={schedules} />;
}
