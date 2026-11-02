'use client';

import React, { useState } from 'react';
import { useHandover, DEMO_CREDENTIALS } from '@/context/HandoverContext';
import { Role } from '@/types';
import { Shield, UserMinus, UserPlus, Compass, ArrowRight, Check, KeyRound, User, Mail, AlertCircle } from 'lucide-react';

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
      'Create and manage the Campus Events handover, upload project sources, trigger AI analysis, review statements, resolve discrepancies, and approve the handover.',
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
  const { switchDemoRole, setActiveScreen, login, register, errorMessage, clearMessages } = useHandover();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  // Custom login state
  const [showCustomAuth, setShowCustomAuth] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('password123');
  const [customAuthLoading, setCustomAuthLoading] = useState(false);

  const handleSelectRole = async (r: RoleOption) => {
    setLoadingRole(r.key);
    setSelectedRole(r.key);

    try {
      await switchDemoRole(r.key);
      setActiveScreen(r.targetScreen);
    } catch (err) {
      console.error('Role auth error:', err);
    } finally {
      setLoadingRole(null);
    }
  };

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomAuthLoading(true);
    clearMessages();

    let ok = false;
    if (isRegisterMode) {
      ok = await register(email, name, password);
    } else {
      ok = await login(email, password);
    }

    setCustomAuthLoading(false);
    if (ok) {
      setActiveScreen('dashboard');
    }
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

      {/* Error banner if present */}
      {errorMessage && (
        <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!showCustomAuth ? (
        <>
          {/* 3 Interactive Large Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.key;
              const isLoading = loadingRole === r.key;
              return (
                <div
                  key={r.key}
                  onClick={() => !loadingRole && handleSelectRole(r)}
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
                      disabled={isLoading}
                      className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#5A5B4C] text-white shadow-soft'
                          : 'bg-[#F4F4F0] text-[#1F201B] group-hover:bg-[#5A5B4C] group-hover:text-white'
                      }`}
                    >
                      {isLoading ? (
                        <span>Authenticating session...</span>
                      ) : isSelected ? (
                        <>
                          <Check size={14} /> Signed in as {r.assignedUser}
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

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowCustomAuth(true)}
              className="text-xs font-semibold text-[#5A5B4C] hover:text-[#1F201B] underline"
            >
              Sign in with custom email / account credentials
            </button>
          </div>
        </>
      ) : (
        /* Custom Account Login / Register Form */
        <div className="bg-white rounded-3xl p-8 border border-[#E6E6DE] shadow-elevated max-w-md w-full space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#1F201B]">
              {isRegisterMode ? 'Create an Account' : 'Sign In to Trailmark'}
            </h2>
            <p className="text-xs text-[#7A7B72] mt-1">
              Connects to real FastAPI HTTP-only cookie authentication.
            </p>
          </div>

          <form onSubmit={handleCustomAuth} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7B72]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Deepak Sharma"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1F201B] mb-1">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7B72]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F201B] mb-1">Password</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7B72]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={customAuthLoading}
              className="w-full py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft"
            >
              {customAuthLoading ? 'Processing...' : isRegisterMode ? 'Register & Sign In' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-[#E6E6DE] text-xs">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-[#5A5B4C] font-semibold hover:underline"
            >
              {isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>

            <button
              type="button"
              onClick={() => setShowCustomAuth(false)}
              className="text-[#7A7B72] hover:text-[#1F201B]"
            >
              Back to personas
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-xs text-[#7A7B72] max-w-md">
        <p>
          Testing against synthetic project: <strong>Campus Events App</strong>. Switch personas anytime from the top bar or sidebar.
        </p>
      </div>
    </div>
  );
}
