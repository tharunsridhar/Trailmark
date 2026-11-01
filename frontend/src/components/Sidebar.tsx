'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutGrid,
  Calendar,
  MessageSquare,
  Users,
  Globe,
  FolderArchive,
  BarChart3,
  FileEdit,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const { activeScreen, setActiveScreen, project, activeRole } = useHandover();
  const { theme, setTheme } = useTheme();

  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;
  const pendingCount = project.questions.length - answeredCount;

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 min-h-screen p-5 transition-colors duration-200 select-none">
      {/* Top Brand Logo */}
      <div className="space-y-6">
        <div
          onClick={() => setActiveScreen('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                TRAILMARK
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-0.5">
              Handover OS
            </span>
          </div>
        </div>

        {/* Section: Menu */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2">
            Menu
          </span>

          {/* Dashboard */}
          <button
            onClick={() => setActiveScreen('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeScreen === 'dashboard'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Calendar / Timeline */}
          <button
            onClick={() => setActiveScreen('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800`}
          >
            <Calendar className="w-4 h-4" />
            <span>Departure Schedule</span>
          </button>

          {/* Chat / Departing Questions */}
          <button
            onClick={() => setActiveScreen('questions')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeScreen === 'questions'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Q&A Discussions</span>
            </div>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-lime-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Team Members */}
          <button
            onClick={() => setActiveScreen('role-select')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Project Team</span>
          </button>

          {/* Knowledge Base / Sources */}
          <button
            onClick={() => setActiveScreen('review')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800 transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>Knowledge Sources</span>
          </button>

          {/* File Manager */}
          <button
            onClick={() => setActiveScreen('incoming-handover')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800 transition-all"
          >
            <FolderArchive className="w-4 h-4" />
            <span>Document Hub</span>
          </button>
        </div>

        {/* Section: Utilities & Governance */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2">
            Governance
          </span>

          {/* Evidence Review */}
          <button
            onClick={() => setActiveScreen('review')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeScreen === 'review'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Review & Approval</span>
          </button>

          {/* Create Handover Form */}
          <button
            onClick={() => setActiveScreen('create')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeScreen === 'create'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Create Handover</span>
          </button>

          {/* Incoming Handover View */}
          <button
            onClick={() => setActiveScreen('incoming-handover')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeScreen === 'incoming-handover'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-navy-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Successor View</span>
          </button>
        </div>
      </div>

      {/* Bottom Segmented Pill Theme Switcher (Light / Dark) */}
      <div className="pt-6 border-t border-slate-100 dark:border-navy-800">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-navy-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>Dark</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

