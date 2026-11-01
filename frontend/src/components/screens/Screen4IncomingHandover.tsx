'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import {
  ShieldCheck,
  CheckCircle2,
  FolderGit2,
  AlertTriangle,
  Code2,
  Cpu,
  Layers,
  FileText,
  UserCheck,
  ExternalLink,
  Clock,
  Sparkles,
  BookmarkCheck,
  HelpCircle,
  AlertOctagon,
} from 'lucide-react';

export function Screen4IncomingHandover() {
  const { project, acknowledgeReceipt, currentUser } = useHandover();
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState<string | null>(null);

  const isAcknowledged = project.receipt.acknowledged;

  // Filter statements by category for clean presentation
  const decisions = project.statements.filter((s) => s.category === 'decision');
  const ownership = project.statements.filter((s) => s.category === 'ownership');
  const unfinished = project.statements.filter((s) => s.category === 'unfinished');
  const risks = project.statements.filter((s) => s.category === 'risk');

  const inspectedPiece = project.evidencePieces.find((e) => e.id === selectedEvidenceModal);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome / Handover Status Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Incoming Engineer Handover Document</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Handover prepared for <strong>{project.incomingMember}</strong> ({currentUser.roleTitle}) from departing engineer <strong>{project.departingMember}</strong>.
            </p>
          </div>

          <div className="flex-shrink-0">
            {isAcknowledged ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Acknowledged</span>
              </div>
            ) : project.isApproved ? (
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 dark:bg-navy-800 dark:border-navy-700 text-xs font-bold text-brand-700 dark:text-blue-300">
                Ready for Review & Receipt
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-400">
                Under Lead Review (Preview Mode)
              </span>
            )}
          </div>
        </div>

        {/* Status Callout if Acknowledged */}
        {isAcknowledged && (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>
              ✓ Handover receipt officially acknowledged by <strong>{project.receipt.acknowledgedBy}</strong> on{' '}
              {project.receipt.acknowledgedAt
                ? new Date(project.receipt.acknowledgedAt).toLocaleDateString() +
                  ' at ' +
                  new Date(project.receipt.acknowledgedAt).toLocaleTimeString()
                : 'Today'}
              .
            </span>
            <span className="italic text-[11px] opacity-80">Gaps remain transparently tracked.</span>
          </div>
        )}
      </div>

      {/* 1. Project Overview & Tech Stack */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          Project Overview & System Context
        </h2>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {project.description}
        </p>

        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-600 dark:text-blue-400" />
              Technologies Used
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.techStack.split(',').map((tech) => (
                <span
                  key={tech.trim()}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200"
                >
                  {tech.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-brand-600 dark:text-blue-400" />
              Repository & Codebase Link
            </span>
            <a
              href={project.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-medium text-brand-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 break-all pt-1"
            >
              <span>{project.githubRepo}</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Important Decisions */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          Important Architecture & Engineering Decisions
        </h2>

        <div className="space-y-3">
          {decisions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/60 dark:bg-navy-950/60 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <EvidenceBadge
                  status={item.evidenceStatus}
                  onClickEvidence={item.evidenceId ? () => setSelectedEvidenceModal(item.evidenceId!) : undefined}
                />
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.content}
              </p>

              {item.sourceLabel && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Source: <strong>{item.sourceLabel}</strong></span>
                  {item.evidenceQuote && (
                    <button
                      onClick={() => item.evidenceId && setSelectedEvidenceModal(item.evidenceId)}
                      className="text-brand-600 dark:text-blue-400 hover:underline text-[11px]"
                    >
                      (View quote)
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Responsibilities & Ownership */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-brand-600 dark:text-blue-400" />
          Responsibilities & Ownership Handover
        </h2>

        <div className="space-y-3">
          {ownership.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/60 dark:bg-navy-950/60 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <EvidenceBadge status={item.evidenceStatus} />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Unfinished Tasks */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Unfinished Tasks & In-Flight Work
        </h2>

        <div className="space-y-3">
          {unfinished.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-navy-950/60 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <EvidenceBadge status={item.evidenceStatus} />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.content}
              </p>
              {item.departingAnswer && (
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 italic pt-1">
                  Leaver note: "{item.departingAnswer}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Dependencies and Risks */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Dependencies, Architectural Risks & Caveats
        </h2>

        <div className="space-y-3">
          {risks.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-navy-950/60 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <EvidenceBadge status={item.evidenceStatus} />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.content}
              </p>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block">
                Source: {item.sourceLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Missing Information and Unresolved Gaps */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            Missing Information & Unresolved Gaps
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            Transparently Tracked
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Trailmark never conceals missing knowledge or invents facts. These known unknowns should be noted during your onboarding.
        </p>

        <div className="space-y-3">
          {project.gaps.map((gap) => (
            <div
              key={gap.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/70 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {gap.title}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    gap.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {gap.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {gap.description}
              </p>
              {gap.resolutionReason && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <strong>Lead Resolution:</strong> {gap.resolutionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 7. Departing Member's Answers & Evidence Status */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          Departing Member's Recorded Answers
        </h2>

        <div className="space-y-3">
          {project.questions
            .filter((q) => q.status === 'answered')
            .map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {q.question}
                  </h3>
                  <EvidenceBadge status={q.evidenceStatus} />
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-800 dark:text-slate-200">
                  {q.answer}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Bottom Acknowledgement Section */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Formal Handover Acknowledgement
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
            Confirming receipt confirms you have received and reviewed this handover package and its linked evidence. Open gaps remain transparently logged for follow-up.
          </p>
        </div>

        {isAcknowledged ? (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Receipt Formally Acknowledged</span>
          </div>
        ) : (
          <button
            onClick={acknowledgeReceipt}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition-all flex-shrink-0"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Acknowledge Handover Receipt</span>
          </button>
        )}
      </div>

      {/* Modal for Source Quote Inspection */}
      {selectedEvidenceModal && inspectedPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-navy-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-blue-400">
                Verified Source Citation
              </span>
              <button
                onClick={() => setSelectedEvidenceModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {inspectedPiece.title}
            </h3>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
              Location: {inspectedPiece.sourceRef}
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border-l-4 border-emerald-500 text-xs italic text-slate-800 dark:text-slate-200">
              "{inspectedPiece.quote}"
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-800">
              <span>Author: {inspectedPiece.author}</span>
              <span>Logged: {inspectedPiece.timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

