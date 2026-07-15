"use client";

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { 
  logoutUser, 
  check2FAStatus, 
  generate2FASecret, 
  enable2FA, 
  disable2FA,
  getTasks,
  getSchedules,
  importTasksAction,
  importSchedulesAction
} from '../actions';
import { Lock, ShieldCheck, Download, Upload, MonitorDown, CheckCircle2, Info } from 'lucide-react';
import { addToast } from '@/lib/notifications';
import { PWA_PROMPT_READY_EVENT } from '@/components/pwa/PWARegister';

export default function SettingsPage() {
  const [theme, setTheme] = useState('light');
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState("");
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Focus Timer Settings
  const [defaultFocusMinutes, setDefaultFocusMinutes] = useState(25);

  // Security (2FA) State
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [setupStep, setSetupStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [totpError, setTotpError] = useState("");

  // Load persisted theme and settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('tiny_theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const storedFocus = localStorage.getItem('focus_default_minutes');
    if (storedFocus) setDefaultFocusMinutes(Number(storedFocus));

    // Load 2FA status
    startTransition(async () => {
      const res = await check2FAStatus();
      if (res.success) {
        setTotpEnabled(!!res.enabled);
      }
    });
  }, []);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const updateInstallState = () => {
      const installed = standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setIsPWAInstalled(installed);
      setCanInstallPWA(!installed && Boolean(window.tinyScheduleInstallPrompt));
    };

    updateInstallState();
    window.addEventListener(PWA_PROMPT_READY_EVENT, updateInstallState);
    window.addEventListener('appinstalled', updateInstallState);
    standalone.addEventListener('change', updateInstallState);

    return () => {
      window.removeEventListener(PWA_PROMPT_READY_EVENT, updateInstallState);
      window.removeEventListener('appinstalled', updateInstallState);
      standalone.removeEventListener('change', updateInstallState);
    };
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
    localStorage.setItem('focus_default_minutes', String(defaultFocusMinutes));
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

  const handleInstallPWA = async () => {
    const installPrompt = window.tinyScheduleInstallPrompt;
    if (!installPrompt) {
      addToast("เปิดเมนู Chrome แล้วเลือก Install TinySchedule หรือ Install app");
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    window.tinyScheduleInstallPrompt = undefined;
    setCanInstallPWA(false);

    if (outcome === 'accepted') {
      addToast("✅ กำลังติดตั้ง TinySchedule เป็นแอป");
    }
  };

  // 2FA Handlers
  const handleInitiate2FA = () => {
    setTotpError("");
    setVerificationCode("");
    startTransition(async () => {
      const res = await generate2FASecret();
      if (res.success && res.secret && res.otpauthUrl) {
        setTotpSecret(res.secret);
        setOtpauthUrl(res.otpauthUrl);
        setSetupStep('setup');
      } else {
        setTotpError(res.error || "Failed to generate secret key.");
      }
    });
  };

  const handleVerifyAndEnable = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setTotpError("Please enter a 6-digit verification code.");
      return;
    }
    setTotpError("");
    startTransition(async () => {
      const res = await enable2FA(totpSecret, verificationCode);
      if (res.success) {
        setTotpEnabled(true);
        setSetupStep('idle');
        setVerificationCode("");
        addToast("🔒 Authenticator App 2FA successfully enabled!");
      } else {
        setTotpError(res.error || "Verification failed. Please try again.");
      }
    });
  };

  const handleDisable2FA = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setTotpError("Please enter a 6-digit verification code.");
      return;
    }
    setTotpError("");
    startTransition(async () => {
      const res = await disable2FA(verificationCode);
      if (res.success) {
        setTotpEnabled(false);
        setSetupStep('idle');
        setVerificationCode("");
        addToast("🔓 2FA successfully disabled.");
      } else {
        setTotpError(res.error || "Verification failed.");
      }
    });
  };

  // JSON Import/Export handlers
  const handleExportTasks = () => {
    startTransition(async () => {
      const res = await getTasks();
      if (res.success && res.data) {
        // Clean prisma specific objects if needed, but simple stringify is fine
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = `tinyschedule_tasks_${new Date().toISOString().slice(0,10)}.json`;
        link.href = url;
        link.click();
        addToast("📥 Tasks backup downloaded!");
      } else {
        addToast("❌ Failed to export tasks.");
      }
    });
  };

  const handleExportSchedules = () => {
    startTransition(async () => {
      const res = await getSchedules();
      if (res.success && res.data) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = `tinyschedule_schedules_${new Date().toISOString().slice(0,10)}.json`;
        link.href = url;
        link.click();
        addToast("📥 Schedules backup downloaded!");
      } else {
        addToast("❌ Failed to export schedules.");
      }
    });
  };

  const handleImportTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          addToast("❌ Invalid file format. Expected an array of tasks.");
          return;
        }

        startTransition(async () => {
          const res = await importTasksAction(parsed);
          if (res.success) {
            addToast(`✅ Successfully imported ${res.count} tasks!`);
            // Reset file input value
            e.target.value = '';
          } else {
            addToast(`❌ Import failed: ${res.error}`);
          }
        });
      } catch (err) {
        addToast("❌ Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportSchedules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          addToast("❌ Invalid file format. Expected an array of schedules.");
          return;
        }

        startTransition(async () => {
          const res = await importSchedulesAction(parsed);
          if (res.success) {
            addToast(`✅ Successfully imported ${res.count} schedules!`);
            e.target.value = '';
          } else {
            addToast(`❌ Import failed: ${res.error}`);
          }
        });
      } catch (err) {
        addToast("❌ Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
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
        {/* Install as a PWA */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
            <MonitorDown size={21} className="text-highlight" /> Change to PWA
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 py-4">
            <div>
              <p className="font-bold text-ink">Install TinySchedule as an App</p>
              <p className="text-sm text-ink-light mt-1 leading-relaxed">
                ติดตั้ง TinySchedule ลงบนอุปกรณ์ แล้วเปิดใช้งานในหน้าต่างแอปแยกจากเบราว์เซอร์
              </p>
              {!canInstallPWA && !isPWAInstalled && (
                <p className="text-xs text-ink-light mt-3 flex items-start gap-1.5">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  ใช้ Chrome ผ่าน HTTPS หรือ localhost แล้วเลือกไอคอน Install ที่ด้านขวาของ address bar หากปุ่มยังไม่พร้อม
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleInstallPWA}
              disabled={isPWAInstalled}
              className="bg-highlight hover:bg-highlight-alt disabled:bg-wheat-dark disabled:text-ink-light text-paper px-6 py-3 rounded-full font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-default flex items-center justify-center gap-2 shrink-0"
            >
              {isPWAInstalled ? <CheckCircle2 size={18} /> : <MonitorDown size={18} />}
              {isPWAInstalled ? 'Installed as App' : canInstallPWA ? 'Install App' : 'How to Install'}
            </button>
          </div>
        </div>

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

        {/* Focus Timer */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-4">Focus Timer Settings</h2>
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
        </div>

        {/* Security (2FA) */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
            <Lock size={20} className="text-highlight" /> Security & Authentication
          </h2>
          
          <div className="py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-wheat-dark/30 pb-4">
              <div>
                <p className="font-bold text-ink">Two-Factor Authentication (2FA)</p>
                <p className="text-sm text-ink-light">Require a code from an authenticator app (Google Authenticator, Authy, etc.) during login.</p>
              </div>
              
              <div className="flex items-center gap-2">
                {totpEnabled ? (
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-extrabold flex items-center gap-1">
                    <ShieldCheck size={14} /> Active
                  </span>
                ) : (
                  <span className="bg-wheat text-ink-light text-xs px-3 py-1.5 rounded-full font-bold">
                    Disabled
                  </span>
                )}
              </div>
            </div>

            {setupStep === 'idle' && (
              <div className="flex justify-end">
                {totpEnabled ? (
                  <button 
                    onClick={() => {
                      setVerificationCode("");
                      setTotpError("");
                      setSetupStep('disable');
                    }}
                    className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-full font-bold text-sm cursor-pointer transition-colors"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button 
                    onClick={handleInitiate2FA}
                    className="px-6 py-2.5 bg-highlight hover:bg-highlight-alt text-paper rounded-full font-bold text-sm cursor-pointer shadow-soft transition-transform hover:scale-105 active:scale-95"
                  >
                    Setup Authenticator App
                  </button>
                )}
              </div>
            )}

            {setupStep === 'setup' && (
              <div className="bg-paper border border-wheat p-6 rounded-3xl flex flex-col gap-4 mt-2 max-w-lg">
                <h4 className="font-extrabold text-ink">Setup Authenticator App</h4>
                <p className="text-xs text-ink-light leading-relaxed">
                  1. Scan the QR code using Google Authenticator, Authy, or another authenticator app. If you cannot scan, manually type in the secret key.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
                  <div className="bg-white p-3 rounded-2xl border border-wheat flex items-center justify-center shrink-0">
                    {/* Public secure QR generator API (browser fetches directly, no private data shared) */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}`}
                      alt="TOTP QR Code"
                      width={160}
                      height={160}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-ink-light uppercase tracking-wider mb-1">Manual Entry Key</p>
                    <code className="block bg-paper-dark border border-wheat rounded-xl px-3 py-2 text-xs font-mono font-bold select-all break-all text-ink">
                      {totpSecret.replace(/(.{4})/g, '$1 ').trim()}
                    </code>
                    <p className="text-[10px] text-ink-light/80 mt-1 leading-snug">Double click to copy, then enter into your app.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-wheat/60 pt-4 mt-2">
                  <label className="block text-xs font-bold text-ink-light">2. Verify & Activate: Enter the 6-digit code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength={6} 
                      placeholder="000 000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full sm:w-1/2 bg-paper-dark border-2 border-wheat focus:border-highlight rounded-xl px-4 py-2 outline-none font-extrabold text-center text-lg tracking-wider"
                    />
                    <button 
                      onClick={handleVerifyAndEnable}
                      className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-2 rounded-xl font-bold text-sm cursor-pointer shadow-soft transition-transform active:scale-95 shrink-0"
                    >
                      Verify & Activate
                    </button>
                  </div>
                </div>

                {totpError && <p className="text-red-500 text-xs font-bold animate-pulse">{totpError}</p>}
                
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => setSetupStep('idle')}
                    className="text-xs font-bold text-ink-light hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {setupStep === 'disable' && (
              <div className="bg-red-50/50 border border-red-200 p-6 rounded-3xl flex flex-col gap-4 mt-2 max-w-lg">
                <h4 className="font-extrabold text-red-800">Deactivate 2FA</h4>
                <p className="text-xs text-red-950 font-medium leading-relaxed">
                  For security, please enter the current 6-digit code from your authenticator app to disable two-factor authentication.
                </p>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    maxLength={6} 
                    placeholder="000 000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full sm:w-1/2 bg-paper border-2 border-red-200 focus:border-red-500 rounded-xl px-4 py-2 outline-none font-extrabold text-center text-lg tracking-wider text-red-900"
                  />
                  <button 
                    onClick={handleDisable2FA}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold text-sm cursor-pointer shadow-soft transition-transform active:scale-95 shrink-0"
                  >
                    Confirm Deactivation
                  </button>
                </div>

                {totpError && <p className="text-red-500 text-xs font-bold animate-pulse">{totpError}</p>}

                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => setSetupStep('idle')}
                    className="text-xs font-bold text-ink-light hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Backup & Portability (JSON) */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
            📂 Data Portability (JSON Import/Export)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks Section */}
            <div className="bg-paper border border-wheat p-6 rounded-[2rem] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-ink flex items-center gap-1.5 mb-2">🎯 Tasks Backup</h3>
                <p className="text-xs text-ink-light leading-relaxed mb-4">Export all tasks (including subtasks and hierarchy) or restore from a JSON file.</p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button 
                  onClick={handleExportTasks}
                  className="bg-wheat hover:bg-wheat-dark text-ink font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Export Tasks to JSON
                </button>
                <label className="bg-paper hover:bg-wheat/20 text-ink-light hover:text-ink font-bold text-xs px-4 py-2.5 rounded-xl border border-wheat-dark/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center">
                  <Upload size={14} /> Import Tasks from JSON
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportTasks} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Schedules Section */}
            <div className="bg-paper border border-wheat p-6 rounded-[2rem] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-ink flex items-center gap-1.5 mb-2">📅 Schedules Backup</h3>
                <p className="text-xs text-ink-light leading-relaxed mb-4">Export all time blocks and repeat routines or restore them from a JSON file.</p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button 
                  onClick={handleExportSchedules}
                  className="bg-wheat hover:bg-wheat-dark text-ink font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Export Schedules to JSON
                </button>
                <label className="bg-paper hover:bg-wheat/20 text-ink-light hover:text-ink font-bold text-xs px-4 py-2.5 rounded-xl border border-wheat-dark/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center">
                  <Upload size={14} /> Import Schedules from JSON
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportSchedules} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Routines navigation link */}
        <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20 transition-colors">
          <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">🔄 Daily Routines (ตารางกิจกรรมรายวัน)</h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            <div>
              <p className="font-bold text-ink">Manage Recurring Schedules</p>
              <p className="text-sm text-ink-light">Configure blocks that repeat weekly on selected days of the week (e.g. Morning Wake Up).</p>
            </div>
            <Link 
              href="/schedule"
              className="bg-highlight hover:bg-highlight-alt text-paper px-6 py-3 rounded-full font-bold shadow-soft transition-transform hover:scale-105 active:scale-95 text-center shrink-0"
            >
              Go to Schedule Planner 📅
            </Link>
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
