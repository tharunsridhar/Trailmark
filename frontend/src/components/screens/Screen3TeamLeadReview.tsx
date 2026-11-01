'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Statement, Gap, Question, EvidenceStatus } from '@/types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
  Flag,
  Edit3,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
} from 'lucide-react';

type Tab = 'summary' | 'answers' | 'evidence' | 'gaps';

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
        active
          ? 'bg-[#5A5B4C] text-white shadow-soft'
          : 'text-[#7A7B72] hover:text-[#1F201B] hover:bg-[#EAEAE2]'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-[#EAEAE2] text-[#5A5B4C]'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  const config = {
    verified: { icon: <ShieldCheck size={12} />, bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Verified' },
    unverified: { icon: <ShieldQuestion size={12} />, bg: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Unverified' },
    missing_conflicting: { icon: <ShieldAlert size={12} />, bg: 'bg-red-50 border-red-200 text-red-800', label: 'Missing / Conflicting' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
}

export function Screen3TeamLeadReview() {
  const { project, editStatement, rejectStatement, resolveGap, flagGap, approveHandover, setActiveScreen } = useHandover();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const canApprove = !project.isApproved && project.questions.some((q) => q.status === 'answered');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header matching reference aesthetic */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#1F201B]">{project.name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAEAE2] text-[#5A5B4C]">
              Review & Verification
            </span>
          </div>
          <p className="text-xs text-[#7A7B72] mt-0.5">
            Cross-examine answers submitted by {project.departingMember} against source commits, PRs, and ADRs.
          </p>
        </div>

        <div>
          {project.isApproved ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <ShieldCheck size={15} />
              Handover Approved & Published
            </div>
          ) : (
            <button
              onClick={approveHandover}
              disabled={!canApprove}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] disabled:opacity-40 text-white text-xs font-semibold shadow-soft transition-all"
            >
              <Shield size={14} />
              Approve Handover
            </button>
          )}
        </div>
      </div>

      {/* Tabs as rounded pills */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-[#E6E6DE] w-fit shadow-2xs">
        <TabButton active={activeTab === 'summary'} label="Overview" onClick={() => setActiveTab('summary')} />
        <TabButton active={activeTab === 'answers'} label="AI Answers" count={project.questions.length} onClick={() => setActiveTab('answers')} />
        <TabButton active={activeTab === 'evidence'} label="Extracted Statements" count={project.statements.length} onClick={() => setActiveTab('evidence')} />
        <TabButton active={activeTab === 'gaps'} label="Knowledge Gaps" count={project.gaps.filter(g => g.status === 'open').length} onClick={() => setActiveTab('gaps')} />
      </div>

      {/* Tab 1: Summary */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-3xl p-7 border border-[#E6E6DE] shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-[#1F201B]">Handover Scope & Objectives</h3>
            <p className="text-xs text-[#3A3B34] leading-relaxed">{project.description}</p>
            <div className="pt-2">
              <h4 className="text-xs font-bold text-[#1F201B] mb-1">Key Objectives:</h4>
              <p className="text-xs text-[#7A7B72] leading-relaxed">{project.objectives}</p>
            </div>
            <div className="pt-2">
              <h4 className="text-xs font-bold text-[#1F201B] mb-2">Sources Checked:</h4>
              <div className="flex flex-wrap gap-2">
                {project.documents.map((doc) => (
                  <span key={doc} className="px-2.5 py-1 rounded-lg bg-[#F4F4F0] border border-[#E6E6DE] text-[11px] font-medium text-[#3A3B34] flex items-center gap-1">
                    <FileText size={12} className="text-[#5A5B4C]" />
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-[#1F201B]">Transition Summary</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-[#E6E6DE]">
                <span className="text-[#7A7B72]">Departing:</span>
                <span className="font-semibold text-[#1F201B]">{project.departingMember}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#E6E6DE]">
                <span className="text-[#7A7B72]">Role:</span>
                <span className="font-semibold text-[#1F201B]">{project.departingRole}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#E6E6DE]">
                <span className="text-[#7A7B72]">Successor:</span>
                <span className="font-semibold text-[#1F201B]">{project.incomingMember}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-[#E6E6DE]">
                <span className="text-[#7A7B72]">Evidence Items:</span>
                <span className="font-semibold text-[#5A5B4C]">{project.statements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7B72]">Status:</span>
                <span className="font-bold text-[#5A5B4C]">{project.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Answers */}
      {activeTab === 'answers' && (
        <div className="bg-white rounded-3xl p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-[#1F201B]">Answers Submitted by {project.departingMember}</h3>
          <div className="divide-y divide-[#E6E6DE]">
            {project.questions.map((q, idx) => (
              <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F4F0] text-[#5A5B4C]">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[#1F201B]">{q.shortTitle || q.question}</span>
                  </div>
                  <EvidenceBadge status={q.evidenceStatus} />
                </div>
                <p className="text-xs text-[#3A3B34] bg-[#F4F4F0] p-3 rounded-xl border border-[#E6E6DE]">
                  {q.answer || <span className="italic text-[#A2A399]">No answer recorded.</span>}
                </p>
                {q.followUp && q.followUp.answer && (
                  <p className="text-xs text-[#5A5B4C] pl-3 border-l-2 border-[#5A5B4C]">
                    <strong>Follow-up detail:</strong> {q.followUp.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Extracted Statements */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-3xl p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-[#1F201B]">Extracted Statements & Grounded Evidence</h3>
          <div className="space-y-3">
            {project.statements.map((st) => (
              <div key={st.id} className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1F201B]">{st.title}</span>
                  <EvidenceBadge status={st.evidenceStatus} />
                </div>
                <p className="text-xs text-[#3A3B34]">{st.content}</p>
                {st.evidenceQuote && (
                  <div className="text-[11px] text-[#7A7B72] italic pl-2.5 border-l-2 border-[#5A5B4C]">
                    &ldquo;{st.evidenceQuote}&rdquo; {st.sourceLabel && `— ${st.sourceLabel}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Gaps */}
      {activeTab === 'gaps' && (
        <div className="bg-white rounded-3xl p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-[#1F201B]">Knowledge Gaps & Open Unknowns</h3>
          <div className="space-y-3">
            {project.gaps.map((gap) => (
              <div key={gap.id} className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      {gap.risk} Risk
                    </span>
                    <span className="text-xs font-bold text-[#1F201B]">{gap.title}</span>
                  </div>
                  <p className="text-xs text-[#7A7B72]">{gap.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {gap.status === 'open' && (
                    <button
                      onClick={() => resolveGap(gap.id, 'Reviewed and verified in architecture sync.')}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#E6E6DE] text-xs font-semibold text-[#5A5B4C] hover:bg-[#EAEAE2]"
                    >
                      Resolve Gap
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
