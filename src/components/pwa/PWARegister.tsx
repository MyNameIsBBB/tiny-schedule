"use client";

import { useEffect } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    tinyScheduleInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export const PWA_PROMPT_READY_EVENT = "tinyschedule:pwa-prompt-ready";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("TinySchedule service worker registration failed:", error);
      });
    }

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.tinyScheduleInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event(PWA_PROMPT_READY_EVENT));
    };

    const clearInstallPrompt = () => {
      window.tinyScheduleInstallPrompt = undefined;
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  return null;
}
