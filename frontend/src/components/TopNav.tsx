'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Search, Bell, ChevronDown, RefreshCcw, SunMedium } from 'lucide-react';

const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Project Dashboard',
  create: 'Create Handover',
  review: 'Review & Verification',
  'departing-intro': 'Handover Briefing',
  interview: 'AI Knowledge Interview',
  questions: 'AI Knowledge Interview',
  'my-handover-departing': 'Handover Briefing',
  'incoming-handover': 'Approved Knowledge Base',
  'evidence-gaps': 'Evidence & Gaps',
};

export function TopNav() {
  const { activeScreen, activeRole, setActiveScreen, currentUser, resetDemoData } = useHandover();

  const title = SCREEN_TITLES[activeScreen] || 'Dashboard';

  return (
    <header className="h-20 bg-[#F4F4F0] px-8 flex items-center justify-between shrink-0 border-b border-[#E6E6DE]">
      {/* Left: Bold Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#1F201B]">{title}</h1>
      </div>

      {/* Right: Search, Notifications, Theme Pill, User Profile */}
      <div className="flex items-center gap-3.5">
        {/* Search Pill */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search projects, decisions, code..."
            className="w-64 pl-4 pr-9 py-2 rounded-full border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] transition-all shadow-2xs"
          />
          <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A7B72]" />
        </div>

        {/* Bell Notification Pill */}
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-white border border-[#E6E6DE] flex items-center justify-center text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors shadow-2xs relative"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={15} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#5A5B4C] absolute top-2 right-2" />
        </button>

        {/* Reset Demo Pill */}
        <button
          type="button"
          onClick={resetDemoData}
          className="h-9 px-3 rounded-full bg-white border border-[#E6E6DE] flex items-center gap-1.5 text-xs font-medium text-[#7A7B72] hover:text-[#1F201B] hover:bg-[#EAEAE2] transition-colors shadow-2xs"
          title="Reset demo data"
          aria-label="Reset demo data"
        >
          <RefreshCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Theme Pill (Reference style) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E6E6DE] shadow-2xs text-xs font-medium text-[#3A3B34]">
          <div className="w-6 h-3.5 bg-[#5A5B4C] rounded-full p-0.5 flex items-center justify-end">
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          </div>
          <span>Light</span>
        </div>

        {/* User Profile Pill */}
        <button
          type="button"
          onClick={() => setActiveScreen('role-select')}
          className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white border border-[#E6E6DE] hover:bg-[#EAEAE2] transition-colors shadow-2xs"
          title="Switch demo persona"
          aria-label="Switch demo persona"
        >
          <div className="w-7 h-7 rounded-full bg-[#5A5B4C] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {currentUser.avatar}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-[#1F201B] leading-none">{currentUser.name}</p>
            <p className="text-[10px] text-[#7A7B72] leading-none mt-0.5">{currentUser.roleTitle.split(' ')[0]}</p>
          </div>
          <ChevronDown size={13} className="text-[#7A7B72]" />
        </button>
      </div>
    </header>
  );
}
