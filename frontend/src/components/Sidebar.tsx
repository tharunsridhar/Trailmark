'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  LayoutDashboard,
  FilePlus,
  ClipboardCheck,
  FileText,
  Sparkles,
  Search,
  LogOut,
  FolderKanban,
  Users,
  Compass,
  Layers,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const LEAD_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'create', label: 'Create Handover', icon: <FilePlus size={18} /> },
  { id: 'review', label: 'Review & Verification', icon: <ClipboardCheck size={18} /> },
];

const DEPARTING_NAV: NavItem[] = [
  { id: 'departing-intro', label: 'Handover Overview', icon: <FileText size={18} /> },
  { id: 'interview', label: 'AI Question Agent', icon: <Sparkles size={18} /> },
];

const INCOMING_NAV: NavItem[] = [
  { id: 'incoming-handover', label: 'Handover Knowledge', icon: <FileText size={18} /> },
  { id: 'evidence-gaps', label: 'Evidence & Gaps', icon: <Search size={18} /> },
];

export function Sidebar() {
  const { activeRole, activeScreen, setActiveScreen, currentUser } = useHandover();

  const navItems =
    activeRole === 'lead'
      ? LEAD_NAV
      : activeRole === 'departing'
        ? DEPARTING_NAV
        : INCOMING_NAV;

  return (
    <aside className="w-[260px] bg-[#F4F4F0] flex flex-col border-r border-[#E6E6DE] h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-6">
        <div className="w-8 h-8 rounded-full bg-[#5A5B4C] flex items-center justify-center text-white shadow-2xs">
          <Compass size={17} />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-[#1F201B]">Trailmark</span>
          <span className="text-[10px] font-semibold text-[#7A7B72] tracking-[0.15em] uppercase -mt-0.5">
            Handover OS
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
        {/* Active Role Category */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold text-[#7A7B72] uppercase tracking-[0.18em]">
            {activeRole === 'lead' ? 'Team Lead Workspace' : activeRole === 'departing' ? 'Departing Member' : 'Incoming Successor'}
          </div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                activeScreen === item.id ||
                (item.id === 'create' && activeScreen === 'create') ||
                (item.id === 'interview' && (activeScreen === 'questions' || activeScreen === 'my-handover-departing'));

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#5A5B4C] text-white shadow-soft font-semibold'
                      : 'text-[#3A3B34] hover:bg-[#EAEAE2] hover:text-[#1F201B]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#7A7B72]'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Access */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold text-[#7A7B72] uppercase tracking-[0.18em]">
            Governance
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveScreen('role-select')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors"
            >
              <Users size={17} className="text-[#7A7B72]" />
              <span>Switch Persona</span>
            </button>
          </div>
        </div>
      </div>

      {/* User info Card at bottom */}
      <div className="p-4 border-t border-[#E6E6DE]">
        <div className="bg-white rounded-2xl p-3 border border-[#E6E6DE] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#EAEAE2] text-[#5A5B4C] flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F201B] truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-[#7A7B72] truncate">{currentUser.roleTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('role-select')}
            className="px-2 py-1 text-[#7A7B72] hover:text-[#1F201B] hover:bg-[#F4F4F0] rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
            title="Switch demo persona"
            aria-label="Switch demo persona"
          >
            <LogOut size={13} aria-hidden="true" />
            <span className="text-[11px] font-semibold">Switch</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
