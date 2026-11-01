'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { HelpCircle, Bell, RefreshCcw } from 'lucide-react';

const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  create: 'Create Handover',
  review: 'Review & Approval',
  questions: 'AI Questions',
  'my-handover-departing': 'My Handover',
  'incoming-handover': 'My Handover',
  'evidence-gaps': 'Evidence & Gaps',
};

export function TopNav() {
  const { activeScreen, activeRole, resetDemoData } = useHandover();

  const title = SCREEN_TITLES[activeScreen] || 'Trailmark';
  const roleLabel =
    activeRole === 'lead'
      ? 'Team Lead'
      : activeRole === 'departing'
        ? 'Departing Member'
        : 'Incoming Member';

  return (
    <header className="h-16 bg-white border-b border-[#E5EAF1] flex items-center justify-between px-6 shrink-0">
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-navy-800">{title}</h1>
        <span className="text-xs font-medium text-muted bg-gray-100 px-2.5 py-1 rounded-full">
          {roleLabel}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={resetDemoData}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-navy-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          title="Reset demo data"
        >
          <RefreshCcw size={15} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>
        <button className="p-2 rounded-lg text-muted hover:text-navy-800 hover:bg-gray-50 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full"></span>
        </button>
        <button className="p-2 rounded-lg text-muted hover:text-navy-800 hover:bg-gray-50 transition-colors">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
}
