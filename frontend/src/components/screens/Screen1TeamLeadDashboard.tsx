'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { QuestionCategory } from '@/types';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  FileText,
  GitBranch,
  Upload,
  ChevronDown,
  Sparkles,
  Layers,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  Compass,
  Users,
  Shield,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function Screen1TeamLeadDashboard() {
  const {
    project,
    dashboardMetrics,
    activeHandoverId,
    activeHandover,
    handovers,
    selectHandover,
    createHandover,
    members,
    addMember,
    sources,
    analysis,
    isAnalyzing,
    uploadSyntheticSources,
    uploadCustomSource,
    triggerAnalysis,
    refreshSources,
    questions,
    setActiveScreen,
    errorMessage,
    successMessage,
    clearMessages,
  } = useHandover();

  // Create Handover Form State
  const [formData, setFormData] = useState({
    name: 'Campus Events App',
    description: 'Asha is leaving - transitioning campus ticketing, payment webhooks, and worker daemons.',
    departingMember: 'Asha',
    departingRole: 'Backend Developer',
    incomingMember: 'Kiran',
    githubRepo: 'https://github.com/campus-synthetic/events-app',
    techStack: 'Python, FastAPI, SQLite (WAL), Render, Celery, ReportLab, Tailwind CSS',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const [showNewHandoverModal, setShowNewHandoverModal] = useState(false);
  const [newHandoverTitle, setNewHandoverTitle] = useState('Campus Events Transition');
  const [newHandoverProject, setNewHandoverProject] = useState('Campus Events App');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'departing' | 'incoming'>('departing');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isCreatingHandover, setIsCreatingHandover] = useState(false);

  const handleCreateNewHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingHandover || !newHandoverTitle.trim() || !newHandoverProject.trim()) return;
    setIsCreatingHandover(true);
    const newId = await createHandover(newHandoverTitle.trim(), newHandoverProject.trim());
    setIsCreatingHandover(false);
    if (newId) {
      setShowNewHandoverModal(false);
    }
  };

  const handleUploadSynthetic = async () => {
    if (!activeHandoverId) {
      setShowNewHandoverModal(true);
      return;
    }
    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadSyntheticSources();
      setUploadResult({ success: res.success, failed: res.failed });
    } catch (err) {
      console.error('Synthetic upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setIsAddingMember(true);
    await addMember(newMemberEmail.trim(), newMemberRole);
    setNewMemberEmail('');
    setIsAddingMember(false);
  };

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const type = ext === 'json' ? 'chat' : ext === 'csv' ? 'tasks' : 'doc';
      await uploadCustomSource(file, type, file.name);
    }
    setIsUploading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Notifications / Errors */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={clearMessages} className="text-xs underline hover:text-red-950">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={clearMessages} className="text-xs underline hover:text-emerald-950">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Action Bar with Active Handover Selector & Quick Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-[#1F201B]">Team Lead Handover Control</h2>
            {activeHandoverId && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAEAE2] text-[#5A5B4C] border border-[#E6E6DE]">
                Handover #{activeHandoverId}
              </span>
            )}
            {activeHandover && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  activeHandover.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {activeHandover.status}
              </span>
            )}
          </div>
          <p className="text-xs text-[#62635A] mt-0.5">
            Manage handover setup, upload project sources, run the evidence-grounded AI analysis, and approve the final package.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {handovers.length > 1 && (
            <div className="relative">
              <select
                aria-label="Choose handover"
                value={activeHandoverId || ''}
                onChange={(e) => selectHandover(Number(e.target.value))}
                className="px-3.5 py-2 rounded-full bg-white border border-[#E6E6DE] text-xs font-medium text-[#3A3B34] pr-8 appearance-none focus:outline-none"
              >
                {handovers.map((h) => (
                  <option key={h.id} value={h.id}>
                    #{h.id} {h.project_name} ({h.status})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#62635A] pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowNewHandoverModal(true)}
            className="px-4 py-2 rounded-full bg-white border border-[#E6E6DE] text-xs font-medium text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>New Handover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('review')}
            className="px-5 py-2 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5"
          >
            <span>Review & Approve</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* New Handover Modal */}
      {showNewHandoverModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F201B]">Create Knowledge Handover</h3>
              <button
                type="button"
                onClick={() => setShowNewHandoverModal(false)}
                className="text-xs text-[#62635A] hover:text-[#1F201B]"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleCreateNewHandover} className="space-y-3.5">
              <div>
                <label htmlFor="f1-field-1" className="block text-xs font-semibold text-[#1F201B] mb-1">Project Name</label>
                <input id="f1-field-1"
                  type="text"
                  value={newHandoverProject}
                  onChange={(e) => setNewHandoverProject(e.target.value)}
                  placeholder="e.g. Campus Events App"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
                />
              </div>
              <div>
                <label htmlFor="f1-field-2" className="block text-xs font-semibold text-[#1F201B] mb-1">Handover Title / Summary</label>
                <input id="f1-field-2"
                  type="text"
                  value={newHandoverTitle}
                  onChange={(e) => setNewHandoverTitle(e.target.value)}
                  placeholder="e.g. Asha is leaving - backend handover"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
                />
              </div>
              <div className="p-3 rounded-xl bg-[#F4F4F0] text-[11px] text-[#62635A]">
                Creates a new handover via <code className="text-[#5A5B4C]">POST /handovers</code>. Asha and Kiran will be automatically registered and invited.
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewHandoverModal(false)}
                  className="px-4 py-2 rounded-full border border-[#E6E6DE] text-xs text-[#62635A] hover:bg-[#EAEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingHandover}
                  className="px-5 py-2 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold hover:bg-[#4A4B3E] disabled:opacity-50"
                >
                  {isCreatingHandover ? 'Creating...' : 'Create Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#62635A] font-medium">Uploaded Sources</p>
          <p className="text-2xl font-bold text-[#1F201B] mt-1">{sources.filter((s) => s.status === 'ok').length}</p>
          <p className="text-[11px] text-[#5A5B4C] mt-1 font-medium">
            {sources.reduce((acc, s) => acc + (s.piece_count || 0), 0)} extracted pieces
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#62635A] font-medium">AI Questions</p>
          <p className="text-2xl font-bold text-[#1F201B] mt-1">{questions.length}</p>
          <p className="text-[11px] text-[#62635A] mt-1">
            {questions.filter((q) => q.status === 'answered').length} answered by Asha
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#62635A] font-medium">Analysis Verification</p>
          <p className="text-2xl font-bold text-[#5A5B4C] mt-1">
            {analysis?.counts ? `${analysis.counts.verified} V / ${analysis.counts.conflicting} C` : 'Pending'}
          </p>
          <p className="text-[11px] text-[#62635A] mt-1">
            {analysis ? `Mode: ${analysis.mode}` : 'Run analysis to compute'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#62635A] font-medium">Handover State</p>
          <p className="text-base font-bold text-[#1F201B] mt-1 truncate">
            {activeHandover?.status === 'approved' ? 'Approved & Published' : 'In Draft Review'}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {activeHandover?.status === 'approved' ? 'Successor receipt pending' : 'Requires Lead sign-off'}
          </p>
        </div>
      </div>

      {/* Main Grid: Left 8 cols (Sources, Members, AI Pipeline) & Right 4 cols (Questions preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Synthetic Sources & Uploads */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1F201B]">1. Project Sources & Evidence</h3>
                <p className="text-xs text-[#62635A] mt-0.5">
                  Upload repositories, ADRs, tasks, and team chat from <code className="text-[#5A5B4C]">data/synthetic/manifest.json</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadSynthetic}
                  disabled={!activeHandoverId || isUploading}
                  title={!activeHandoverId ? 'Create a handover first before uploading sources' : 'Upload 9 synthetic files'}
                  className="px-4 py-2 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Uploading 9 Files...</span>
                    </>
                  ) : !activeHandoverId ? (
                    <>
                      <AlertCircle size={13} />
                      <span>Create a handover first</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Upload Synthetic Manifest</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Uploaded Sources List */}
            {sources.length > 0 ? (
              <div className="border border-[#E6E6DE] rounded-2xl overflow-hidden divide-y divide-[#E6E6DE]">
                <div className="bg-[#F4F4F0] px-4 py-2.5 text-[11px] font-bold text-[#62635A] grid grid-cols-12 uppercase tracking-wider">
                  <div className="col-span-5">Source File / Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Access Control</div>
                  <div className="col-span-2 text-right">Extracted Pieces</div>
                </div>
                {sources.map((s) => (
                  <div key={s.id} className="px-4 py-2.5 text-xs grid grid-cols-12 items-center hover:bg-[#FAF9F6] transition-colors">
                    <div className="col-span-5 font-semibold text-[#1F201B] flex items-center gap-2">
                      <FileText size={13} className="text-[#5A5B4C] shrink-0" />
                      <span className="truncate">{s.name}</span>
                      {s.status !== 'ok' && (
                        <span
                          className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
                          title={s.note || undefined}
                        >
                          {s.status === 'empty' ? 'Empty, not imported' : 'Unreadable, not imported'}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-[#62635A] uppercase font-bold text-[10px]">
                      {s.type}
                    </div>
                    <div className="col-span-3">
                      {s.allowed_roles.length === 1 && s.allowed_roles[0] === 'lead' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Shield size={10} /> Lead Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F4F4F0] text-[#5A5B4C]">
                          All Members
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-bold text-[#1F201B]">
                      {s.piece_count} pieces
                    </div>
                  </div>
                ))}
              </div>
            ) : !activeHandoverId ? (
              <div className="border border-dashed border-[#DCDCD2] rounded-2xl p-6 text-center bg-[#FAF9F6] space-y-2.5">
                <AlertCircle size={24} className="text-amber-600 mx-auto" />
                <p className="text-xs font-semibold text-[#1F201B]">No handover created yet</p>
                <p className="text-[11px] text-[#62635A] max-w-sm mx-auto">
                  Please create a handover project first before uploading project sources or synthetic manifests.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewHandoverModal(true)}
                  className="px-4 py-1.5 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold hover:bg-[#4A4B3E] shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={13} />
                  <span>Create a handover first</span>
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-[#DCDCD2] rounded-2xl p-6 text-center bg-[#FAF9F6]">
                <Upload size={24} className="text-[#62635A] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#1F201B]">No sources uploaded yet</p>
                <p className="text-[11px] text-[#62635A] mt-0.5 max-w-sm mx-auto">
                  Click &ldquo;Upload Synthetic Manifest&rdquo; above to load the 9 Campus Events app files (architecture docs, chats, tasks, git commits).
                </p>
              </div>
            )}

            {/* Custom file upload input */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs text-[#62635A] flex items-center gap-2 cursor-pointer hover:text-[#1F201B] focus-within:ring-2 focus-within:ring-[#5A5B4C] rounded-md">
                <span className="underline font-semibold text-[#5A5B4C]">Upload additional custom files (pick one or many)</span>
                <input type="file" multiple onChange={handleCustomFileUpload} className="sr-only" />
              </label>
              <button
                type="button"
                onClick={refreshSources}
                className="text-xs text-[#62635A] hover:text-[#1F201B] flex items-center gap-1"
              >
                <RefreshCw size={12} /> Refresh sources
              </button>
            </div>
          </div>

          {/* Section 2: AI Reconstruction & Gap Pipeline */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
                  <Sparkles size={16} className="text-[#5A5B4C]" />
                  2. AI Analysis &amp; Evidence Verification
                </h3>
                <p className="text-xs text-[#62635A] mt-0.5">
                  Reconstructs architectural decisions, verifies claims across sources, and detects conflicts and gaps.
                </p>
              </div>

              <button
                type="button"
                onClick={triggerAnalysis}
                disabled={isAnalyzing || sources.length === 0}
                className="px-5 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] disabled:opacity-40 text-white text-xs font-semibold shadow-soft flex items-center gap-2 transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing Sources...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Run AI Analysis Pipeline</span>
                  </>
                )}
              </button>
            </div>

            {/* Mode / Fallback Notice */}
            {analysis?.notice && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Notice ({analysis.mode}): </strong>
                  <span>{analysis.notice}</span>
                </div>
              </div>
            )}

            {/* Analysis Counts Grid */}
            {analysis ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Verified</p>
                  <p className="text-xl font-bold text-emerald-900 mt-0.5">{analysis.counts?.verified || 0}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Unverified</p>
                  <p className="text-xl font-bold text-amber-900 mt-0.5">{analysis.counts?.unverified || 0}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-800">Missing Gaps</p>
                  <p className="text-xl font-bold text-red-900 mt-0.5">{analysis.counts?.missing || 0}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Conflicts</p>
                  <p className="text-xl font-bold text-rose-900 mt-0.5">{analysis.counts?.conflicting || 0}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-center col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#62635A]">Dropped</p>
                  <p className="text-xl font-bold text-[#1F201B] mt-0.5">{analysis.dropped || 0}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-center text-xs text-[#62635A]">
                Pipeline not run yet. Click &ldquo;Run AI Analysis Pipeline&rdquo; above to extract knowledge statements and formulate departing questions.
              </div>
            )}
          </div>

          {/* Section 3: Handover Members & Access */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
                  <Users size={16} className="text-[#5A5B4C]" />
                  3. Handover Members
                </h3>
                <p className="text-xs text-[#62635A] mt-0.5">
                  Designate departing engineer and incoming successor to participate in the handover.
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#E6E6DE] border border-[#E6E6DE] rounded-2xl overflow-hidden">
              {members.length > 0 ? (
                members.map((m) => (
                  <div key={m.user_id} className="p-3.5 flex items-center justify-between bg-white hover:bg-[#FAF9F6]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#5A5B4C] text-white flex items-center justify-center text-xs font-bold">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1F201B]">{m.name}</p>
                        <p className="text-[11px] text-[#62635A]">{m.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.role === 'lead'
                          ? 'bg-[#EAEAE2] text-[#5A5B4C]'
                          : m.role === 'departing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#62635A]">
                  Deepak (Lead), Asha (Departing), Kiran (Incoming)
                </div>
              )}
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                aria-label="Member email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter user email (e.g. kiran@campus-synthetic.internal)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
              />
              <select
                aria-label="Member role"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] bg-white focus:outline-none"
              >
                <option value="departing">Departing Member</option>
                <option value="incoming">Incoming Member</option>
              </select>
              <button
                type="submit"
                disabled={isAddingMember || !newMemberEmail.trim()}
                className="px-4 py-2 rounded-xl bg-white border border-[#E6E6DE] text-xs font-semibold text-[#3A3B34] hover:bg-[#EAEAE2] disabled:opacity-40 transition-colors"
              >
                Add Member
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (4 cols): AI Question Agent & Live Questions Preview */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F201B] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#5A5B4C]" />
              Departing Questions ({questions.length})
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F4F0] text-[#5A5B4C]">
              Asha (Backend)
            </span>
          </div>

          <p className="text-xs text-[#62635A] leading-relaxed">
            Formulated from git commits, PRs, and task boards. Departing member answers these via the AI Knowledge Interview.
          </p>

          <div className="space-y-3 pt-1 max-h-[560px] overflow-y-auto pr-1">
            {questions.length > 0 ? (
              questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs space-y-1.5 hover:bg-[#EAEAE2] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5A5B4C] uppercase tracking-wider">
                      Risk Level: {q.risk}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        q.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'skipped'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-white text-[#62635A]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="font-semibold text-[#1F201B] leading-snug">{q.text}</p>
                  {q.evidence?.[0] && (
                    <p className="text-[11px] text-[#62635A] leading-relaxed italic border-l-2 border-[#5A5B4C] pl-2 mt-1">
                      {q.evidence[0].locator}: &ldquo;{q.evidence[0].quote}&rdquo;
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-[#F4F4F0] text-center text-xs text-[#62635A]">
                Upload sources and run analysis to populate AI questions for Asha.
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveScreen('review')}
              className="w-full py-2.5 rounded-full bg-white border border-[#E6E6DE] hover:bg-[#F4F4F0] text-xs font-semibold text-[#3A3B34] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Go to Review & Verification</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

