'use client';

import React, { useState } from 'react';
import { useHandover, DEMO_USERS } from '@/context/HandoverContext';
import { Role } from '@/types';
import {
  Search,
  Command,
  HelpCircle,
  Settings,
  Share2,
  Plus,
  Users,
  ChevronDown,
  Download,
} from 'lucide-react';

export function TopNav() {
  const {
    activeRole,
    setActiveRole,
    activeScreen,
    setActiveScreen,
    currentUser,
    project,
  } = useHandover();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleRoleSelect = (role: Role) => {
    setActiveRole(role);
    setIsRoleDropdownOpen(false);
    if (role === 'lead') {
      setActiveScreen('dashboard');
    } else if (role === 'departing') {
      setActiveScreen('questions');
    } else if (role === 'incoming') {
      setActiveScreen('incoming-handover');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-slate-200 dark:border-navy-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md px-6 flex items-center justify-between transition-colors duration-200">
      {/* Search Input with ⌘K Badge */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything here..."
            className="w-full pl-10 pr-12 py-2 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <div className="absolute right-3 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-navy-800 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5 pointer-events-none">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Need Help, Settings, Share, Demo Role Dropdown, and Primary Action */}
      <div className="flex items-center space-x-3">
        {/* Need Help */}
        <button
          onClick={() => setActiveScreen('questions')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Need Help</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setActiveScreen('create')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('Handover link copied to clipboard!');
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 transition-all"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Share</span>
        </button>

        {/* Demo Persona Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.avatar}
            </div>
            <span className="hidden md:inline font-bold">
              {activeRole === 'lead' ? 'Team Lead' : activeRole === 'departing' ? 'Departing Member' : 'Incoming Member'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl py-2 z-50 animate-in fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-1 block">
                Switch Persona
              </span>
              {(['lead', 'departing', 'incoming'] as Role[]).map((r) => {
                const u = DEMO_USERS[r];
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleSelect(r)}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-800 ${
                      activeRole === r ? 'font-bold text-brand-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.roleTitle}</div>
                    </div>
                    {activeRole === r && <span className="w-2 h-2 rounded-full bg-brand-600"></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Primary Action Button (Matches the bright Lime / Green Export button from image) */}
        <button
          onClick={() => setActiveScreen('create')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#D4F442] text-slate-950 hover:bg-[#c3e634] shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Handover</span>
        </button>
      </div>
    </header>
  );
}
