'use client';

import React, { useState, useEffect } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { ApiStatement, StatementVersion, PieceOut } from '@/services/api';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Clock,
  Edit3,
  X,
  Check,
  History,
  GitBranch,
  Split,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function StatementBadge({ label }: { label: ApiStatement['label'] }) {
  switch (label) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck size={11} /> Verified
        </span>
      );
    case 'unverified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <ShieldQuestion size={11} /> Unverified
        </span>
      );
    case 'conflicting':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
          <ShieldAlert size={11} /> Conflict
        </span>
      );
    case 'missing':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
          <AlertTriangle size={11} /> Missing Gap
        </span>
      );
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: ApiStatement['status'] }) {
  switch (status) {
    case 'approved':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">Approved</span>;
    case 'rejected':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">Rejected</span>;
    case 'accepted_gap':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">Accepted Gap</span>;
    case 'answered':
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">Answered</span>;
    default:
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAEAE2] text-[#5A5B4C] uppercase">Draft</span>;
  }
}

export function Screen3TeamLeadReview() {
  const {
    activeHandoverId,
    activeHandover,
    statements,
    statementsLoading,
    loadStatements,
    editStatementApi,
    rejectStatementApi,
    resolveStatementApi,
    acceptGapApi,
    getVersionsApi,
    approveHandoverApi,
    getPiece,
    errorMessage,
    successMessage,
    clearMessages,
    setActiveScreen,
  } = useHandover();

  // Tab filter
  const [filterTab, setFilterTab] = useState<'all' | 'conflicts' | 'missing' | 'answers' | 'verified'>('all');

  // Modals state
  const [editingStatement, setEditingStatement] = useState<ApiStatement | null>(null);
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');

  const [rejectingStatement, setRejectingStatement] = useState<ApiStatement | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [resolvingStatement, setResolvingStatement] = useState<ApiStatement | null>(null);
  const [chosenPieceId, setChosenPieceId] = useState<number | null>(null);
  const [resolveReason, setResolveReason] = useState('');
  const [resolveUpdatedText, setResolveUpdatedText] = useState('');

  const [acceptingGap, setAcceptingGap] = useState<ApiStatement | null>(null);
  const [acceptGapReason, setAcceptGapReason] = useState('');

  const [versionsStatement, setVersionsStatement] = useState<ApiStatement | null>(null);
  const [versionsList, setVersionsList] = useState<StatementVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [inspectPiece, setInspectPiece] = useState<PieceOut | null>(null);
  const [inspectPieceLoading, setInspectPieceLoading] = useState(false);

  // Handover Approval state
  const [isApproving, setIsApproving] = useState(false);

  const isApproved = activeHandover?.status === 'approved';
  const openConflictsCount = statements.filter((s) => s.label === 'conflicting' && s.status === 'draft').length;

  const filteredStatements = statements.filter((st) => {
    if (filterTab === 'conflicts') return st.label === 'conflicting';
    if (filterTab === 'missing') return st.label === 'missing';
    if (filterTab === 'answers') return st.kind === 'answer';
    if (filterTab === 'verified') return st.label === 'verified';
    return true;
  });

  // Handlers
  const openEditModal = (st: ApiStatement) => {
    setEditingStatement(st);
    setEditText(st.text);
    setEditReason('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatement || !editText.trim()) return;
    const ok = await editStatementApi(editingStatement.id, editText.trim(), editReason.trim() || undefined);
    if (ok) setEditingStatement(null);
  };

  const openRejectModal = (st: ApiStatement) => {
    setRejectingStatement(st);
    setRejectReason('');
  };

  const handleSaveReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingStatement || !rejectReason.trim()) return;
    const ok = await rejectStatementApi(rejectingStatement.id, rejectReason.trim());
    if (ok) setRejectingStatement(null);
  };

  const openResolveModal = (st: ApiStatement) => {
    setResolvingStatement(st);
    setChosenPieceId(st.sources[0]?.piece_id || null);
    setResolveReason('');
    setResolveUpdatedText(st.text);
  };

  const handleSaveResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingStatement || chosenPieceId === null || !resolveReason.trim()) return;
    const ok = await resolveStatementApi(
      resolvingStatement.id,
      chosenPieceId,
      resolveReason.trim(),
      resolveUpdatedText.trim() !== resolvingStatement.text ? resolveUpdatedText.trim() : undefined
    );
    if (ok) setResolvingStatement(null);
  };

  const openAcceptGapModal = (st: ApiStatement) => {
    setAcceptingGap(st);
    setAcceptGapReason('');
  };

  const handleSaveAcceptGap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingGap || !acceptGapReason.trim()) return;
    const ok = await acceptGapApi(acceptingGap.id, acceptGapReason.trim());
    if (ok) setAcceptingGap(null);
  };

  const openVersionsModal = async (st: ApiStatement) => {
    setVersionsStatement(st);
    setVersionsLoading(true);
    const vers = await getVersionsApi(st.id);
    setVersionsList(vers);
    setVersionsLoading(false);
  };

  const openPieceInspection = async (pieceId: number) => {
    setInspectPieceLoading(true);
    const piece = await getPiece(pieceId);
    setInspectPiece(piece);
    setInspectPieceLoading(false);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await approveHandoverApi();
    setIsApproving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Notifications */}
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-[#1F201B]">
              {activeHandover?.project_name || 'Campus Events App'} Handover Review
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAEAE2] text-[#5A5B4C]">
              Lead Verification
            </span>
            {activeHandoverId && (
              <span className="text-xs text-[#7A7B72]">Handover #{activeHandoverId}</span>
            )}
          </div>
          <p className="text-xs text-[#7A7B72] mt-0.5">
            Cross-examine AI statements, resolve contradictory sources with required written rationale, accept gaps, and sign off.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isApproved ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <ShieldCheck size={15} />
              <span>Approved &amp; Published</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || openConflictsCount > 0}
              title={openConflictsCount > 0 ? 'Resolve all open conflicts before approving' : 'Approve handover'}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] disabled:opacity-40 text-white text-xs font-semibold shadow-soft transition-all"
            >
              {isApproving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <Shield size={14} />
                  <span>Approve Handover</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={loadStatements}
            className="p-2 rounded-full bg-white border border-[#E6E6DE] text-[#7A7B72] hover:text-[#1F201B] hover:bg-[#EAEAE2] transition-colors"
            title="Refresh statements"
            aria-label="Refresh statements"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Conflict Warning Banner if open conflicts exist */}
      {openConflictsCount > 0 && !isApproved && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 shadow-2xs">
          <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold">
              Action Required: {openConflictsCount} unresolved source conflict{openConflictsCount > 1 ? 's' : ''} detected.
            </strong>
            <p className="text-[#3A3B34] leading-relaxed">
              Before approving this handover, Team Lead Deepak must review conflicting evidence (e.g. Render vs Heroku, token expiry duration) and select the authoritative source with a written explanation, or reject the statement.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs Strip */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-[#E6E6DE] w-fit shadow-2xs flex-wrap">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
            filterTab === 'all' ? 'bg-[#5A5B4C] text-white shadow-soft' : 'text-[#7A7B72] hover:text-[#1F201B]'
          }`}
        >
          All Statements ({statements.length})
        </button>

        <button
          onClick={() => setFilterTab('conflicts')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
            filterTab === 'conflicts'
              ? 'bg-rose-700 text-white shadow-soft'
              : 'text-rose-800 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert size={12} />
          <span>Conflicts ({statements.filter((s) => s.label === 'conflicting').length})</span>
        </button>

        <button
          onClick={() => setFilterTab('missing')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
            filterTab === 'missing'
              ? 'bg-purple-700 text-white shadow-soft'
              : 'text-purple-800 hover:bg-purple-50'
          }`}
        >
          <AlertTriangle size={12} />
          <span>Knowledge Gaps ({statements.filter((s) => s.label === 'missing').length})</span>
        </button>

        <button
          onClick={() => setFilterTab('answers')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
            filterTab === 'answers'
              ? 'bg-blue-700 text-white shadow-soft'
              : 'text-blue-800 hover:bg-blue-50'
          }`}
        >
          <MessageSquare size={12} />
          <span>Asha&apos;s Answers ({statements.filter((s) => s.kind === 'answer').length})</span>
        </button>

        <button
          onClick={() => setFilterTab('verified')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
            filterTab === 'verified'
              ? 'bg-emerald-700 text-white shadow-soft'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <ShieldCheck size={12} />
          <span>Verified ({statements.filter((s) => s.label === 'verified').length})</span>
        </button>
      </div>

      {/* Statements List */}
      <div className="space-y-4">
        {filteredStatements.length > 0 ? (
          filteredStatements.map((st) => (
            <div
              key={st.id}
              className={`bg-white rounded-3xl p-6 border shadow-soft space-y-4 transition-all ${
                st.label === 'conflicting'
                  ? 'border-rose-300 ring-1 ring-rose-200'
                  : st.label === 'missing'
                  ? 'border-purple-200'
                  : 'border-[#E6E6DE]'
              }`}
            >
              {/* Header: Kind, Badges, Status, Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F4F0] text-[#5A5B4C] uppercase tracking-wider">
                    {st.kind}
                  </span>
                  <StatementBadge label={st.label} />
                  <StatusBadge status={st.status} />
                  <span className="text-[11px] text-[#A2A399]">Statement #{st.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openVersionsModal(st)}
                    className="px-2.5 py-1 rounded-full border border-[#E6E6DE] text-[11px] font-semibold text-[#7A7B72] hover:text-[#1F201B] hover:bg-[#F4F4F0] flex items-center gap-1 transition-colors"
                  >
                    <History size={11} />
                    <span>v{st.current_version}</span>
                  </button>

                  {!isApproved && st.status !== 'rejected' && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(st)}
                        className="px-2.5 py-1 rounded-full border border-[#E6E6DE] text-[11px] font-semibold text-[#3A3B34] hover:bg-[#F4F4F0] flex items-center gap-1 transition-colors"
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openRejectModal(st)}
                        className="px-2.5 py-1 rounded-full border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Statement Content */}
              <p className="text-sm font-medium text-[#1F201B] leading-relaxed">{st.text}</p>

              {/* Conflict Resolution Box (if conflicting) */}
              {st.label === 'conflicting' && (
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Split size={14} /> Contradictory Evidence Identified
                    </span>
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => openResolveModal(st)}
                        className="px-3 py-1 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        Resolve Conflict
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {st.sources.map((src, i) => (
                      <div
                        key={src.piece_id}
                        className={`p-3 rounded-xl border bg-white space-y-1.5 ${
                          src.chosen === true
                            ? 'border-emerald-500 ring-1 ring-emerald-400'
                            : src.chosen === false
                            ? 'border-[#E6E6DE] opacity-60'
                            : 'border-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1F201B]">
                            Source {i + 1}: {src.source_name}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPieceInspection(src.piece_id)}
                            className="text-[10px] text-[#5A5B4C] hover:underline flex items-center gap-0.5"
                          >
                            Inspect Piece #{src.piece_id}
                            <ExternalLink size={9} />
                          </button>
                        </div>
                        <p className="text-[11px] text-[#7A7B72] font-mono">{src.locator}</p>
                        <p className="text-xs text-[#3A3B34] italic pl-2 border-l-2 border-rose-400">
                          &ldquo;{src.quote}&rdquo;
                        </p>
                        {src.chosen === true && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 pt-0.5">
                            <Check size={11} /> Authoritative Source Chosen by Lead
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Gap Resolution Box (if missing) */}
              {st.label === 'missing' && st.status === 'draft' && !isApproved && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3 text-xs">
                  <div className="text-purple-900">
                    <strong className="font-semibold">Open Technical Unknown: </strong>
                    <span>No documentation or commit found. Decide whether to accept as a known gap for Kiran.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAcceptGapModal(st)}
                    className="px-3 py-1.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shrink-0 shadow-2xs transition-colors"
                  >
                    Accept as Known Gap
                  </button>
                </div>
              )}

              {/* Standard Sources (Non-conflicting) */}
              {st.label !== 'conflicting' && st.sources.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A7B72]">
                    Grounded Evidence Sources:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {st.sources.map((src) => (
                      <button
                        key={src.piece_id}
                        type="button"
                        onClick={() => openPieceInspection(src.piece_id)}
                        className="px-3 py-1.5 rounded-xl bg-[#F4F4F0] hover:bg-[#EAEAE2] border border-[#E6E6DE] text-left text-xs text-[#3A3B34] transition-colors flex items-center gap-2 group"
                      >
                        <FileText size={12} className="text-[#5A5B4C] shrink-0" />
                        <div>
                          <span className="font-semibold text-[#1F201B]">{src.source_name}</span>
                          <span className="text-[#7A7B72] text-[11px] ml-1.5 font-mono">({src.locator})</span>
                        </div>
                        <ExternalLink size={10} className="text-[#7A7B72] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E6DE] text-[#7A7B72] text-xs shadow-soft">
            No statements matching this filter.
          </div>
        )}
      </div>

      {/* ── MODAL: Conflict Resolution ──────────────────────────────────────── */}
      {resolvingStatement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Split size={18} className="text-rose-600" />
                <h3 className="text-base font-bold text-[#1F201B]">Resolve Conflicting Sources</h3>
              </div>
              <button aria-label="Close" onClick={() => setResolvingStatement(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveResolve} className="space-y-4">
              <p className="text-xs text-[#7A7B72]">
                Select the authoritative source piece to resolve this discrepancy. A written reason is mandatory for the audit log.
              </p>

              {/* Radio selection of sources */}
              <div className="space-y-2.5">
                {resolvingStatement.sources.map((src) => (
                  <label
                    key={src.piece_id}
                    className={`block p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      chosenPieceId === src.piece_id
                        ? 'border-[#5A5B4C] bg-[#F4F4F0] ring-1 ring-[#5A5B4C]'
                        : 'border-[#E6E6DE] bg-white hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="chosen_piece"
                        value={src.piece_id}
                        checked={chosenPieceId === src.piece_id}
                        onChange={() => setChosenPieceId(src.piece_id)}
                        className="mt-1 text-[#5A5B4C] focus:ring-[#5A5B4C]"
                      />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-[#1F201B] flex items-center gap-2">
                          <span>{src.source_name}</span>
                          <span className="text-[#7A7B72] font-mono text-[11px]">({src.locator})</span>
                        </div>
                        <p className="text-xs text-[#3A3B34] italic">&ldquo;{src.quote}&rdquo;</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Written reason required */}
              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">
                  Resolution Rationale <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="e.g. Chat discussion on Aug 18 supercedes the earlier design doc; team finalized Render."
                  required
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] resize-none"
                />
              </div>

              {/* Optional updated statement text */}
              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">
                  Updated Statement Text <span className="text-[#7A7B72] font-normal">(Optional wording update)</span>
                </label>
                <input
                  type="text"
                  value={resolveUpdatedText}
                  onChange={(e) => setResolveUpdatedText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResolvingStatement(null)}
                  className="px-4 py-2 rounded-full border border-[#E6E6DE] text-xs text-[#7A7B72] hover:bg-[#EAEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!chosenPieceId || !resolveReason.trim()}
                  className="px-5 py-2 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] disabled:opacity-40 text-white text-xs font-semibold shadow-soft"
                >
                  Resolve &amp; Mark Verified
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Statement ──────────────────────────────────────────── */}
      {editingStatement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F201B]">Edit Statement #{editingStatement.id}</h3>
              <button aria-label="Close" onClick={() => setEditingStatement(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">Statement Text</label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">
                  Reason for Revision <span className="text-[#7A7B72] font-normal">(Optional audit note)</span>
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Clarified with Asha during architecture sync"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStatement(null)}
                  className="px-4 py-2 rounded-full border border-[#E6E6DE] text-xs text-[#7A7B72] hover:bg-[#EAEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft"
                >
                  Save Revision (v{editingStatement.current_version + 1})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Reject Statement ────────────────────────────────────────── */}
      {rejectingStatement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-red-900">Reject Statement #{rejectingStatement.id}</h3>
              <button aria-label="Close" onClick={() => setRejectingStatement(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReject} className="space-y-4">
              <p className="text-xs text-[#7A7B72]">
                Rejected statements are excluded from the final handover view and will not be shared with successor Kiran.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Unsupported by sources, abandoned in sprint 8."
                  required
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectingStatement(null)}
                  className="px-4 py-2 rounded-full border border-[#E6E6DE] text-xs text-[#7A7B72] hover:bg-[#EAEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectReason.trim()}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold shadow-soft"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Accept Knowledge Gap ────────────────────────────────────── */}
      {acceptingGap && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-purple-900">Accept Knowledge Gap</h3>
              <button aria-label="Close" onClick={() => setAcceptingGap(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAcceptGap} className="space-y-4">
              <p className="text-xs text-[#7A7B72]">
                Marking this as an accepted gap acknowledges it as a known technical unknown. It will be clearly presented to Kiran in the approved handover.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1">
                  Reason / Next Steps for Successor <span className="text-purple-600">*</span>
                </label>
                <textarea
                  value={acceptGapReason}
                  onChange={(e) => setAcceptGapReason(e.target.value)}
                  placeholder="e.g. Nobody knows AWS credentials yet; Kiran will provision a new bucket during sprint 1."
                  required
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAcceptingGap(null)}
                  className="px-4 py-2 rounded-full border border-[#E6E6DE] text-xs text-[#7A7B72] hover:bg-[#EAEAE2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!acceptGapReason.trim()}
                  className="px-5 py-2 rounded-full bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white text-xs font-semibold shadow-soft"
                >
                  Accept Known Gap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Version History ──────────────────────────────────────────── */}
      {versionsStatement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-[#5A5B4C]" />
                <h3 className="text-base font-bold text-[#1F201B]">
                  Version Audit: Statement #{versionsStatement.id}
                </h3>
              </div>
              <button aria-label="Close" onClick={() => setVersionsStatement(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
                <X size={16} />
              </button>
            </div>

            {versionsLoading ? (
              <div className="py-8 text-center text-xs text-[#7A7B72]">
                <Loader2 size={18} className="animate-spin mx-auto mb-2 text-[#5A5B4C]" />
                Loading audit history...
              </div>
            ) : versionsList.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {versionsList.map((v) => (
                  <div key={v.version} className="p-3.5 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F201B]">
                        Version {v.version} ({v.action})
                      </span>
                      <span className="text-[10px] text-[#7A7B72]">
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#3A3B34]">{v.text}</p>
                    {v.editor && (
                      <p className="text-[11px] text-[#7A7B72]">
                        Editor: <strong className="text-[#1F201B]">{v.editor}</strong>
                        {v.reason && ` — Reason: "${v.reason}"`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#7A7B72]">No versions recorded yet.</div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setVersionsStatement(null)}
                className="px-4 py-2 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold hover:bg-[#4A4B3E]"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Evidence Piece Inspection ───────────────────────────────── */}
      {inspectPiece && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E6E6DE] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#5A5B4C]" />
                <h3 className="text-sm font-bold text-[#1F201B]">{inspectPiece.source_name}</h3>
              </div>
              <button aria-label="Close" onClick={() => setInspectPiece(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-[#7A7B72] font-mono bg-[#F4F4F0] px-3 py-1.5 rounded-lg w-fit">
              Locator: {inspectPiece.locator} (Piece #{inspectPiece.id})
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F8F4] border border-[#E6E6DE] text-xs text-[#1F201B] font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {inspectPiece.content}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInspectPiece(null)}
                className="px-4 py-2 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold hover:bg-[#4A4B3E]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
