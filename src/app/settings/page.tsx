"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { logoutUser } from '../actions';
import { Trash2 } from 'lucide-react';

interface ExpensePreset {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  category: string;
}

export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [isPending, startTransition] = useTransition();

  // Water Settings
  const [waterGoal, setWaterGoal] = useState(2000);
  const [waterLogAmount, setWaterLogAmount] = useState(250);

  // Focus Timer Settings
  const [defaultFocusMinutes, setDefaultFocusMinutes] = useState(25);

  // Expense Settings
  const [expensePresets, setExpensePresets] = useState<ExpensePreset[]>([
    { id: '1', name: 'Coffee', emoji: '☕', amount: 60, category: 'COFFEE' },
    { id: '2', name: 'Water', emoji: '🥤', amount: 10, category: 'WATER' },
    { id: '3', name: 'Commute', emoji: '🚗', amount: 50, category: 'TRANSPORT' }
  ]);

  const [savedMessage, setSavedMessage] = useState("");

  // Load persisted theme and settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('tiny_theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const storedGoal = localStorage.getItem('water_goal');
    if (storedGoal) setWaterGoal(Number(storedGoal));
    
    const storedLog = localStorage.getItem('water_log_amount');
    if (storedLog) setWaterLogAmount(Number(storedLog));

    const storedFocus = localStorage.getItem('focus_default_minutes');
    if (storedFocus) setDefaultFocusMinutes(Number(storedFocus));

    const storedPresets = localStorage.getItem('expense_presets');
    if (storedPresets) {
      try {
        setExpensePresets(JSON.parse(storedPresets));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const applyTheme = (t: string) => {
    if (t === 'dark') {
      document.documentElement.style.setProperty('--color-paper', '#231D1C');
      document.documentElement.style.setProperty('--color-paper-dark', '#1A1514');
      document.documentElement.style.setProperty('--color-wheat', '#382D2B');
      document.documentElement.style.setProperty('--color-wheat-dark', '#4A3B39');
      document.documentElement.style.setProperty('--color-ink', '#F5EFE6');
      document.documentElement.style.setProperty('--color-ink-light', '#C7B9B5');
    } else {
      document.documentElement.style.setProperty('--color-paper', '#FDFBF7');
      document.documentElement.style.setProperty('--color-paper-dark', '#F7F4EB');
      document.documentElement.style.setProperty('--color-wheat', '#E6DFD3');
      document.documentElement.style.setProperty('--color-wheat-dark', '#D4C9B5');
      document.documentElement.style.setProperty('--color-ink', '#4A3E3D');
      document.documentElement.style.setProperty('--color-ink-light', '#6B5A58');
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('tiny_theme', nextTheme);
    applyTheme(nextTheme);
  };

  const saveSettings = () => {
    localStorage.setItem('water_goal', String(waterGoal));
    localStorage.setItem('water_log_amount', String(waterLogAmount));
    localStorage.setItem('focus_default_minutes', String(defaultFocusMinutes));
    localStorage.setItem('expense_presets', JSON.stringify(expensePresets));
    
    setSavedMessage("Settings saved successfully!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      startTransition(async () => {
        await logoutUser();
      });
    }
  };

  const handleAddPresetRow = () => {
    const newRow: ExpensePreset = {
      id: `preset-${Date.now()}-${Math.random()}`,
      name: 'New Item',
      emoji: '🏷️',
      amount: 50,
      category: 'OTHER'
    };
    setExpensePresets([...expensePresets, newRow]);
  };

  const handleRemovePresetRow = (id: string) => {
    setExpensePresets(expensePresets.filter(p => p.id !== id));
  };

  const handlePresetChange = (id: string, field: keyof ExpensePreset, val: string | number) => {
    setExpensePresets(expensePresets.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  return (
    <div className={`p-6 lg:p-10 max-w-4xl mx-auto w-full pb-24 md:pb-10 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-ink">Settings</h1>
        <button 
          onClick={saveSettings}
          className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-2.5 rounded-full font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Save All Settings
        </button>
      </div>

      {savedMessage && (
        <div className="mb-6 bg-green-100 text-green-800 px-4 py-3 rounded-2xl font-bold flex items-center gap-2">
          ✅ {savedMessage}
        </div>
      )}
      
      <div className="flex flex-col gap-8">
        {/* Appearance */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-4">Appearance</h2>
          <div className="flex items-center justify-between py-4 border-b border-wheat-dark/30">
            <div>
              <p className="font-bold text-ink">Wheat & Paper Theme</p>
              <p className="text-sm text-ink-light">Toggle between cozy light and dark paper themes.</p>
            </div>
            <button 
              onClick={handleThemeToggle}
              className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300
                ${theme === 'dark' ? 'bg-highlight' : 'bg-wheat-dark'}`}
            >
              <div className={`w-4 h-4 bg-paper rounded-full shadow-sm transition-transform duration-300
                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} 
              />
            </button>
          </div>
        </div>

        {/* Widgets configuration */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-6">Widgets Presets</h2>
          
          {/* Water Tracker */}
          <div className="py-4 border-b border-wheat-dark/30">
            <h3 className="font-bold text-ink mb-2">💧 Hydration Tracker</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="w-full">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-1">Daily Goal (ml)</label>
                <input 
                  type="number"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(Number(e.target.value) || 2000)}
                  className="w-full max-w-full px-4 py-2 bg-paper border-2 border-wheat focus:border-highlight rounded-xl outline-none font-bold text-ink box-border"
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-bold text-ink-light mb-1 ml-1">Quick Log Glass (ml)</label>
                <input 
                  type="number"
                  value={waterLogAmount}
                  onChange={(e) => setWaterLogAmount(Number(e.target.value) || 250)}
                  className="w-full max-w-full px-4 py-2 bg-paper border-2 border-wheat focus:border-highlight rounded-xl outline-none font-bold text-ink box-border"
                />
              </div>
            </div>
          </div>

          {/* Focus Timer */}
          <div className="py-4 border-b border-wheat-dark/30">
            <h3 className="font-bold text-ink mb-2">⏱️ Pomodoro Focus Timer</h3>
            <div className="w-full mt-3">
              <label className="block text-sm font-bold text-ink-light mb-1 ml-1">Default Timer Minutes</label>
              <input 
                type="number"
                min="1"
                max="180"
                value={defaultFocusMinutes}
                onChange={(e) => setDefaultFocusMinutes(Number(e.target.value) || 25)}
                className="w-full md:w-1/2 max-w-full px-4 py-2 bg-paper border-2 border-wheat focus:border-highlight rounded-xl outline-none font-bold text-ink box-border"
              />
            </div>
          </div>

          {/* Daily Expenses */}
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-ink">💸 Daily Expenses Quick Buttons</h3>
              <button onClick={handleAddPresetRow} className="text-sm font-bold text-highlight hover:underline">+ Add Preset</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {expensePresets.map((preset) => (
                <div key={preset.id} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-paper p-3 rounded-2xl border-2 border-wheat-dark/30 w-full box-border">
                  <input 
                    type="text" 
                    value={preset.emoji}
                    onChange={(e) => handlePresetChange(preset.id, 'emoji', e.target.value)}
                    placeholder="☕" 
                    className="w-12 text-center text-sm bg-paper-dark border border-wheat-dark/30 rounded-xl px-1 py-2 outline-none"
                  />
                  <input 
                    type="text" 
                    value={preset.name}
                    onChange={(e) => handlePresetChange(preset.id, 'name', e.target.value)}
                    placeholder="Name" 
                    className="flex-1 min-w-0 text-sm bg-paper-dark border border-wheat-dark/30 rounded-xl px-3 py-2 outline-none font-medium"
                  />
                  <input 
                    type="number" 
                    value={preset.amount}
                    onChange={(e) => handlePresetChange(preset.id, 'amount', Number(e.target.value) || 0)}
                    placeholder="฿" 
                    className="w-20 text-sm bg-paper-dark border border-wheat-dark/30 rounded-xl px-2 py-2 outline-none text-center font-bold"
                  />
                  <select 
                    value={preset.category}
                    onChange={(e) => handlePresetChange(preset.id, 'category', e.target.value)}
                    className="text-xs bg-paper-dark border border-wheat-dark/30 rounded-xl px-2 py-2 outline-none font-bold"
                  >
                    <option value="COFFEE">Coffee</option>
                    <option value="WATER">Water</option>
                    <option value="TRANSPORT">Commute</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <button 
                    onClick={() => handleRemovePresetRow(preset.id)}
                    className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-xl ml-auto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-4">Account</h2>
          <div className="flex items-center justify-between py-4 border-b border-wheat-dark/30">
            <div>
              <p className="font-bold text-ink">Sign Out</p>
              <p className="text-sm text-ink-light">Log out of your account on this device.</p>
            </div>
            <button 
              onClick={handleLogout}
              disabled={isPending}
              className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-full font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
