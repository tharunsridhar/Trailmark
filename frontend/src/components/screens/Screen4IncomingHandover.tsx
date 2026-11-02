'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { EvidenceStatus, EvidencePiece } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  Eye,
  X,
  Clock,
  GitBranch,
  MessageSquare,
  ClipboardList,
  FileCode,
  ThumbsUp,
  Info,
} from 'lucide-react';

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

function EvidenceTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'commit': return <GitBranch size={13} className="text-[#5A5B4C]" />;
    case 'chat': return <MessageSquare size={13} className="text-[#5A5B4C]" />;
    case 'doc': return <FileText size={13} className="text-[#5A5B4C]" />;
    case 'task': return <ClipboardList size={13} className="text-[#5A5B4C]" />;
    case 'code': return <FileCode size={13} className="text-[#5A5B4C]" />;
    default: return <FileText size={13} className="text-[#7A7B72]" />;
  }
}

export function Screen4IncomingHandover() {
  const { project, acknowledgeReceipt } = useHandover();
  const [selectedEvidence, setSelectedEvidence] = useState<EvidencePiece | null>(null);

  const isApproved = project.isApproved;
  const isAcknowledged = project.receipt.acknowledged;

  const categoryLabels: Record<string, string> = {
    decision: 'Architectural Decisions',
    ownership: 'Code Ownership & Access',
    unfinished: 'Unfinished Deliverables',
    risk: 'Risks & Vulnerabilities',
    dependency: 'System Dependencies',
  };

  const groupedStatements = project.statements.reduce((acc, st) => {
    if (!acc[st.category]) acc[st.category] = [];
    acc[st.category].push(st);
    return acc;
  }, {} as Record<string, typeof project.statements>);

  if (!isApproved) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-3xl border border-[#E6E6DE] p-10 text-center shadow-soft">
          <Clock size={36} className="text-[#5A5B4C] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#1F201B] mb-2">Handover In Progress</h2>
          <p className="text-xs text-[#7A7B72] max-w-md mx-auto leading-relaxed">
            Team Lead Deepak has not yet approved the handover package. Once approved, the verified architecture records and remaining gaps will be unlocked here for your inspection.
          </p>
          <div className="mt-6 p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs max-w-sm mx-auto">
            <p className="font-bold text-[#1F201B]">{project.name}</p>
            <p className="text-[#7A7B72] mt-0.5">Successor: {project.incomingMember}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#1F201B]">{project.name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Approved Handover
            </span>
          </div>
          <p className="text-xs text-[#7A7B72] mt-0.5">
            Successor knowledge base for <strong className="text-[#1F201B]">{project.incomingMember}</strong> from {project.departingMember} ({project.departingRole}).
          </p>
        </div>

        <div>
          {isAcknowledged ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <CheckCircle2 size={15} />
              Handover Acknowledged
            </div>
          ) : (
            <button
              onClick={acknowledgeReceipt}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft transition-all"
            >
              <ThumbsUp size={14} />
              Acknowledge Receipt
            </button>
          )}
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] flex items-start gap-3 shadow-soft">
        <Info size={16} className="text-[#5A5B4C] shrink-0 mt-0.5" />
        <div className="text-xs text-[#3A3B34] leading-relaxed">
          <strong className="text-[#1F201B]">Review Notice: </strong>
          Pay special attention to statements marked <span className="font-semibold text-amber-800">Unverified</span> and open knowledge gaps. Acknowledging receipt confirms review of the project state, not that all technical issues have been resolved.
        </div>
      </div>

      {/* Categorized Knowledge Cards */}
      <div className="space-y-5">
        {Object.entries(groupedStatements).map(([category, statements]) => (
          <div key={category} className="bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-soft space-y-4">
            <h3 className="text-sm font-bold text-[#1F201B]">
              {categoryLabels[category] || category}
            </h3>

            <div className="divide-y divide-[#E6E6DE]">
              {statements.map((st) => (
                <div key={st.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F201B]">{st.title}</span>
                    <EvidenceBadge status={st.evidenceStatus} />
                  </div>
                  <p className="text-xs text-[#3A3B34] leading-relaxed">{st.content}</p>
                  {st.evidenceQuote && (
                    <p className="text-[11px] text-[#7A7B72] italic pl-2.5 border-l-2 border-[#5A5B4C]">
                      &ldquo;{st.evidenceQuote}&rdquo; {st.sourceLabel && `— ${st.sourceLabel}`}
                    </p>
                  )}
                  {st.departingAnswer && (
                    <div className="p-2.5 rounded-xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs text-[#3A3B34]">
                      <span className="font-semibold text-[#1F201B]">Departing Note: </span>
                      {st.departingAnswer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Open Gaps */}
      {project.gaps.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-[#1F201B]">
            Outstanding Knowledge Gaps ({project.gaps.filter(g => g.status === 'open').length} open)
          </h3>
          <div className="space-y-3">
            {project.gaps.map((gap) => (
              <div key={gap.id} className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      {gap.risk} Risk
                    </span>
                    <span className="text-xs font-bold text-[#1F201B]">{gap.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#7A7B72]">{gap.status}</span>
                </div>
                <p className="text-xs text-[#7A7B72]">{gap.description}</p>
                {gap.resolutionReason && (
                  <p className="text-xs text-emerald-800 font-medium">Resolution: {gap.resolutionReason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
