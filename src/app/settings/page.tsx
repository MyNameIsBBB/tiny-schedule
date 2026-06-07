import React from 'react';

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full pb-24 md:pb-10">
      <h1 className="text-3xl font-bold text-ink mb-8">Settings</h1>
      
      <div className="bg-paper-dark rounded-[2.5rem] p-8 shadow-soft border border-wheat-dark/20">
        <h2 className="text-xl font-bold text-ink mb-4">Appearance</h2>
        <div className="flex items-center justify-between py-4 border-b border-wheat-dark/30">
          <div>
            <p className="font-bold text-ink">Wheat & Paper Theme</p>
            <p className="text-sm text-ink-light">Your default cozy theme.</p>
          </div>
          <div className="w-12 h-6 bg-highlight rounded-full flex items-center p-1 cursor-pointer">
            <div className="w-4 h-4 bg-paper rounded-full translate-x-6 shadow-sm" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-ink mt-8 mb-4">Account</h2>
        <div className="flex items-center justify-between py-4 border-b border-wheat-dark/30">
          <div>
            <p className="font-bold text-ink">Sign Out</p>
            <p className="text-sm text-ink-light">Log out of your account on this device.</p>
          </div>
          <button className="px-4 py-2 bg-wheat-dark/30 hover:bg-wheat-dark/50 text-ink rounded-full font-bold transition-colors cursor-pointer">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
