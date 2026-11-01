'use client';

import React from 'react';
import { useHandover, DEMO_USERS } from '@/context/HandoverContext';
import { Role } from '@/types';
import { Compass, ShieldCheck, HelpCircle, ArrowRight, BookOpen, Layers } from 'lucide-react';

export function Screen0RoleSelection() {
  const { setActiveRole, setActiveScreen, project } = useHandover();

  const handleSelectRole = (role: Role) => {
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Hero */}
      <div className="max-w-2xl text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 border border-brand-200 text-brand-700 dark:bg-navy-900 dark:border-navy-700 dark:text-blue-300 shadow-sm">
          <Compass className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          <span>Interactive Role Gateway</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Welcome to <span className="text-brand-600 dark:text-blue-400">Trailmark</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Select a demo persona to explore the complete knowledge handover lifecycle: from project creation and AI question generation, through lead verification, to incoming member handover.
        </p>
      </div>

      {/* Role Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Card 1: Team Lead */}
        <div
          onClick={() => handleSelectRole('lead')}
          className="group relative cursor-pointer rounded-2xl p-6 transition-all duration-300 border bg-white border-slate-200 hover:border-brand-500 hover:shadow-xl dark:bg-navy-900 dark:border-navy-800 dark:hover:border-blue-500 dark:hover:shadow-navy-950/80 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-tr from-brand-600 to-indigo-600 dark:from-brand-500 dark:to-indigo-500 shadow-md group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-blue-400 transition-colors">
                  Team Lead
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300">
                  Lead & Reviewer
                </span>
              </div>
              <p className="text-xs text-brand-600 dark:text-blue-400 font-medium mt-1">
                {DEMO_USERS.lead.name}
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Create project handovers, configure documents and repositories, review departing answers, audit evidence links, resolve gaps, and publish the verified handover.
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
            <span>Enter as Team Lead</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Departing Member */}
        <div
          onClick={() => handleSelectRole('departing')}
          className="group relative cursor-pointer rounded-2xl p-6 transition-all duration-300 border bg-white border-slate-200 hover:border-amber-500 hover:shadow-xl dark:bg-navy-900 dark:border-navy-800 dark:hover:border-amber-500 dark:hover:shadow-navy-950/80 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-tr from-amber-500 to-orange-600 shadow-md group-hover:scale-105 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Departing Member
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                  Leaver
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                {DEMO_USERS.departing.name} ({project.departingRole})
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Review targeted, AI-generated questions specific to your role. Provide contextual explanations, mark unknowns, or skip questions without writing tedious handover docs from scratch.
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Answer AI Questions ({project.questions.filter((q) => q.status === 'answered').length}/{project.questions.length})</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Incoming Member */}
        <div
          onClick={() => handleSelectRole('incoming')}
          className="group relative cursor-pointer rounded-2xl p-6 transition-all duration-300 border bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xl dark:bg-navy-900 dark:border-navy-800 dark:hover:border-emerald-500 dark:hover:shadow-navy-950/80 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Incoming Member
                </h3>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  Successor
                </span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                {DEMO_USERS.incoming.name}
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Receive the verified, source-linked handover. Inspect architectural decisions, unfinished tasks, dependencies, transparent gaps, and confirm formal receipt.
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>{project.receipt.acknowledged ? 'Receipt Acknowledged' : 'Inspect Handover'}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Active Project Summary Footer */}
      <div className="mt-12 max-w-xl w-full p-4 rounded-xl border border-slate-200 bg-white/80 dark:border-navy-800 dark:bg-navy-900/60 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Current Demo Handover: <strong className="text-slate-800 dark:text-slate-200">{project.name}</strong> • Status: <span className="font-semibold text-brand-600 dark:text-blue-400">{project.status}</span>
        </p>
      </div>
    </div>
  );
}

