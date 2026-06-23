"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Plus, CheckCircle2, Droplet, Clock, Play, Pause,
  RotateCcw, AlertCircle, X, Sparkles, Wallet
} from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import TimeBlock from '@/components/schedule/TimeBlock';
import AddTaskModal from '@/components/tasks/AddTaskModal';
import { logWater, logQuickExpense } from '@/app/actions';

interface TaskItem {
  id: string;
  title: string;
  tags?: string[];
  status: string;
  deadline: Date | string | null;
  subtasks?: { id: string; title: string; completed: boolean }[];
  [key: string]: unknown;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Date | string;
  endTime: Date | string;
  cost?: number | null;
  isFixedCost?: boolean;
  isAllDay?: boolean;
  [key: string]: unknown;
}

interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  title: string;
  date: Date | string;
}

interface ExpensePreset {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  category: string;
}

export default function DashboardClient({ 
  initialTasks, 
  initialSchedules,
  initialWaterMl = 0,
  initialExpenses = [],
  weeklyFixedCosts = []
}: { 
  initialTasks: TaskItem[]; 
  initialSchedules: ScheduleItem[];
  initialWaterMl?: number;
  initialExpenses?: ExpenseItem[];
  weeklyFixedCosts?: ScheduleItem[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [completedRoutines, setCompletedRoutines] = useState<{ [key: string]: boolean }>({});

  // Greeting State
  const [greeting, setGreeting] = useState({ text: "Good morning, Best!", icon: "☀️" });
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting({ text: "Good morning, Best!", icon: "☀️" });
      else if (hour >= 12 && hour < 17) setGreeting({ text: "Good afternoon, Best!", icon: "🌤️" });
      else if (hour >= 17 && hour < 21) setGreeting({ text: "Good evening, Best!", icon: "🌆" });
      else setGreeting({ text: "Good night, Best!", icon: "🌙" });
    };
    updateGreeting();
  }, []);

  // Hydration State
  const [waterMl, setWaterMl] = useState(initialWaterMl);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [waterLogAmount, setWaterLogAmount] = useState(250);
  const [animateCup, setAnimateCup] = useState(false);

  const waterPercent = Math.min(Math.round((waterMl / waterGoal) * 100), 100);

  const handleAddWater = (amount = waterLogAmount) => {
    setAnimateCup(true);
    setTimeout(() => setAnimateCup(false), 800);
    startTransition(async () => {
      setWaterMl(prev => prev + amount);
      await logWater(amount);
    });
  };

  // Pomodoro Timer State
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [showStretchModal, setShowStretchModal] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setShowStretchModal(true);
      setTimeLeft(timerMinutes * 60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft, timerMinutes]);

  const handleStartPause = () => setTimerActive(!timerActive);

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimeLeft(timerMinutes * 60);
  };

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [customExpenseOpen, setCustomExpenseOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("OTHER");

  const [expensePresets, setExpensePresets] = useState<ExpensePreset[]>([
    { id: '1', name: 'Coffee', emoji: '☕', amount: 60, category: 'COFFEE' },
    { id: '2', name: 'Water', emoji: '🥤', amount: 10, category: 'WATER' },
    { id: '3', name: 'Commute', emoji: '🚗', amount: 50, category: 'TRANSPORT' }
  ]);

  useEffect(() => {
    // Load local settings
    const storedGoal = localStorage.getItem('water_goal');
    if (storedGoal) setWaterGoal(Number(storedGoal));
    
    const storedLog = localStorage.getItem('water_log_amount');
    if (storedLog) setWaterLogAmount(Number(storedLog));

    const storedFocus = localStorage.getItem('focus_default_minutes');
    if (storedFocus) {
      const mins = Number(storedFocus);
      setTimerMinutes(mins);
      setTimeLeft(mins * 60);
    }

    const storedPresets = localStorage.getItem('expense_presets');
    if (storedPresets) {
      try {
        const parsed = JSON.parse(storedPresets);
        setExpensePresets(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    // Load daily routines completion status and clean up old ones
    const todayKey = new Date().toLocaleDateString('en-CA');
    const completions: { [key: string]: boolean } = {};
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('routine-')) {
        if (key.startsWith(`routine-${todayKey}-`)) {
          const routineId = key.replace(`routine-${todayKey}-`, '');
          completions[routineId] = localStorage.getItem(key) === 'true';
        } else {
          keysToRemove.push(key);
        }
      }
    }
    setCompletedRoutines(completions);
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }, []);

  const handleLogExpense = (category: string, amount: number, title: string) => {
    startTransition(async () => {
      const tempId = Date.now().toString();
      const newExp: ExpenseItem = { id: tempId, amount, category, title, date: new Date().toISOString() };
      setExpenses(prev => [newExp, ...prev]);
      await logQuickExpense(category, amount, title);
    });
  };

  const handleLogCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(customAmount);
    if (!isNaN(amt) && customTitle.trim()) {
      handleLogExpense(customCategory, amt, customTitle.trim());
      setCustomAmount("");
      setCustomTitle("");
      setCustomCategory("OTHER");
      setCustomExpenseOpen(false);
    }
  };

  const openExpenseModal = (preset: ExpensePreset) => {
    setCustomTitle(`${preset.name} ${preset.emoji}`);
    setCustomAmount(String(preset.amount));
    setCustomCategory(preset.category);
    setCustomExpenseOpen(true);
  };

  // Filter schedules to show only today's schedules (All day sorted to the top)
  const getTodaySchedules = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');
    
    return initialSchedules
      .filter((schedule) => {
        const scheduleDateStr = new Date(schedule.startTime).toLocaleDateString('en-CA');
        return !schedule.isRoutine && scheduleDateStr === todayStr;
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  };

  // Get today's active routines
  const getTodayRoutines = () => {
    const todayDay = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
    return initialSchedules.filter(s => {
      if (!s.isRoutine) return false;
      const days = Array.isArray(s.routineDays) ? s.routineDays : [];
      return days.includes(todayDay);
    }).sort((a, b) => {
      const aHours = new Date(a.startTime).getHours();
      const bHours = new Date(b.startTime).getHours();
      if (aHours !== bHours) return aHours - bHours;
      return new Date(a.startTime).getMinutes() - new Date(b.startTime).getMinutes();
    });
  };

  const todayRoutines = getTodayRoutines();

  const handleToggleRoutine = (id: string) => {
    const todayKey = new Date().toLocaleDateString('en-CA');
    const key = `routine-${todayKey}-${id}`;
    const isCompleted = !completedRoutines[id];
    
    setCompletedRoutines(prev => ({
      ...prev,
      [id]: isCompleted
    }));
    
    if (isCompleted) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  const getRoutinePeriods = () => {
    const periods: { morning: ScheduleItem[], afternoon: ScheduleItem[], evening: ScheduleItem[] } = {
      morning: [],
      afternoon: [],
      evening: []
    };
    
    todayRoutines.forEach(r => {
      const startHour = new Date(r.startTime).getHours();
      if (startHour < 12) {
        periods.morning.push(r);
      } else if (startHour < 17) {
         periods.afternoon.push(r);
      } else {
        periods.evening.push(r);
      }
    });
    
    return periods;
  };
  
  const routinePeriods = getRoutinePeriods();

  const todaySchedules = getTodaySchedules();

  const calculateDuration = (start: string | Date, end: string | Date) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  // Format Timer output
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalWeeklyFixedCosts = weeklyFixedCosts.reduce((sum, item) => sum + (item.cost || 0), 0);

  // Focus tasks sorting (nearest deadline first, then tasks without deadlines)
  const getSortedFocusTasks = () => {
    return [...initialTasks]
      .filter(task => task.status !== 'COMPLETED')
      .sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  };

  const focusTasks = getSortedFocusTasks();

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center p-6 bg-paper-dark sticky top-0 z-20 shadow-soft rounded-b-[2rem] mb-6">
        <div>
          <p className="text-sm text-ink-light font-medium">{greeting.text.split(',')[0]},</p>
          <h1 className="text-2xl font-bold">Best! {greeting.icon}</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 bg-highlight hover:bg-highlight-alt text-paper rounded-full flex items-center justify-center shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {/* Content Wrapper */}
      <div className={`flex-1 p-6 lg:p-10 flex flex-col gap-10 max-w-[1600px] mx-auto w-full transition-opacity ${isPending ? 'opacity-85' : ''}`}>
        
        {/* PC/Tablet Header */}
        <div className="hidden md:flex justify-between items-center w-full">
           <div>
             <p className="text-ink-light font-medium text-lg">{greeting.text.split(',')[0]},</p>
             <h1 className="text-3xl font-bold">Best! {greeting.icon}</h1>
           </div>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
           >
             <Plus size={20} strokeWidth={3} /> Add Task
           </button>
        </div>

        {/* Row 1: Schedule & Tasks */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Timeline & Schedule Panel */}
          <section className="flex-1 lg:max-w-md xl:max-w-lg flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
              📅 Today&apos;s Schedule
            </h2>

            <div className="flex-1 bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 relative">
              <div className="flex flex-col gap-6 relative">
                {todaySchedules && todaySchedules.length > 0 ? (
                  todaySchedules.map((schedule: ScheduleItem, index: number) => {
                    const isAllDay = !!schedule.isAllDay;
                    const startTimeStr = isAllDay 
                      ? "All Day" 
                      : new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const durationStr = isAllDay 
                      ? "Full Day" 
                      : calculateDuration(schedule.startTime, schedule.endTime);
                    return (
                      <TimeBlock 
                        key={schedule.id}
                        id={schedule.id}
                        time={startTimeStr} 
                        label={schedule.cost ? `${schedule.title} (💸 ${schedule.cost}฿)` : schedule.title} 
                        duration={durationStr} 
                        color={schedule.isFixedCost ? "bg-amber-100 border-2 border-amber-300 text-amber-900" : "bg-wheat text-ink"}
                        isFirst={index === 0}
                        isLast={index === todaySchedules.length - 1}
                      />
                    );
                  })
                ) : (
                  <div className="text-center text-ink-light py-10 font-medium">No schedules for today.</div>
                )}
              </div>
            </div>
          </section>

          {/* Task Management Panel */}
          <section className="flex-[1.5] flex flex-col">
            <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
              🎯 Today&apos;s Focus (Nearest First)
            </h2>

            <div className="flex flex-col gap-5">
              {focusTasks && focusTasks.length > 0 ? (
                focusTasks.map((task: TaskItem) => (
                  <TaskCard 
                    key={task.id}
                    id={task.id}
                    title={task.title} 
                    tags={task.tags || []} 
                    deadline={task.deadline}
                    status={task.status}
                    subtasks={task.subtasks}
                  />
                ))
              ) : (
                <div className="bg-paper-dark border-2 border-wheat-dark border-dashed rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-wheat/20 transition-colors"
                  onClick={() => setIsModalOpen(true)}
                >
                  <div className="w-16 h-16 bg-wheat text-ink-light rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-ink">All caught up!</h3>
                  <p className="text-ink-light font-medium mt-1">Tap to add a new task.</p>
                </div>
              )}
            </div>

            {/* Daily Routine Checklist Widget */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
                🔄 Daily Routine (กิจวัตรประจำวัน)
              </h2>

              <div className="bg-paper-dark rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-wheat-dark/20 flex flex-col gap-6">
                {todayRoutines && todayRoutines.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {/* Morning Period */}
                    {routinePeriods.morning.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-3 px-1">🌅 ช่วงเช้า (Morning)</h4>
                        <div className="flex flex-col gap-3">
                          {routinePeriods.morning.map((routine) => {
                            const completed = !!completedRoutines[routine.id];
                            const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={routine.id} className="flex items-center gap-3 bg-paper p-4 rounded-2xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer" onClick={() => handleToggleRoutine(routine.id)}>
                                <input 
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() => {}}
                                  className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>{routine.title}</p>
                                  <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Period */}
                    {routinePeriods.afternoon.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-3 px-1">☀️ ช่วงกลางวัน (Afternoon)</h4>
                        <div className="flex flex-col gap-3">
                          {routinePeriods.afternoon.map((routine) => {
                            const completed = !!completedRoutines[routine.id];
                            const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={routine.id} className="flex items-center gap-3 bg-paper p-4 rounded-2xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer" onClick={() => handleToggleRoutine(routine.id)}>
                                <input 
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() => {}}
                                  className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>{routine.title}</p>
                                  <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evening Period */}
                    {routinePeriods.evening.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-3 px-1">🌙 ช่วงเย็น-ค่ำ (Evening)</h4>
                        <div className="flex flex-col gap-3">
                          {routinePeriods.evening.map((routine) => {
                            const completed = !!completedRoutines[routine.id];
                            const timeStr = new Date(routine.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={routine.id} className="flex items-center gap-3 bg-paper p-4 rounded-2xl border border-wheat-dark/20 shadow-sm transition-all hover:bg-wheat/10 cursor-pointer" onClick={() => handleToggleRoutine(routine.id)}>
                                <input 
                                  type="checkbox"
                                  checked={completed}
                                  onChange={() => {}}
                                  className="w-5 h-5 accent-highlight rounded cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm sm:text-base leading-snug ${completed ? 'line-through text-ink-light font-medium' : 'text-ink'}`}>{routine.title}</p>
                                  <p className="text-xs text-ink-light font-medium mt-0.5">{timeStr}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-ink-light py-8 font-medium">ไม่มีกิจวัตรสำหรับวันนี้</div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Row 2: Health & Wealth Widgets */}
        <section className="border-t border-wheat-dark/20 pt-10">
          <h2 className="text-2xl font-bold mb-6 text-ink flex items-center gap-2">
            🌱 Health & Wealth Hub
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Widget 1: Water Intake */}
            <div className="bg-paper-dark border-2 border-wheat rounded-[2.5rem] p-6 lg:p-8 shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-4 pr-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <Droplet size={20} className={animateCup ? "animate-bounce" : ""} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">Hydration</h3>
                    <p className="text-xs text-ink-light/75 font-semibold">Goal: {waterGoal}ml</p>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">{waterPercent}%</span>
              </div>

              <div className="my-6 flex justify-center">
                <button 
                  onClick={() => handleAddWater(waterLogAmount)}
                  className="relative w-24 h-28 border-x-4 border-b-4 border-wheat-dark/40 rounded-b-2xl flex items-end justify-center overflow-hidden cursor-pointer group transition-transform active:scale-95"
                >
                  <div 
                    className="absolute bottom-0 w-full bg-blue-400/80 transition-all duration-700 ease-out"
                    style={{ height: `${waterPercent}%` }}
                  />
                  <span className="relative z-10 font-mono font-bold text-sm text-ink-light group-hover:text-blue-900 transition-colors mb-2">
                    +{waterLogAmount}ml
                  </span>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-ink">{waterMl} ml logged</span>
                <button 
                  onClick={() => handleAddWater(waterLogAmount)}
                  className="bg-wheat hover:bg-wheat-dark text-ink font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Quick Log Glass 🥛
                </button>
              </div>
            </div>

            {/* Widget 2: Pomodoro Timer */}
            <div className="bg-paper-dark border-2 border-wheat rounded-[2.5rem] p-6 lg:p-8 shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">Focus Pomodoro</h3>
                    <p className="text-xs text-ink-light/75 font-semibold">Stretch Break Enabled</p>
                  </div>
                </div>
              </div>

              {/* Timer Visual */}
              <div className="flex flex-col items-center justify-center flex-1 my-6 w-full">
                <span className="font-mono text-5xl font-extrabold text-ink tracking-widest">{formatTime(timeLeft)}</span>
                {timerActive ? (
                  <span className="text-xs font-bold text-ink-light mt-2">{timerMinutes}m Session</span>
                ) : (
                  <div className="flex items-center gap-2 mt-2 bg-paper/60 px-3 py-1 rounded-full border border-wheat-dark/30 shadow-inner">
                    <button 
                      onClick={() => {
                        const newMins = Math.max(1, timerMinutes - 5);
                        setTimerMinutes(newMins);
                        setTimeLeft(newMins * 60);
                      }}
                      className="w-5 h-5 bg-wheat hover:bg-wheat-dark text-ink rounded-full flex items-center justify-center text-xs font-black cursor-pointer transition-colors shadow-sm"
                      title="Decrease 5m"
                    >
                      -
                    </button>
                    <input 
                      type="number"
                      min="1"
                      max="180"
                      value={timerMinutes}
                      onChange={(e) => {
                        const mins = Math.max(1, Math.min(180, parseInt(e.target.value) || 1));
                        setTimerMinutes(mins);
                        setTimeLeft(mins * 60);
                      }}
                      className="w-8 text-center text-xs font-black text-ink bg-transparent border-none outline-none font-mono focus:ring-0 p-0"
                    />
                    <span className="text-xs font-bold text-ink-light mr-0.5">m</span>
                    <button 
                      onClick={() => {
                        const newMins = Math.min(180, timerMinutes + 5);
                        setTimerMinutes(newMins);
                        setTimeLeft(newMins * 60);
                      }}
                      className="w-5 h-5 bg-wheat hover:bg-wheat-dark text-ink rounded-full flex items-center justify-center text-xs font-black cursor-pointer transition-colors shadow-sm"
                      title="Increase 5m"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3 justify-center w-full">
                <button 
                  onClick={handleStartPause}
                  className={`flex-1 font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm
                    ${timerActive ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-highlight hover:bg-highlight-alt text-paper'}`}
                >
                  {timerActive ? <Pause size={16} /> : <Play size={16} />}
                  {timerActive ? 'Pause' : 'Start'}
                </button>
                <button 
                  onClick={handleResetTimer}
                  className="bg-wheat hover:bg-wheat-dark text-ink p-2.5 rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Widget 3: Quick Expense & Fixed Cost Alerts */}
            <div className="bg-paper-dark border-2 border-wheat rounded-[2.5rem] p-6 lg:p-8 shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-4 pr-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink">Daily Expenses</h3>
                    <p className="text-xs text-ink-light/75 font-semibold">Quick Presets</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 my-2 w-full box-border">
                {/* Configurable Presets list */}
                <div className="grid grid-cols-3 gap-2 w-full box-border">
                  {expensePresets.map((preset) => (
                    <button 
                      key={preset.id}
                      onClick={() => openExpenseModal(preset)}
                      className="flex flex-col items-center justify-center bg-paper hover:bg-wheat p-2 rounded-2xl border border-wheat-dark/20 transition-all active:scale-95 cursor-pointer shadow-sm min-w-0 box-border"
                    >
                      <span className="text-base mb-0.5">{preset.emoji}</span>
                      <span className="text-[9px] font-bold text-ink-light truncate w-full text-center">{preset.name}</span>
                      <span className="text-xs font-extrabold text-ink mt-0.5">{preset.amount}฿</span>
                    </button>
                  ))}
                </div>

                {/* Fixed Cost Alerts Area */}
                {totalWeeklyFixedCosts > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2.5 w-full box-border">
                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-amber-800">Weekly Fixed Costs (ปลิวก้อนโต)</p>
                      <p className="text-xs font-extrabold text-amber-950 truncate">💸 {totalWeeklyFixedCosts}฿ will fly away this week</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom logs toggler */}
              <div className="flex gap-2 items-center mt-3 pt-3 border-t border-wheat/60 w-full box-border">
                {customExpenseOpen ? (
                  <form onSubmit={handleLogCustomExpense} className="flex gap-1.5 w-full box-border">
                    <input 
                      type="text" 
                      placeholder="Item"
                      required
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="flex-1 min-w-0 text-xs bg-paper border border-wheat-dark/30 rounded-lg px-2 py-1.5 outline-none font-medium"
                    />
                    <input 
                      type="number" 
                      placeholder="฿"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-12 text-xs bg-paper border border-wheat-dark/30 rounded-lg px-2 py-1.5 outline-none font-extrabold"
                    />
                    <button type="submit" className="bg-highlight hover:bg-highlight-alt text-paper px-2.5 rounded-lg text-xs font-bold cursor-pointer shrink-0">Log</button>
                    <button type="button" onClick={() => setCustomExpenseOpen(false)} className="text-ink-light hover:text-ink p-1 shrink-0"><X size={14} /></button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-ink-light">
                      Logged today: {expenses.reduce((s, e) => s + e.amount, 0)}฿
                    </span>
                    <button 
                      onClick={() => {
                        setCustomTitle("");
                        setCustomAmount("");
                        setCustomCategory("OTHER");
                        setCustomExpenseOpen(true);
                      }}
                      className="text-xs font-extrabold text-highlight hover:underline cursor-pointer"
                    >
                      + Custom Item
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* Stretch Reminder Modal Overlay */}
      {showStretchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-paper w-full max-w-sm rounded-[2.5rem] shadow-lg border-2 border-wheat-dark p-8 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-soft">
              <Sparkles size={32} />
            </div>
            
            <h2 className="text-2xl font-black mb-2 text-ink">Time to Stretch! 🧘‍♂️</h2>
            <p className="text-ink-light font-medium text-sm leading-relaxed mb-6">
              Your focus block has finished. Stand up, rest your eyes, stretch your muscles, and take a quick glass of water! ✨
            </p>
            
            <button 
              onClick={() => {
                setShowStretchModal(false);
                handleAddWater(waterLogAmount); // Automatically log water glass
              }}
              className="bg-highlight hover:bg-highlight-alt text-paper font-bold text-base px-8 py-3.5 rounded-full shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Done & Log Water 🥛
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
