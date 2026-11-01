'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import {
  FileCheck2,
  FileText,
  UserCheck,
  ShieldCheck,
  AlertOctagon,
  Edit3,
  Trash2,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  FolderGit2,
  FileCode,
  MessageSquare,
  BookmarkCheck,
} from 'lucide-react';

export function Screen3TeamLeadReview() {
  const {
    project,
    editStatement,
    rejectStatement,
    resolveGap,
    flagGap,
    approveHandover,
    setActiveScreen,
    currentUser,
  } = useHandover();

  const [activeTab, setActiveTab] = useState<'summary' | 'answers' | 'evidence' | 'gaps'>('summary');

  // Edit statement modal/inline state
  const [editingStatementId, setEditingStatementId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Gap resolution modal/input state
  const [resolvingGapId, setResolvingGapId] = useState<string | null>(null);
  const [resolutionReason, setResolutionReason] = useState<string>('');

  // Source quote inspector modal
  const [inspectedEvidenceId, setInspectedEvidenceId] = useState<string | null>(null);

  const startEdit = (id: string, currentText: string) => {
    setEditingStatementId(id);
    setEditContent(currentText);
  };

  const saveEdit = (id: string) => {
    if (editContent.trim()) {
      editStatement(id, editContent.trim());
      setEditingStatementId(null);
    }
  };

  const handleResolveGap = (gapId: string) => {
    if (resolutionReason.trim()) {
      resolveGap(gapId, resolutionReason.trim());
      setResolvingGapId(null);
      setResolutionReason('');
    }
  };

  const handleApprove = () => {
    approveHandover();
    // Navigate to incoming handover screen or show success
    setActiveScreen('incoming-handover');
  };

  const inspectedPiece = project.evidencePieces.find((e) => e.id === inspectedEvidenceId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Approval Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-blue-300 mb-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Governance & Quality Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Lead Review, Verification & Handover Sign-Off
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Audit extracted claims, verify evidence citations, edit or reject inaccurate statements, and sign off the handover package for incoming engineer <strong>{project.incomingMember}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {project.isApproved ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-sm">
              <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Approved & Published</span>
            </div>
          ) : (
            <button
              onClick={handleApprove}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition-all"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Approve and Publish Handover</span>
            </button>
          )}

          <button
            onClick={() => setActiveScreen('incoming-handover')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-navy-800 border border-slate-300 dark:border-navy-700 transition-colors"
          >
            <span>Preview Incoming View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation: The 4 Required Sections */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1. Project Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('answers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'answers'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>2. Member Answers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
            {project.questions.filter((q) => q.status === 'answered').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>3. Evidence Sources</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 dark:bg-navy-700 dark:text-slate-200 font-bold">
            {project.evidencePieces.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('gaps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'gaps'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>4. Gaps & Conflicts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
            {project.gaps.filter((g) => g.status === 'open').length} Open
          </span>
        </button>
      </div>

      {/* SECTION 1: Project Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-blue-400" />
                AI-Generated Reconstructed Project Overview
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Source: Synthesized from repository commits & ADRs
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                <strong>{project.name}</strong> is a specialized clinical operations platform. It implements a FHIR-compliant patient ingestion pipeline, asynchronous medical queueing, and secure tele-health appointment routing.
              </p>
              <p>
                Key backend subsystems are implemented in <strong>FastAPI</strong> with PostgreSQL for transactional records, Redis for caching, and Celery workers managing asynchronous document generation and insurance payment retries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Key Objectives
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {project.objectives}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Handover Context
                </h3>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p>• Departing Engineer: <strong>{project.departingMember}</strong> ({project.departingRole})</p>
                  <p>• Incoming Engineer: <strong>{project.incomingMember}</strong></p>
                  <p>• Technology Stack: <strong>{project.techStack}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Member Answers */}
      {activeTab === 'answers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-navy-950 border border-brand-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>
              Answers submitted by <strong>{project.departingMember}</strong>. Review, edit explanations, or reject inaccurate claims before publishing.
            </span>
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              Preserved as Unverified until corroborated
            </span>
          </div>

          <div className="space-y-4">
            {project.questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-brand-600 dark:text-blue-400">
                      Question #{idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {q.question}
                    </h3>
                  </div>
                  <EvidenceBadge status={q.evidenceStatus} />
                </div>

                {/* Question Trigger Reason */}
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-950 p-2.5 rounded-lg border border-slate-100 dark:border-navy-800">
                  <strong>Source rationale:</strong> {q.reason}
                </p>

                {/* Answer Content */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Departing Member Statement:
                  </span>
                  {editingStatementId === q.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-brand-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingStatementId(null)}
                          className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-navy-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(q.id)}
                          className="px-3 py-1 text-xs font-semibold rounded bg-brand-600 text-white"
                        >
                          Save Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {q.answer ? (
                        q.answer
                      ) : (
                        <span className="italic text-slate-400">No answer provided yet (Pending).</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Lead Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-800 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {q.updatedAt ? `Saved at ${new Date(q.updatedAt).toLocaleTimeString()}` : 'Awaiting leaver input'}
                  </span>

                  <div className="flex items-center gap-2">
                    {q.answer && (
                      <button
                        onClick={() => startEdit(q.id, q.answer || '')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      onClick={() => rejectStatement(`st-${q.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reject Statement</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Evidence Sources */}
      {activeTab === 'evidence' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300">
            Every statement in Trailmark links back to genuine source files, commits, or task records. Inspect the exact cited text below.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.evidencePieces.map((piece) => {
              const isCommit = piece.type === 'commit';
              const isDoc = piece.type === 'doc';
              const isChat = piece.type === 'chat';

              return (
                <div
                  key={piece.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                        {isCommit && <FileCode className="w-3 h-3 text-brand-600 dark:text-blue-400" />}
                        {isDoc && <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        {isChat && <MessageSquare className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                        {piece.type.toUpperCase()}
                      </span>
                      <EvidenceBadge status="verified" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {piece.title}
                    </h4>

                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
                      Ref: {piece.sourceRef}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border-l-2 border-brand-500 dark:border-blue-400 text-xs italic text-slate-700 dark:text-slate-300">
                      "{piece.quote}"
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Author: {piece.author}</span>
                    <span>{piece.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: Gaps & Conflicts */}
      {activeTab === 'gaps' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
            <strong>Gaps Policy:</strong> Missing or conflicting knowledge is intentionally surfaced, never fabricated or smoothed over by the AI. Review and provide written resolutions where appropriate.
          </div>

          <div className="space-y-4">
            {project.gaps.map((gap) => {
              const isResolved = gap.status === 'resolved';

              return (
                <div
                  key={gap.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-navy-900 ${
                    isResolved
                      ? 'border-emerald-200 dark:border-emerald-900/60'
                      : 'border-rose-200 dark:border-rose-900/60 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          gap.risk === 'High'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {gap.risk} Risk Gap
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {gap.title}
                      </h4>
                    </div>

                    <EvidenceBadge status="missing_conflicting" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                    {gap.description}
                  </p>

                  {gap.sourcesInConflict && (
                    <div className="mb-3 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-500">
                      <strong>Sources in conflict: </strong>
                      {gap.sourcesInConflict.join(' vs ')}
                    </div>
                  )}

                  {isResolved ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                      <strong>Resolution recorded by Team Lead:</strong> {gap.resolutionReason}
                    </div>
                  ) : resolvingGapId === gap.id ? (
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Written Rationale for Conflict / Gap Resolution:
                      </label>
                      <textarea
                        rows={2}
                        value={resolutionReason}
                        onChange={(e) => setResolutionReason(e.target.value)}
                        placeholder="State why this approach is chosen or how the gap was settled..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setResolvingGapId(null)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolveGap(gap.id)}
                          disabled={!resolutionReason.trim()}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                        >
                          Confirm Resolution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                      <button
                        onClick={() => {
                          setResolvingGapId(gap.id);
                          setResolutionReason('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve with Reason</span>
                      </button>

                      <button
                        onClick={() => flagGap(gap.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                      >
                        <span>Flag for Successor</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

