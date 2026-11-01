'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { HelpCircle, Bell, RefreshCcw, UserCheck, Users } from 'lucide-react';

const SCREEN_TITLES: Record<string, string> = {
  dashboard: 'Team Lead Dashboard',
  create: 'Create Handover',
  review: 'Review & Approval',
  'departing-intro': 'Knowledge Handover Overview',
  interview: 'AI Handover Interview',
  questions: 'AI Handover Interview',
  'my-handover-departing': 'Handover Overview',
  'incoming-handover': 'Approved Handover Document',
  'evidence-gaps': 'Evidence & Gaps Inspection',
};

export function TopNav() {
  const { activeScreen, activeRole, setActiveScreen, resetDemoData } = useHandover();

  const title = SCREEN_TITLES[activeScreen] || 'Trailmark Workspace';
  const roleLabel =
    activeRole === 'lead'
      ? 'Team Lead'
      : activeRole === 'departing'
        ? 'Departing Member'
        : 'Incoming Member';

  return (
    <header className="h-16 bg-white border-b border-[#E5EAF1] flex items-center justify-between px-6 shrink-0">
      {/* Left: page title & role indicator */}
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold text-navy-800">{title}</h1>
        <span className="text-xs font-semibold text-brand-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
          {roleLabel} View
        </span>
      </div>

      {/* Right: Quick Role Switcher + Reset + Help */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveScreen('role-select')}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-blue-50/70 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          title="Switch role"
        >
          <Users size={14} />
          <span>Switch Role</span>
        </button>

        <button
          onClick={resetDemoData}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-navy-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Reset demo data to initial state"
        >
          <RefreshCcw size={13} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        <button
          className="p-2 rounded-lg text-muted hover:text-navy-800 hover:bg-gray-100 transition-colors"
          title="Help & documentation"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
}
