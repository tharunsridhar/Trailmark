'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Github,
  Upload,
  FileText,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Activity,
} from 'lucide-react';

export function Screen1TeamLeadDashboard() {
  const {
    project,
    dashboardMetrics,
    setActiveScreen,
    createNewProject,
    currentUser,
  } = useHandover();

  // Create Form State
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
    // Directly guide to review or AI questions
    setActiveScreen('review');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-blue-300 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Team Lead Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Lead Dashboard & Project Overseer
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.roleTitle}). Create new handovers, configure authorized sources, and audit AI-extracted project claims.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 shadow-md transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isFormOpen ? 'Close Creation Form' : 'Create New Handover'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Projects</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-navy-800 text-brand-600 dark:text-blue-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-white">
            {dashboardMetrics.totalProjects}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Active repository workspaces</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Handovers</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-white">
            {dashboardMetrics.pendingHandovers}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">In progress & leaver Q&A</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting Approval</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-white">
            {dashboardMetrics.awaitingApproval}
          </p>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 block">Ready for lead verification</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completed Handovers</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-900 dark:text-white">
            {dashboardMetrics.completedHandovers}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Receipt acknowledged</span>
        </div>
      </div>

      {/* Create Handover Form Drawer/Modal */}
      {isFormOpen && (
        <div className="p-6 sm:p-8 rounded-2xl border border-brand-200 bg-blue-50/40 dark:border-navy-700 dark:bg-navy-900/90 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-blue-400" />
                Create Handover & Initialize AI Pipeline
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Provide comprehensive project context. The AI analyzes these parameters and connected repository to generate targeted questions for the departing member.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Distributed Patient Sync Engine"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Technology Stack */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Technology Stack <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  placeholder="e.g. Python, FastAPI, PostgreSQL, Celery, Docker"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Project Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed context of the platform architecture, key modules, and user flows..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Project Objectives */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Objectives & Milestones
                </label>
                <textarea
                  rows={2}
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  placeholder="Upcoming release targets, performance goals, and key transitions..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Project Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current Project Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'In Progress' | 'Pre-release' | 'Active Handover' | 'Approved' | 'Completed' })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Pre-release">Pre-release</option>
                  <option value="Active Handover">Active Handover</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              {/* GitHub Repository */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Github className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="url"
                    value={formData.githubRepo}
                    onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                    placeholder="https://github.com/org/repo"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Departing Member */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Departing Member
                </label>
                <select
                  value={formData.departingMember}
                  onChange={(e) => setFormData({ ...formData, departingMember: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Alex Chen">Alex Chen (Senior Backend Engineer)</option>
                  <option value="Sarah Jenkins">Sarah Jenkins (DevOps Specialist)</option>
                  <option value="Michael Zhang">Michael Zhang (Frontend Architect)</option>
                </select>
              </div>

              {/* Member's Role */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Member's Project Role
                </label>
                <select
                  value={formData.departingRole}
                  onChange={(e) => setFormData({ ...formData, departingRole: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="DevOps & Infrastructure Engineer">DevOps & Infrastructure Engineer</option>
                  <option value="Full-Stack Engineer">Full-Stack Engineer</option>
                  <option value="Lead Mobile Architect">Lead Mobile Architect</option>
                </select>
              </div>

              {/* Incoming Member */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Incoming Member
                </label>
                <select
                  value={formData.incomingMember}
                  onChange={(e) => setFormData({ ...formData, incomingMember: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Priya Sharma">Priya Sharma (Incoming Software Engineer)</option>
                  <option value="David Miller">David Miller (Junior Developer)</option>
                  <option value="Anita Rao">Anita Rao (Associate Engineer)</option>
                </select>
              </div>

              {/* Project Documents Upload */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Documents (ADRs, Specifications, Chat Archives)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Attach file or enter filename (e.g. Architecture_Decision_Record_ADR-04.md)"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddFile}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-navy-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-navy-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Attach
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {uploadedFiles.map((file) => (
                    <span
                      key={file}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-white dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-blue-400" />
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

            <div className="pt-4 border-t border-slate-200 dark:border-navy-700 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Handover & Generate AI Questions</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Handovers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Handover Portfolios</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current state of handovers under your review and governance.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300">
            1 Active Handover
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-navy-850/50 transition-colors">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{project.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    project.status === 'Approved'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : project.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {project.status}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Stack: {project.techStack}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-2xl">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Leaver: <strong className="text-slate-700 dark:text-slate-200">{project.departingMember}</strong> ({project.departingRole})</span>
                <span>•</span>
                <span>Successor: <strong className="text-slate-700 dark:text-slate-200">{project.incomingMember}</strong></span>
                <span>•</span>
                <span>Questions: <strong className="text-slate-700 dark:text-slate-200">{project.questions.filter((q) => q.status === 'answered').length}/{project.questions.length}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setActiveScreen('review')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 transition-colors shadow-sm"
              >
                <span>Review & Approve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Handover Activity Section */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          Recent Handover Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5"></div>
            <div>
              <p className="text-slate-800 dark:text-slate-200">
                <strong>Alex Chen</strong> answered question regarding <span className="italic">"Emergency Access Token Strategy"</span>.
              </p>
              <span className="text-[10px] text-slate-400">Marked as Unverified • Pending lead verification</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
            <div>
              <p className="text-slate-800 dark:text-slate-200">
                AI Pipeline extracted <strong className="font-semibold">5 source evidence citations</strong> from GitHub PR #104 and ADR-04.
              </p>
              <span className="text-[10px] text-slate-400">Claims linked to commits and doc quotes</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5"></div>
            <div>
              <p className="text-slate-800 dark:text-slate-200">
                Automated gap check flagged <span className="font-semibold text-rose-600 dark:text-rose-400">Redis cache fallback omission</span> in `cache.py`.
              </p>
              <span className="text-[10px] text-slate-400">High Risk • Transferred to Gaps section</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
