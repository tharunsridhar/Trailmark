'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Role } from '@/types';
import { Shield, UserMinus, UserPlus, Compass, ArrowRight, Check } from 'lucide-react';

interface RoleOption {
  key: Role;
  title: string;
  badge: string;
  assignedUser: string;
  userRole: string;
  description: string;
  icon: React.ReactNode;
  targetScreen: string;
}

const ROLES: RoleOption[] = [
  {
    key: 'lead',
    title: 'Team Lead',
    badge: 'Reviewer',
    assignedUser: 'Deepak',
    userRole: 'Engineering Lead',
    description:
      'Manage the Campus Events handover, review Asha\'s answers against repository sources, resolve discrepancies (such as auditorium capacity limits), and approve the handover.',
    icon: <Shield size={26} />,
    targetScreen: 'dashboard',
  },
  {
    key: 'departing',
    title: 'Departing Team Member',
    badge: 'Knowledge Source',
    assignedUser: 'Asha',
    userRole: 'Senior Backend Developer (Leaver)',
    description:
      'Participate in the AI-guided knowledge interview, explain the SQLite WAL setup, answer unowned task and PR questions, clarify dependencies, and submit answers to Deepak.',
    icon: <UserMinus size={26} />,
    targetScreen: 'departing-intro',
  },
  {
    key: 'incoming',
    title: 'Incoming Team Member',
    badge: 'Successor',
    assignedUser: 'Kiran',
    userRole: 'Software Engineer (Successor)',
    description:
      'Access the approved Campus Events handover, inspect verified architecture decisions, review open gaps (like unowned S3 backups), and acknowledge receipt.',
    icon: <UserPlus size={26} />,
    targetScreen: 'incoming-handover',
  },
];

export function Screen0RoleSelection() {
  const { setActiveRole, setActiveScreen } = useHandover();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleSelectRole = (r: RoleOption) => {
    setSelectedRole(r.key);
    setActiveRole(r.key);

    setTimeout(() => {
      setActiveScreen(r.targetScreen);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center px-4 py-12 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#5A5B4C] flex items-center justify-center text-white shadow-soft">
          <Compass size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-[#1F201B]">Trailmark</span>
          <span className="text-[10px] font-semibold text-[#7A7B72] tracking-[0.18em] uppercase -mt-0.5">
            Handover OS
          </span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="text-center max-w-xl mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1F201B] mb-2">
          Welcome to Trailmark
        </h1>
        <p className="text-base text-[#7A7B72] font-medium mb-4">
          Your project knowledge, carried forward.
        </p>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E6E6DE] text-xs font-semibold text-[#5A5B4C] shadow-2xs">
          <span>How would you like to continue?</span>
        </div>
      </div>

      {/* 3 Interactive Large Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {ROLES.map((r) => {
          const isSelected = selectedRole === r.key;
          return (
            <div
              key={r.key}
              onClick={() => handleSelectRole(r)}
              className={`group relative bg-white border rounded-3xl p-7 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-[#5A5B4C] ring-2 ring-[#5A5B4C]/20 shadow-elevated -translate-y-1'
                  : 'border-[#E6E6DE] hover:border-[#5A5B4C] hover:shadow-soft hover:-translate-y-0.5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#5A5B4C] text-white'
                        : 'bg-[#F4F4F0] text-[#5A5B4C] group-hover:bg-[#EAEAE2]'
                    }`}
                  >
                    {r.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F4F4F0] text-[#7A7B72]">
                    {r.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#1F201B] mb-1">{r.title}</h2>
                <p className="text-xs font-medium text-[#5A5B4C] mb-3">
                  Persona: <span className="font-semibold">{r.assignedUser}</span> ({r.userRole.split('(')[0].trim()})
                </p>

                <p className="text-xs text-[#7A7B72] leading-relaxed mb-6">
                  {r.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E6E6DE]">
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#5A5B4C] text-white shadow-soft'
                      : 'bg-[#F4F4F0] text-[#1F201B] group-hover:bg-[#5A5B4C] group-hover:text-white'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check size={14} /> Entering as {r.assignedUser}...
                    </>
                  ) : (
                    <>
                      Enter as {r.title} <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-xs text-[#7A7B72] max-w-md">
        <p>
          Testing against synthetic project: <strong>Campus Events App</strong>. Switch personas anytime from the top bar or sidebar.
        </p>
      </div>
    </div>
  );
}
