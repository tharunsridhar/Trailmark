'use client';

import React from 'react';
import { useHandover, DEMO_USERS } from '@/context/HandoverContext';
import { useTheme } from '@/context/ThemeContext';
import { Role } from '@/types';
import {
  Sun,
  Moon,
  Users,
  Compass,
  FileCheck2,
  HelpCircle,
  FolderGit2,
  PlusCircle,
  FileText,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export function Header() {
  const {
    activeRole,
    setActiveRole,
    activeScreen,
    setActiveScreen,
    currentUser,
    project,
    resetDemoData,
  } = useHandover();
  const { theme, toggleTheme } = useTheme();

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    if (role === 'lead') {
      setActiveScreen('dashboard');
    } else if (role === 'departing') {
      setActiveScreen('questions');
    } else if (role === 'incoming') {
      setActiveScreen('incoming-handover');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-200 border-slate-200 bg-white/90 dark:border-navy-800 dark:bg-navy-900/90 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveScreen('role-select')}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md bg-gradient-to-br from-brand-600 to-brand-800 dark:from-brand-500 dark:to-navy-700">
                <Compass className="w-5 h-5 text-white transform group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-brand-700 dark:text-blue-400 group-hover:text-brand-600 transition-colors">
                  Trailmark
                </span>
                <span className="hidden sm:inline-block text-xs ml-2 px-2 py-0.5 rounded-full font-medium bg-brand-50 text-brand-700 border border-brand-200 dark:bg-navy-800 dark:text-blue-300 dark:border-navy-700">
                  Knowledge Handover
                </span>
              </div>
            </button>
          </div>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {activeRole === 'lead' && (
              <>
                <button
                  onClick={() => setActiveScreen('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeScreen === 'dashboard'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveScreen('create')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeScreen === 'create'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Handover
                </button>
                <button
                  onClick={() => setActiveScreen('review')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
                    activeScreen === 'review'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Review & Approve
                  {project.isApproved && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </button>
              </>
            )}

            {activeRole === 'departing' && (
              <>
                <button
                  onClick={() => setActiveScreen('questions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeScreen === 'questions'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  AI Questions
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    {project.questions.filter((q) => q.status === 'answered').length}/
                    {project.questions.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveScreen('my-handover-departing')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeScreen === 'my-handover-departing'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  My Handover
                </button>
              </>
            )}

            {activeRole === 'incoming' && (
              <>
                <button
                  onClick={() => setActiveScreen('incoming-handover')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeScreen === 'incoming-handover'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  My Handover
                  {project.receipt.acknowledged && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                      Acknowledged
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveScreen('evidence-gaps')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeScreen === 'evidence-gaps'
                      ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-600 dark:text-white'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-navy-800'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Evidence & Gaps
                </button>
              </>
            )}
          </nav>

          {/* Right Controls: Role Switcher, Reset Demo, Theme Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Role Switcher Pill */}
            <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-950">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 text-slate-500 dark:text-slate-400 hidden xl:inline">
                Demo Role:
              </span>
              {(['lead', 'departing', 'incoming'] as Role[]).map((r) => {
                const isSelected = activeRole === r;
                return (
                  <button
                    key={r}
                    onClick={() => handleRoleChange(r)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {r === 'lead' ? 'Team Lead' : r === 'departing' ? 'Departing' : 'Incoming'}
                  </button>
                );
              })}
            </div>

            {/* Switch to Screen 0 (Role Selector Screen) */}
            <button
              onClick={() => setActiveScreen('role-select')}
              title="Return to Role Selection Screen"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-navy-800 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={resetDemoData}
              title="Reset Demo Data to Initial State"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-navy-800 dark:hover:bg-navy-800 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Theme Toggle (Dark Navy / Light Blue) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Navy Theme'}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-amber-500 dark:border-navy-800 dark:bg-navy-850 dark:hover:bg-navy-800 dark:text-amber-400 transition-colors shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-brand-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

