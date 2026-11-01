'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { EvidenceStatus, EvidencePiece } from '@/types';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  BookOpen,
  Eye,
  X,
  Clock,
  GitBranch,
  MessageSquare,
  ClipboardList,
  FileCode,
  ArrowRight,
  ThumbsUp,
  Info,
} from 'lucide-react';

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

// ─── Evidence Icon ──────────────────────────────────────
function EvidenceTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'commit': return <GitBranch size={14} className="text-purple-600" />;
    case 'chat': return <MessageSquare size={14} className="text-blue-600" />;
    case 'doc': return <FileText size={14} className="text-green-600" />;
    case 'task': return <ClipboardList size={14} className="text-amber-600" />;
    case 'code': return <FileCode size={14} className="text-cyan-600" />;
    default: return <FileText size={14} className="text-muted" />;
  }
}

// ─── Evidence Modal ─────────────────────────────────────
function EvidenceModal({ evidence, onClose }: { evidence: EvidencePiece; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-[#E5EAF1] shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAF1]">
          <div className="flex items-center gap-2">
            <EvidenceTypeIcon type={evidence.type} />
            <h3 className="text-sm font-semibold text-navy-800">{evidence.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted hover:text-navy-800 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-muted mb-1">Source Reference</p>
            <p className="text-sm text-brand-600 break-all">{evidence.sourceRef}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-1">Quoted Content</p>
            <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-brand-300">
              <p className="text-sm text-navy-700 italic leading-relaxed">&ldquo;{evidence.quote}&rdquo;</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>By {evidence.author}</span>
            <span>{evidence.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ────────────────────────────────────────
export function Screen4IncomingHandover() {
  const { project, acknowledgeReceipt } = useHandover();
  const [selectedEvidence, setSelectedEvidence] = useState<EvidencePiece | null>(null);

  const isApproved = project.isApproved;
  const isAcknowledged = project.receipt.acknowledged;

  // Organize statements by category
  const categoryLabels: Record<string, string> = {
    decision: 'Decisions',
    ownership: 'Ownership & Access',
    unfinished: 'Unfinished Work',
    risk: 'Risks & Vulnerabilities',
    dependency: 'Dependencies',
  };

  const groupedStatements = project.statements.reduce((acc, st) => {
    if (!acc[st.category]) acc[st.category] = [];
    acc[st.category].push(st);
    return acc;
  }, {} as Record<string, typeof project.statements>);

  if (!isApproved) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card p-8 text-center">
          <Clock size={40} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-navy-800 mb-2">Handover Pending Approval</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            The Team Lead has not yet approved this handover. You&apos;ll be able to review the full knowledge document once it&apos;s approved.
          </p>
          <div className="mt-6 bg-gray-50 rounded-lg p-4 inline-block">
            <p className="text-sm text-navy-700"><span className="font-medium">{project.name}</span></p>
            <p className="text-xs text-muted mt-1">From {project.departingMember} → To {project.incomingMember}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold text-navy-800">{project.name}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <ShieldCheck size={12} /> Approved
            </span>
          </div>
          <p className="text-sm text-muted">
            Knowledge handover from <span className="font-medium text-navy-700">{project.departingMember}</span> ({project.departingRole})
          </p>
        </div>
        {isAcknowledged ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
            <ThumbsUp size={16} />
            Acknowledged
          </div>
        ) : (
          <button
            onClick={acknowledgeReceipt}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors"
          >
            <ThumbsUp size={16} />
            Acknowledge Receipt
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={16} className="text-brand-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-brand-800">Review this handover carefully</p>
          <p className="text-xs text-brand-700 mt-0.5">
            Pay special attention to unverified evidence and open gaps. Acknowledging receipt confirms you&apos;ve reviewed the material, not that all gaps are resolved.
          </p>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-navy-800 mb-3">Project Overview</h3>
        <p className="text-sm text-navy-700 leading-relaxed mb-3">{project.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted">Tech Stack</p>
            <p className="text-sm font-medium text-navy-800 mt-0.5">{project.techStack}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Departing</p>
            <p className="text-sm font-medium text-navy-800 mt-0.5">{project.departingMember}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Role</p>
            <p className="text-sm font-medium text-navy-800 mt-0.5">{project.departingRole}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Documents</p>
            <p className="text-sm font-medium text-navy-800 mt-0.5">{project.documents.length} files</p>
          </div>
        </div>
      </div>

      {/* Knowledge Sections */}
      {Object.entries(groupedStatements).map(([category, statements]) => (
        <div key={category} className="bg-white border border-[#E5EAF1] rounded-xl shadow-card mb-5">
          <div className="px-5 py-4 border-b border-[#E5EAF1]">
            <h3 className="text-sm font-semibold text-navy-800">
              {categoryLabels[category] || category}
            </h3>
          </div>
          <div className="divide-y divide-[#E5EAF1]">
            {statements.map((st) => (
              <div key={st.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-sm font-medium text-navy-800">{st.title}</h4>
                      <EvidenceBadge status={st.evidenceStatus} />
                    </div>
                    <p className="text-sm text-navy-700 leading-relaxed">{st.content}</p>

                    {st.evidenceQuote && (
                      <div className="mt-2 pl-3 border-l-2 border-brand-200">
                        <p className="text-xs text-brand-700 italic">&ldquo;{st.evidenceQuote}&rdquo;</p>
                        {st.sourceLabel && (
                          <p className="text-xs text-muted mt-0.5">— {st.sourceLabel}</p>
                        )}
                      </div>
                    )}

                    {st.departingAnswer && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted mb-0.5">Departing Member</p>
                        <p className="text-sm text-navy-700">{st.departingAnswer}</p>
                      </div>
                    )}
                  </div>

                  {st.evidenceId && (
                    <button
                      onClick={() => {
                        const ev = project.evidencePieces.find((e) => e.id === st.evidenceId);
                        if (ev) setSelectedEvidence(ev);
                      }}
                      className="p-2 rounded-lg text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors shrink-0"
                      title="View evidence"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Gaps Section */}
      {project.gaps.length > 0 && (
        <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card mb-5">
          <div className="px-5 py-4 border-b border-[#E5EAF1]">
            <h3 className="text-sm font-semibold text-navy-800">
              Knowledge Gaps ({project.gaps.filter(g => g.status === 'open').length} open)
            </h3>
          </div>
          <div className="divide-y divide-[#E5EAF1]">
            {project.gaps.map((gap) => (
              <div key={gap.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    gap.risk === 'High' ? 'bg-red-50 text-red-700' : gap.risk === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {gap.risk} Risk
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    gap.status === 'resolved' ? 'bg-green-50 text-green-700' : gap.status === 'flagged' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {gap.status === 'resolved' ? 'Resolved' : gap.status === 'flagged' ? 'Flagged' : 'Open'}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-navy-800 mb-1">{gap.title}</h4>
                <p className="text-sm text-navy-700 leading-relaxed">{gap.description}</p>
                {gap.resolutionReason && (
                  <div className="mt-2 bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-700">Resolution: {gap.resolutionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Source Library */}
      <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card mb-5">
        <div className="px-5 py-4 border-b border-[#E5EAF1]">
          <h3 className="text-sm font-semibold text-navy-800">Source Evidence Library</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#E5EAF1]">
          {project.evidencePieces.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvidence(ev)}
              className="flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <EvidenceTypeIcon type={ev.type} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy-800 line-clamp-1">{ev.title}</p>
                <p className="text-xs text-muted mt-0.5">{ev.author} · {ev.timestamp.split(' ').slice(0, 2).join(' ')}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Acknowledgement */}
      {isAcknowledged && project.receipt.acknowledgedAt && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <CheckCircle2 size={28} className="text-green-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-800">Handover Acknowledged</p>
          <p className="text-xs text-green-700 mt-1">
            Acknowledged by {project.receipt.acknowledgedBy} on{' '}
            {new Date(project.receipt.acknowledgedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Evidence Modal */}
      {selectedEvidence && (
        <EvidenceModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      )}
    </div>
  );
}
