'use client';

import React from 'react';
import { useHandover, DEMO_USERS } from '@/context/HandoverContext';
import {
  LayoutDashboard,
  FilePlus,
  ClipboardCheck,
  MessageSquareText,
  FileText,
  Search,
  LogOut,
  Compass,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const LEAD_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'create', label: 'Create Handover', icon: <FilePlus size={18} /> },
  { id: 'review', label: 'Review & Approval', icon: <ClipboardCheck size={18} /> },
];

const DEPARTING_NAV: NavItem[] = [
  { id: 'my-handover-departing', label: 'My Handover', icon: <FileText size={18} /> },
  { id: 'questions', label: 'AI Questions', icon: <MessageSquareText size={18} /> },
];

const INCOMING_NAV: NavItem[] = [
  { id: 'incoming-handover', label: 'My Handover', icon: <FileText size={18} /> },
  { id: 'evidence-gaps', label: 'Evidence & Gaps', icon: <Search size={18} /> },
];

export function Sidebar() {
  const { activeRole, activeScreen, setActiveScreen, setActiveRole, currentUser } = useHandover();

  const navItems =
    activeRole === 'lead'
      ? LEAD_NAV
      : activeRole === 'departing'
        ? DEPARTING_NAV
        : INCOMING_NAV;

  return (
    <aside className="w-[260px] bg-white flex flex-col border-r border-[#E5EAF1] h-screen shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[#E5EAF1]">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Compass size={18} className="text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-navy-800 tracking-wide">TRAILMARK</span>
          <span className="text-[10px] font-medium text-muted uppercase tracking-widest">Handover OS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-navy-700 hover:bg-gray-50 hover:text-navy-800'
              }`}
            >
              <span className={isActive ? 'text-brand-600' : 'text-muted'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User info / Role switch */}
      <div className="border-t border-[#E5EAF1] p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
            {currentUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-800 truncate">{currentUser.name}</p>
            <p className="text-xs text-muted truncate">{currentUser.roleTitle}</p>
          </div>
          <button
            onClick={() => {
              setActiveRole('lead');
              setActiveScreen('role-select');
            }}
            className="p-1.5 rounded-md text-muted hover:text-navy-800 hover:bg-gray-100 transition-colors"
            title="Switch role"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
