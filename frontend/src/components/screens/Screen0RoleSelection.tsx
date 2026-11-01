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
    badge: 'Lead & Reviewer',
    assignedUser: 'Kishan S',
    userRole: 'Engineering Lead',
    description:
      'Create project handovers, provide project details, manage departing members, review AI-generated information, verify evidence and approve handovers.',
    icon: <Shield size={28} />,
    targetScreen: 'dashboard',
  },
  {
    key: 'departing',
    title: 'Departing Team Member',
    badge: 'Knowledge Source',
    assignedUser: 'Alex Chen',
    userRole: 'Senior Backend Developer',
    description:
      'Participate in an AI-guided knowledge handover interview, answer questions based on your project role, provide text or voice responses and submit your knowledge to the Team Lead.',
    icon: <UserMinus size={28} />,
    targetScreen: 'departing-intro',
  },
  {
    key: 'incoming',
    title: 'Incoming Team Member',
    badge: 'Successor',
    assignedUser: 'Priya Sharma',
    userRole: 'Incoming Software Engineer',
    description:
      'Access the Team Lead-approved project handover, understand responsibilities, inspect supporting evidence, identify missing information and acknowledge receipt.',
    icon: <UserPlus size={28} />,
    targetScreen: 'incoming-handover',
  },
];

export function Screen0RoleSelection() {
  const { setActiveRole, setActiveScreen } = useHandover();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelectRole = (r: RoleOption) => {
    setSelectedRole(r.key);
    setIsTransitioning(true);
    setActiveRole(r.key);

    setTimeout(() => {
      setActiveScreen(r.targetScreen);
    }, 280);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
          <Compass size={22} className="text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold text-[#0F172A] tracking-wider">TRAILMARK</span>
          <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.2em] mt-0.5">
            Handover OS
          </span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="text-center max-w-xl mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mb-2.5">
          Welcome to Trailmark
        </h1>
        <p className="text-base sm:text-lg text-[#64748B] font-medium mb-4">
          Your project knowledge, carried forward.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-brand-600">
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
              className={`group relative bg-white border rounded-2xl p-7 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-lg -translate-y-1'
                  : 'border-[#E2E8F0] hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* Card Top: Icon & Badge */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-brand-600 text-white'
                        : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100'
                    }`}
                  >
                    {r.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#64748B]">
                    {r.badge}
                  </span>
                </div>

                {/* Role Title */}
                <h2 className="text-xl font-bold text-[#0F172A] mb-1.5">{r.title}</h2>

                {/* Persona Tag */}
                <p className="text-xs font-medium text-brand-600 mb-3.5">
                  Demo persona: <span className="font-semibold">{r.assignedUser}</span> ({r.userRole})
                </p>

                {/* Detailed Spec Description */}
                <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                  {r.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-50 text-[#0F172A] group-hover:bg-brand-600 group-hover:text-white'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check size={16} /> Entering workspace...
                    </>
                  ) : (
                    <>
                      Select {r.title} <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Notes */}
      <div className="mt-12 text-center text-xs text-[#64748B] max-w-md">
        <p>
          Demonstration mode for Round 2. Seeded with sample healthcare pipeline project. You can switch personas at any point using the sidebar switch.
        </p>
      </div>
    </div>
  );
}
