'use client';

import React, { useEffect, useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Search, Bell, ChevronDown, RefreshCcw, Menu, X, Compass, LayoutDashboard, FilePlus, ClipboardCheck, FileText, Sparkles } from 'lucide-react';
import { Role } from '@/types';

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

const NAV_ITEMS_BY_ROLE: Record<Role, { id: string; label: string; icon: React.ReactNode }[]> = {
  lead: [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'create', label: 'Create Handover', icon: <FilePlus size={18} /> },
    { id: 'review', label: 'Review & Verification', icon: <ClipboardCheck size={18} /> },
  ],
  departing: [
    { id: 'departing-intro', label: 'Handover Overview', icon: <FileText size={18} /> },
    { id: 'interview', label: 'AI Question Agent', icon: <Sparkles size={18} /> },
  ],
  incoming: [
    { id: 'incoming-handover', label: 'Handover Knowledge', icon: <FileText size={18} /> },
    { id: 'evidence-gaps', label: 'Evidence & Gaps', icon: <Search size={18} /> },
  ],
};

export function TopNav() {
  const { activeScreen, activeRole, setActiveScreen, currentUser, resetDemoData, logout } = useHandover();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const title = SCREEN_TITLES[activeScreen] || 'Dashboard';
  const navItems = NAV_ITEMS_BY_ROLE[activeRole] || NAV_ITEMS_BY_ROLE.lead;

  return (
    <>
      <header className="h-16 sm:h-20 bg-[#F4F4F0] px-3 sm:px-8 flex items-center justify-between shrink-0 border-b border-[#E6E6DE]">
        {/* Left: Mobile hamburger menu + Page Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-1 text-[#3A3B34] hover:bg-[#EAEAE2] rounded-xl transition-colors"
            aria-label="Open navigation menu"
            title="Navigation menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base sm:text-2xl font-bold tracking-tight text-[#1F201B] truncate">{title}</h1>
        </div>

        {/* Right: Search, Notifications, Theme Pill, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Search Pill (Desktop) */}
          <div className="relative hidden lg:block">
            <input
              type="text"
              aria-label="Search projects, decisions"
              placeholder="Search projects, decisions..."
              className="w-52 xl:w-64 pl-4 pr-9 py-2 rounded-full border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#6B6C62] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] transition-all shadow-2xs"
            />
            <Search size={14} aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#62635A]" />
          </div>

          {/* Bell Notification Pill */}
          <button
            type="button"
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-white border border-[#E6E6DE] flex items-center gap-1.5 text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors shadow-2xs relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={13} aria-hidden="true" />
            <span className="text-[11px] sm:text-xs font-semibold hidden xs:inline">Alerts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5A5B4C]" aria-hidden="true" />
          </button>

          {/* Reset Demo Pill */}
          <button
            type="button"
            onClick={resetDemoData}
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-white border border-[#E6E6DE] flex items-center gap-1.5 text-xs font-medium text-[#62635A] hover:text-[#1F201B] hover:bg-[#EAEAE2] transition-colors shadow-2xs"
            title="Start over as Team Lead"
            aria-label="Start over as Team Lead"
          >
            <RefreshCcw size={12} aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => setActiveScreen('role-select')}
            className="flex items-center gap-1.5 sm:gap-2.5 pl-1 pr-2 sm:pr-3 py-1 rounded-full bg-white border border-[#E6E6DE] hover:bg-[#EAEAE2] transition-colors shadow-2xs"
            title="Switch demo persona"
            aria-label="Switch demo persona"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#5A5B4C] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser.avatar}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#1F201B] leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-[#62635A] leading-none mt-0.5">{currentUser.roleTitle.split(' ')[0]}</p>
            </div>
            <ChevronDown size={12} className="text-[#62635A]" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs" aria-hidden="true" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-[#F4F4F0] h-full shadow-elevated border-r border-[#E6E6DE] p-5 flex flex-col justify-between z-10">
            <div>
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E6DE] mb-5">
                <div className="flex items-center gap-2.5">
                  <img src="/Logo_trailmark.png" alt="Trailmark Logo" className="w-7 h-7 rounded-full object-cover shadow-2xs" />
                  <div>
                    <span className="text-base font-bold text-[#1F201B]">Trailmark</span>
                    <span className="block text-[9px] font-semibold text-[#62635A] tracking-[0.15em] uppercase -mt-0.5">
                      Handover OS
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#62635A] hover:bg-[#EAEAE2]"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        setActiveScreen(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white text-[#1F201B] shadow-2xs border border-[#E6E6DE]'
                          : 'text-[#62635A] hover:bg-[#EAEAE2] hover:text-[#1F201B]'
                      }`}
                    >
                      <span className={isActive ? 'text-[#5A5B4C]' : 'text-[#62635A]'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Switcher at Bottom */}
            <div className="pt-4 border-t border-[#E6E6DE]">
              <button
                type="button"
                onClick={() => {
                  setActiveScreen('role-select');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E6E6DE] text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#5A5B4C] text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1F201B]">{currentUser.name}</p>
                    <p className="text-[10px] text-[#62635A]">{currentUser.roleTitle}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#5A5B4C] underline">Switch</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout();
                }}
                className="w-full mt-2 p-2.5 rounded-2xl bg-white border border-[#E6E6DE] text-xs font-semibold text-[#3A3B34]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
