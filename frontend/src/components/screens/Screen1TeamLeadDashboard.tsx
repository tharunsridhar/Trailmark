'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  ChevronDown,
  Plus,
  Sparkles,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Github,
  Upload,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  FileCode2,
  Server,
  Database,
  Share2,
} from 'lucide-react';

export function Screen1TeamLeadDashboard() {
  const {
    project,
    dashboardMetrics,
    setActiveScreen,
    createNewProject,
    currentUser,
  } = useHandover();

  // Handover Creation Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    objectives: string;
    techStack: string;
    status: 'In Progress' | 'Pre-release' | 'Active Handover' | 'Approved' | 'Completed';
    departingMember: string;
    departingRole: string;
    incomingMember: string;
    githubRepo: string;
    documents: string[];
  }>({
    name: '',
    description: '',
    objectives: '',
    techStack: '',
    status: 'In Progress',
    departingMember: 'Alex Chen',
    departingRole: 'Backend Developer',
    incomingMember: 'Priya Sharma',
    githubRepo: 'https://github.com/trailmark-org/smart-healthcare-core',
    documents: ['Architecture_Decisions.md', 'Security_Checklist.pdf'],
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Architecture_Decisions_ADR-04.md',
    'Patient_Ingestion_SOP.pdf',
  ]);
  const [newFileName, setNewFileName] = useState('');

  const handleAddFile = () => {
    if (newFileName.trim()) {
      setUploadedFiles([...uploadedFiles, newFileName.trim()]);
      setNewFileName('');
    }
  };

  const handleRemoveFile = (fileToRemove: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f !== fileToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    createNewProject({
      ...formData,
      documents: uploadedFiles,
    });

    setIsFormOpen(false);
    setActiveScreen('review');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* =========================================================================
          ROW 1: Pastel Metric Cards + Evidence Analytics Bar Chart
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Soft Peach / Orange */}
        <div className="rounded-3xl p-6 bg-[#FFE7D6] dark:bg-[#2A1D17] border border-[#FFD0B3] dark:border-[#4A2E1F] flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01]">
          <span className="text-xs font-bold text-[#8A4A1C] dark:text-[#E8955A] uppercase tracking-wider">
            Handover Statements
          </span>
          <div className="my-3">
            <h3 className="text-3xl font-black text-[#4A240A] dark:text-[#FFD3B0] tracking-tight">
              1904claims
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A4A1C] dark:text-[#E8955A]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.93% extracted from sources</span>
          </div>
        </div>

        {/* Card 2: Soft Lime / Yellow-Green */}
        <div className="rounded-3xl p-6 bg-[#EEFAA3] dark:bg-[#1E260D] border border-[#DAEE76] dark:border-[#384714] flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01]">
          <span className="text-xs font-bold text-[#566E0C] dark:text-[#BFDD4B] uppercase tracking-wider">
            Verified Evidence
          </span>
          <div className="my-3">
            <h3 className="text-3xl font-black text-[#2B3903] dark:text-[#E3F888] tracking-tight">
              749sources
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#566E0C] dark:text-[#BFDD4B]">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>+5.93% test coverage</span>
          </div>
        </div>

        {/* Card 3: Soft Pink / Lavender */}
        <div className="rounded-3xl p-6 bg-[#F8D9FE] dark:bg-[#281530] border border-[#EBB6F5] dark:border-[#4B225C] flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01]">
          <span className="text-xs font-bold text-[#792C8B] dark:text-[#D987EE] uppercase tracking-wider">
            Handover Confidence
          </span>
          <div className="my-3">
            <h3 className="text-3xl font-black text-[#3E0F49] dark:text-[#F3CBFA] tracking-tight">
              92.4%
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#792C8B] dark:text-[#D987EE]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+5.93% verified claims</span>
          </div>
        </div>

        {/* Card 4: Evidence Analytic Multi-bar Chart (Spans top right) */}
        <div className="rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Evidence Analytic
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Weekly Audit</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex items-end justify-between h-24 pt-2 px-1">
            {[
              { day: 'Mon', h1: '65%', h2: '40%', h3: '85%' },
              { day: 'Tue', h1: '85%', h2: '55%', h3: '45%' },
              { day: 'Wed', h1: '95%', h2: '70%', h3: '90%' },
              { day: 'Thu', h1: '50%', h2: '80%', h3: '60%' },
              { day: 'Fri', h1: '75%', h2: '45%', h3: '80%' },
              { day: 'Sat', h1: '90%', h2: '60%', h3: '70%' },
              { day: 'Sun', h1: '80%', h2: '50%', h3: '85%' },
            ].map((col) => (
              <div key={col.day} className="flex flex-col items-center gap-1.5">
                <div className="flex items-end gap-1 h-20">
                  <div
                    style={{ height: col.h1 }}
                    className="w-1.5 rounded-full bg-[#DAEE76] dark:bg-[#b0cc34]"
                  />
                  <div
                    style={{ height: col.h2 }}
                    className="w-1.5 rounded-full bg-[#FFD0B3] dark:bg-[#d67a42]"
                  />
                  <div
                    style={{ height: col.h3 }}
                    className="w-1.5 rounded-full bg-[#EBB6F5] dark:bg-[#c664d9]"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400">{col.day}</span>
              </div>
            ))}
          </div>

          {/* Legend Below Chart */}
          <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-100 dark:border-navy-800 text-[10px] text-center">
            <div>
              <span className="text-slate-400 block">• Verified</span>
              <strong className="text-slate-800 dark:text-slate-200">28%</strong>
            </div>
            <div>
              <span className="text-slate-400 block">• Unverified</span>
              <strong className="text-slate-800 dark:text-slate-200">40%</strong>
            </div>
            <div>
              <span className="text-slate-400 block">• Gaps</span>
              <strong className="text-slate-800 dark:text-slate-200">32%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: Schedule (Calendar) + Revenue/Knowledge Wave + Completion Report
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Departure Schedule (Mini Calendar) - 3 cols */}
        <div className="lg:col-span-3 rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Departure Schedule
            </h4>
            <span className="text-[10px] font-semibold text-slate-400">Nov 2026</span>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid with lime highlighted days */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
            {[
              { d: 8, active: true },
              { d: 9 },
              { d: 10 },
              { d: 11, active: true },
              { d: 12 },
              { d: 13 },
              { d: 14 },
            ].map((item) => (
              <span
                key={item.d}
                className={`py-1 rounded-full ${
                  item.active
                    ? 'bg-[#D4F442] font-black text-slate-950 shadow-sm'
                    : ''
                }`}
              >
                {item.d}
              </span>
            ))}
            {[
              { d: 15 },
              { d: 16 },
              { d: 17 },
              { d: 18, active: true },
              { d: 19, active: true },
              { d: 20 },
              { d: 21 },
            ].map((item) => (
              <span
                key={item.d}
                className={`py-1 rounded-full ${
                  item.active
                    ? 'bg-[#D4F442] font-black text-slate-950 shadow-sm'
                    : ''
                }`}
              >
                {item.d}
              </span>
            ))}
            {[
              { d: 22, active: true },
              { d: 23 },
              { d: 24 },
              { d: 25 },
              { d: 26 },
              { d: 27 },
              { d: 28 },
            ].map((item) => (
              <span
                key={item.d}
                className={`py-1 rounded-full ${
                  item.active
                    ? 'bg-[#D4F442] font-black text-slate-950 shadow-sm'
                    : ''
                }`}
              >
                {item.d}
              </span>
            ))}
            {[
              { d: 29 },
              { d: 30, active: true },
              { d: 31, active: true },
            ].map((item) => (
              <span
                key={item.d}
                className={`py-1 rounded-full ${
                  item.active
                    ? 'bg-[#D4F442] font-black text-slate-950 shadow-sm'
                    : ''
                }`}
              >
                {item.d}
              </span>
            ))}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D4F442]"></span>
              Handover Milestones
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">6 Events</span>
          </div>
        </div>

        {/* Knowledge Wave Curve Chart - 6 cols */}
        <div className="lg:col-span-6 rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Knowledge Reconstructed
              </h4>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D4F442]"></span> Verified Sources
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span> Unverified Claims
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <span>Weekly</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* SVG Wave Chart */}
          <div className="relative h-44 w-full pt-4">
            {/* Value Callout Badge */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold shadow-md flex items-center gap-1.5 z-10">
              <span className="text-emerald-400">+9,488 claims</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">12 gaps</span>
            </div>

            <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="limeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D4F442" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D4F442" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="currentColor" className="text-slate-100 dark:text-navy-800" strokeDasharray="3 3" />
              <line x1="0" y1="55" x2="500" y2="55" stroke="currentColor" className="text-slate-100 dark:text-navy-800" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="currentColor" className="text-slate-100 dark:text-navy-800" strokeDasharray="3 3" />

              {/* Secondary dashed curve */}
              <path
                d="M 10 90 C 70 70, 130 110, 200 85 C 270 60, 330 95, 410 75 C 450 65, 480 70, 495 65"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-slate-300 dark:text-slate-600"
              />

              {/* Primary Lime Wave Curve */}
              <path
                d="M 10 75 C 80 110, 140 40, 220 70 C 280 90, 330 20, 390 45 C 440 65, 470 50, 495 40"
                fill="none"
                stroke="#B5DE1C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Fill under primary curve */}
              <path
                d="M 10 75 C 80 110, 140 40, 220 70 C 280 90, 330 20, 390 45 C 440 65, 470 50, 495 40 L 495 130 L 10 130 Z"
                fill="url(#limeGrad)"
              />
            </svg>
          </div>

          {/* Chart X-Axis Days */}
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-2 pt-2 border-t border-slate-100 dark:border-navy-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Handover Completion Report (Dual Gauge Arcs) - 3 cols */}
        <div className="lg:col-span-3 rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Completion Report
            </h4>
            <span className="text-[10px] font-bold text-emerald-500">Audit Ready</span>
          </div>

          {/* Dual Semicircular Gauge Graphic */}
          <div className="flex items-center justify-center gap-6 py-3">
            {/* Gauge 1: 56% Verified Claims */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-14 overflow-hidden flex items-end justify-center">
                <svg viewBox="0 0 100 55" className="w-24 h-14">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-100 dark:text-navy-800"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 65 14"
                    fill="none"
                    stroke="#D4F442"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1">• Verified Claims</span>
              <strong className="text-sm font-black text-slate-800 dark:text-slate-100">56%</strong>
            </div>

            {/* Gauge 2: 44% Successor Prepared */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-14 overflow-hidden flex items-end justify-center">
                <svg viewBox="0 0 100 55" className="w-24 h-14">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-100 dark:text-navy-800"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 52 10"
                    fill="none"
                    stroke="#EBB6F5"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-1">• Gaps Resolved</span>
              <strong className="text-sm font-black text-slate-800 dark:text-slate-100">44%</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Handover status: <strong className="text-brand-600 dark:text-blue-400">{project.status}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Quick Handover Profile Cards (Product Cards from image)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Active Handover - Smart Healthcare */}
        <div
          onClick={() => setActiveScreen('review')}
          className="group cursor-pointer rounded-3xl p-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-brand-600 dark:text-blue-400 font-black text-lg shadow-inner group-hover:scale-105 transition-transform">
            <FileCode2 className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300">
              Primary Handover
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-brand-600 transition-colors">
              {project.name}
            </h4>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
              {project.departingRole}
            </p>
          </div>
        </div>

        {/* Card 2: Secondary Handover - Distributed Pipeline */}
        <div
          onClick={() => setActiveScreen('review')}
          className="group cursor-pointer rounded-3xl p-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-amber-500 font-black text-lg shadow-inner group-hover:scale-105 transition-transform">
            <Server className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              Queue Worker
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-amber-500 transition-colors">
              Patient Ingestion Engine
            </h4>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
              Celery / Redis Stack
            </p>
          </div>
        </div>

        {/* Card 3: Quick Add Handover Button */}
        <div
          onClick={() => setIsFormOpen(true)}
          className="cursor-pointer rounded-3xl p-5 bg-white dark:bg-navy-900 border-2 border-dashed border-slate-200 dark:border-navy-800 hover:border-brand-500 dark:hover:border-blue-400 transition-all flex items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#D4F442] text-slate-950 flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Add Handover
            </h4>
            <span className="text-xs text-slate-400">Initialize AI Pipeline</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 4: Handover Audit History Table + Knowledge Distribution Map
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Audit Table - 8 cols */}
        <div className="lg:col-span-8 rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Transaction & Audit History
            </h4>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 cursor-pointer">
              <span>Newest</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-800 text-[10px] font-bold uppercase text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Leaver & Handover</th>
                  <th className="pb-3 font-semibold">Source Ref</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Claims</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-navy-850/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-400">#982</td>
                  <td className="py-3 font-bold text-slate-900 dark:text-white">Alex Chen</td>
                  <td className="py-3 text-slate-500 font-mono">PR #104 (Backoff)</td>
                  <td className="py-3 text-slate-400">August 9, 2026</td>
                  <td className="py-3 font-mono font-bold">$139.75</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Success
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-navy-850/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-400">#091</td>
                  <td className="py-3 font-bold text-slate-900 dark:text-white">Sarah Jenkins</td>
                  <td className="py-3 text-slate-500 font-mono">deploy/celery.sh</td>
                  <td className="py-3 text-slate-400">August 9, 2026</td>
                  <td className="py-3 font-mono font-bold">$738.00</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Failed (Gap)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-navy-850/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-400">#090</td>
                  <td className="py-3 font-bold text-slate-900 dark:text-white">Michael Zhang</td>
                  <td className="py-3 text-slate-500 font-mono">Architecture_ADR-04</td>
                  <td className="py-3 text-slate-400">August 9, 2026</td>
                  <td className="py-3 font-mono font-bold">$389.09</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Success
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Source Distribution Map - 4 cols */}
        <div className="lg:col-span-4 rounded-3xl p-6 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Product Distribution
            </h4>
            <span className="text-[10px] font-bold text-slate-400">4 Connected Nodes</span>
          </div>

          {/* SVG Vector World / Nodes Distribution Map */}
          <div className="relative h-36 w-full flex items-center justify-center">
            <svg viewBox="0 0 320 130" className="w-full h-full text-slate-300 dark:text-navy-700">
              {/* Map Outline Dotted Nodes */}
              <circle cx="50" cy="45" r="3" fill="#D4F442" />
              <circle cx="100" cy="70" r="3" fill="#EBB6F5" />
              <circle cx="160" cy="35" r="4" fill="#3B82F6" />
              <circle cx="230" cy="60" r="3" fill="#D4F442" />
              <circle cx="270" cy="85" r="3" fill="#EBB6F5" />

              {/* Connecting Arcs */}
              <path
                d="M 50 45 Q 105 15, 160 35"
                fill="none"
                stroke="#EBB6F5"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <path
                d="M 160 35 Q 195 20, 230 60"
                fill="none"
                stroke="#EBB6F5"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <path
                d="M 100 70 Q 185 100, 270 85"
                fill="none"
                stroke="#EBB6F5"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* World outline dots */}
              {[
                [40, 40], [60, 40], [70, 50], [50, 60],
                [90, 65], [110, 75], [105, 85],
                [150, 30], [170, 30], [165, 45], [180, 50],
                [220, 55], [240, 65], [250, 75], [230, 80],
                [260, 80], [280, 90], [290, 85],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.4" />
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-navy-800 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Github className="w-3.5 h-3.5" />
              <span>GitHub (PRs/Commits)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Database className="w-3.5 h-3.5" />
              <span>S3 Vault / SOP Docs</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HANDOVER CREATION FORM MODAL
      ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-600 dark:text-blue-400" />
                  Create Handover & Initialize AI Pipeline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure repository sources and target roles for automated knowledge extraction.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Distributed Patient Sync Engine"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Technology Stack *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="e.g. Python, FastAPI, PostgreSQL, Celery"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Project Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe core architecture and services..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Project Objectives
                  </label>
                  <textarea
                    rows={2}
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Key transitions, milestone deliverables..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'In Progress' | 'Pre-release' | 'Active Handover' | 'Approved' | 'Completed',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Pre-release">Pre-release</option>
                    <option value="Active Handover">Active Handover</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    value={formData.githubRepo}
                    onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                    placeholder="https://github.com/org/repo"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Departing Member Role
                  </label>
                  <select
                    value={formData.departingRole}
                    onChange={(e) => setFormData({ ...formData, departingRole: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white"
                  >
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="DevOps & Infrastructure Engineer">DevOps & Infrastructure Engineer</option>
                    <option value="Full-Stack Engineer">Full-Stack Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Incoming Member
                  </label>
                  <select
                    value={formData.incomingMember}
                    onChange={(e) => setFormData({ ...formData, incomingMember: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white"
                  >
                    <option value="Priya Sharma">Priya Sharma</option>
                    <option value="David Miller">David Miller</option>
                    <option value="Anita Rao">Anita Rao</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Attach Documents (ADRs, Specifications)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Add document filename (e.g. ADR_Architecture.md)"
                      className="flex-1 p-2 rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddFile}
                      className="px-3 py-2 bg-slate-200 dark:bg-navy-800 rounded-xl font-bold"
                    >
                      Attach
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uploadedFiles.map((file) => (
                      <span
                        key={file}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-[11px]"
                      >
                        <FileText className="w-3 h-3 text-brand-600" />
                        {file}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file)}
                          className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-navy-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4F442] text-slate-950 font-black shadow-md hover:bg-[#c3e634]"
                >
                  Create Handover & Generate Questions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
