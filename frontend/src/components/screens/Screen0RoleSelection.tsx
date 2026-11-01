'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Role } from '@/types';
import { Shield, UserMinus, UserPlus, Compass, ArrowRight } from 'lucide-react';

const roles: { key: Role; label: string; subtitle: string; description: string; icon: React.ReactNode }[] = [
  {
    key: 'lead',
    label: 'Team Lead',
    subtitle: 'Lead & Reviewer',
    description: 'Create project handovers, review answers and evidence, resolve gaps, and approve completed handovers.',
    icon: <Shield size={28} />,
  },
  {
    key: 'departing',
    label: 'Departing Member',
    subtitle: 'Knowledge Source',
    description: 'Answer AI-generated questions about your project role, provide context, and document decisions.',
    icon: <UserMinus size={28} />,
  },
  {
    key: 'incoming',
    label: 'Incoming Member',
    subtitle: 'Knowledge Receiver',
    description: 'Review the approved handover, inspect evidence and gaps, and acknowledge receipt of project knowledge.',
    icon: <UserPlus size={28} />,
  },
];

export function Screen0RoleSelection() {
  const { setActiveRole, setActiveScreen } = useHandover();

  const handleSelect = (role: Role) => {
    setActiveRole(role);
    if (role === 'lead') setActiveScreen('dashboard');
    else if (role === 'departing') setActiveScreen('questions');
    else setActiveScreen('incoming-handover');
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
          <Compass size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy-800 tracking-tight">TRAILMARK</h1>
          <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.2em] -mt-0.5">Handover OS</p>
        </div>
      </div>

      {/* Heading */}
      <div className="text-center mt-8 mb-10 max-w-lg">
        <h2 className="text-2xl font-semibold text-navy-800 mb-2">
          Select your role
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          Choose a demo persona to explore the knowledge handover workflow — from project creation and AI-driven questions, through lead review, to incoming member acknowledgement.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => handleSelect(r.key)}
            className="group bg-white border border-[#E5EAF1] rounded-xl p-6 text-left hover:border-brand-300 hover:shadow-card-hover transition-all duration-200 flex flex-col"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
              {r.icon}
            </div>
            <h3 className="text-base font-semibold text-navy-800 mb-0.5">{r.label}</h3>
            <p className="text-xs font-medium text-brand-600 mb-3">{r.subtitle}</p>
            <p className="text-sm text-muted leading-relaxed flex-1">{r.description}</p>
            <div className="flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Continue <ArrowRight size={14} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs text-muted mt-10">
        Demo environment — no authentication required
      </p>
    </div>
  );
}
