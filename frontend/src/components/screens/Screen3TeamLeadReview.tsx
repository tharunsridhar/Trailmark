'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Statement, Gap, Question, EvidenceStatus } from '@/types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Shield,
  Flag,
  Edit3,
  Check,
  X,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from 'lucide-react';

// ─── Tabs ───────────────────────────────────────────────
type Tab = 'summary' | 'answers' | 'evidence' | 'gaps';

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-brand-600 text-brand-600'
          : 'border-transparent text-muted hover:text-navy-800 hover:border-gray-300'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Evidence Badge ─────────────────────────────────────
function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  const config = {
    verified: { icon: <ShieldCheck size={13} />, bg: 'bg-green-50', text: 'text-green-700', label: 'Verified' },
    unverified: { icon: <ShieldQuestion size={13} />, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Unverified' },
    missing_conflicting: { icon: <ShieldAlert size={13} />, bg: 'bg-red-50', text: 'text-red-700', label: 'Missing / Conflicting' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Summary Tab ────────────────────────────────────────
function SummaryPanel({ project }: { project: ReturnType<typeof useHandover>['project'] }) {
  const answered = project.questions.filter((q) => q.status === 'answered').length;
  const total = project.questions.length;
  const verified = project.statements.filter((s) => s.evidenceStatus === 'verified').length;
  const openGaps = project.gaps.filter((g) => g.status === 'open').length;

  const items = [
    { label: 'Questions Answered', value: `${answered}/${total}`, color: 'text-brand-600' },
    { label: 'Verified Statements', value: `${verified}/${project.statements.length}`, color: 'text-green-600' },
    { label: 'Open Gaps', value: `${openGaps}`, color: openGaps > 0 ? 'text-red-600' : 'text-green-600' },
    { label: 'Departing Member', value: project.departingMember, color: 'text-navy-800' },
    { label: 'Incoming Member', value: project.incomingMember, color: 'text-navy-800' },
    { label: 'Tech Stack', value: project.techStack, color: 'text-navy-800' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E5EAF1] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-navy-800 mb-4">Handover Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted mb-0.5">{item.label}</p>
              <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E5EAF1] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-navy-800 mb-2">Project Description</h4>
        <p className="text-sm text-navy-700 leading-relaxed">{project.description}</p>
        <h4 className="text-sm font-semibold text-navy-800 mt-4 mb-2">Objectives</h4>
        <p className="text-sm text-navy-700 leading-relaxed">{project.objectives}</p>
      </div>

      {/* Documents */}
      <div className="bg-white border border-[#E5EAF1] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-navy-800 mb-3">Source Documents</h4>
        <div className="space-y-2">
          {project.documents.map((doc) => (
            <div key={doc} className="flex items-center gap-2 text-sm text-navy-700">
              <FileText size={14} className="text-muted shrink-0" />
              <span>{doc}</span>
            </div>
          ))}
        </div>
        {project.githubRepo && (
          <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-3">
            <ExternalLink size={14} /> View Repository
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Answers Tab ────────────────────────────────────────
function AnswersPanel({ questions }: { questions: Question[] }) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-white border border-[#E5EAF1] rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-800 mb-2">{q.question}</p>
              <div className="flex items-center gap-2 mb-3">
                <EvidenceBadge status={q.evidenceStatus} />
                <span className={`text-xs font-medium ${q.status === 'answered' ? 'text-green-600' : q.status === 'unknown' ? 'text-red-600' : 'text-muted'}`}>
                  {q.status === 'answered' ? 'Answered' : q.status === 'unknown' ? "Don't Know" : q.status === 'skipped' ? 'Skipped' : 'Pending'}
                </span>
              </div>
              {q.answer && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-navy-700 leading-relaxed">{q.answer}</p>
                </div>
              )}
              {!q.answer && q.status === 'pending' && (
                <p className="text-sm text-muted italic">Awaiting response from departing member</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Evidence Tab (Statements) ──────────────────────────
function EvidencePanel({
  statements,
  onEdit,
  onReject,
}: {
  statements: Statement[];
  onEdit: (id: string, content: string) => void;
  onReject: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const categoryConfig: Record<string, { bg: string; text: string; label: string }> = {
    decision: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Decision' },
    ownership: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Ownership' },
    unfinished: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Unfinished' },
    risk: { bg: 'bg-red-50', text: 'text-red-700', label: 'Risk' },
    dependency: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Dependency' },
  };

  return (
    <div className="space-y-4">
      {statements.map((st) => {
        const cat = categoryConfig[st.category] || { bg: 'bg-gray-50', text: 'text-gray-700', label: st.category };
        const isEditing = editingId === st.id;

        return (
          <div key={st.id} className="bg-white border border-[#E5EAF1] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.text}`}>
                    {cat.label}
                  </span>
                  <EvidenceBadge status={st.evidenceStatus} />
                </div>
                <h4 className="text-sm font-semibold text-navy-800 mb-1">{st.title}</h4>

                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5EAF1] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          onEdit(st.id, editContent);
                          setEditingId(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors flex items-center gap-1"
                      >
                        <Check size={12} /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-navy-700 leading-relaxed">{st.content}</p>
                )}

                {st.evidenceQuote && (
                  <div className="mt-3 pl-3 border-l-2 border-brand-200">
                    <p className="text-xs text-brand-700 italic">&ldquo;{st.evidenceQuote}&rdquo;</p>
                    {st.sourceLabel && <p className="text-xs text-muted mt-0.5">— {st.sourceLabel}</p>}
                  </div>
                )}

                {st.departingAnswer && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted mb-1">Departing Member&apos;s Response</p>
                    <p className="text-sm text-navy-700">{st.departingAnswer}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!isEditing && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(st.id);
                      setEditContent(st.content);
                    }}
                    className="p-2 rounded-lg text-muted hover:text-navy-800 hover:bg-gray-100 transition-colors"
                    title="Edit statement"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onReject(st.id)}
                    className="p-2 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove statement"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Gaps Tab ───────────────────────────────────────────
function GapsPanel({
  gaps,
  onResolve,
  onFlag,
}: {
  gaps: Gap[];
  onResolve: (id: string, reason: string) => void;
  onFlag: (id: string) => void;
}) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  const riskColors: Record<string, { bg: string; text: string }> = {
    High: { bg: 'bg-red-50', text: 'text-red-700' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    Low: { bg: 'bg-green-50', text: 'text-green-700' },
  };

  return (
    <div className="space-y-4">
      {gaps.length === 0 && (
        <div className="bg-white border border-[#E5EAF1] rounded-xl p-8 text-center">
          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-navy-800">No gaps detected</p>
          <p className="text-xs text-muted mt-1">All knowledge areas are covered</p>
        </div>
      )}

      {gaps.map((gap) => {
        const rc = riskColors[gap.risk] || riskColors.Medium;
        const isResolving = resolvingId === gap.id;

        return (
          <div key={gap.id} className="bg-white border border-[#E5EAF1] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.text}`}>
                    {gap.risk} Risk
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    gap.status === 'resolved' ? 'bg-green-50 text-green-700' : gap.status === 'flagged' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {gap.status === 'resolved' ? 'Resolved' : gap.status === 'flagged' ? 'Flagged' : 'Open'}
                  </span>
                  <span className={`text-xs font-medium ${gap.category === 'conflicting' ? 'text-orange-600' : 'text-muted'}`}>
                    {gap.category === 'conflicting' ? 'Conflicting Sources' : 'Missing Info'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-navy-800 mb-1">{gap.title}</h4>
                <p className="text-sm text-navy-700 leading-relaxed">{gap.description}</p>

                {gap.sourcesInConflict && gap.sourcesInConflict.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted">Sources:</span>
                    {gap.sourcesInConflict.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {gap.resolutionReason && (
                  <div className="mt-3 bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-700 mb-0.5">Resolution</p>
                    <p className="text-xs text-green-700">{gap.resolutionReason}</p>
                  </div>
                )}

                {isResolving && (
                  <div className="mt-3">
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5EAF1] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500"
                      placeholder="Explain how this gap was resolved..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          if (resolution.trim()) {
                            onResolve(gap.id, resolution.trim());
                            setResolvingId(null);
                            setResolution('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <Check size={12} /> Resolve
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolution(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {gap.status === 'open' && !isResolving && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setResolvingId(gap.id)}
                    className="p-2 rounded-lg text-muted hover:text-green-600 hover:bg-green-50 transition-colors"
                    title="Resolve gap"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <button
                    onClick={() => onFlag(gap.id)}
                    className="p-2 rounded-lg text-muted hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="Flag for follow-up"
                  >
                    <Flag size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Screen ────────────────────────────────────────
export function Screen3TeamLeadReview() {
  const {
    project,
    editStatement,
    rejectStatement,
    resolveGap,
    flagGap,
    approveHandover,
  } = useHandover();

  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const canApprove = !project.isApproved && project.questions.some((q) => q.status === 'answered');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-800">{project.name}</h2>
          <p className="text-sm text-muted mt-0.5">Review answers, verify evidence, and resolve gaps before approving</p>
        </div>
        {project.isApproved ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
            <ShieldCheck size={16} />
            Approved
          </div>
        ) : (
          <button
            onClick={approveHandover}
            disabled={!canApprove}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <Shield size={16} />
            Approve Handover
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5EAF1] mb-6 flex gap-0">
        <TabButton active={activeTab === 'summary'} label="Summary" onClick={() => setActiveTab('summary')} />
        <TabButton active={activeTab === 'answers'} label="Answers" count={project.questions.length} onClick={() => setActiveTab('answers')} />
        <TabButton active={activeTab === 'evidence'} label="Evidence" count={project.statements.length} onClick={() => setActiveTab('evidence')} />
        <TabButton active={activeTab === 'gaps'} label="Gaps" count={project.gaps.filter(g => g.status === 'open').length} onClick={() => setActiveTab('gaps')} />
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && <SummaryPanel project={project} />}
      {activeTab === 'answers' && <AnswersPanel questions={project.questions} />}
      {activeTab === 'evidence' && <EvidencePanel statements={project.statements} onEdit={editStatement} onReject={rejectStatement} />}
      {activeTab === 'gaps' && <GapsPanel gaps={project.gaps} onResolve={resolveGap} onFlag={flagGap} />}
    </div>
  );
}
