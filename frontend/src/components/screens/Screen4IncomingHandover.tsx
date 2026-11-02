'use client';

import React, { useState, useEffect } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { HandoverView, PieceOut, ApiStatement } from '@/services/api';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  Clock,
  ThumbsUp,
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  X,
  Loader2,
  RefreshCw,
  GitBranch,
  ListOrdered,
  Users,
} from 'lucide-react';

export function Screen4IncomingHandover() {
  const {
    activeHandoverId,
    activeHandover,
    handoverView,
    handoverViewLoading,
    handoverViewError,
    receipt,
    loadHandoverView,
    confirmReceiptApi,
    getPiece,
    errorMessage,
    successMessage,
    clearMessages,
  } = useHandover();

  const [isConfirming, setIsConfirming] = useState(false);
  const [inspectPiece, setInspectPiece] = useState<PieceOut | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  useEffect(() => {
    loadHandoverView();
  }, [loadHandoverView]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    await confirmReceiptApi();
    setIsConfirming(false);
  };

  const openPieceInspection = async (pieceId: number) => {
    setInspectLoading(true);
    const piece = await getPiece(pieceId);
    setInspectPiece(piece);
    setInspectLoading(false);
  };

  // If loading
  if (handoverViewLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <Loader2 size={32} className="animate-spin text-[#5A5B4C] mx-auto mb-3" />
        <p className="text-xs text-[#7A7B72]">Loading handover knowledge base...</p>
      </div>
    );
  }

  // If unapproved (409) or no view available yet
  if (!handoverView) {
    return (
      <div className="max-w-3xl mx-auto py-10 select-none">
        <div className="bg-white rounded-3xl border border-[#E6E6DE] p-10 text-center shadow-soft space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Clock size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#1F201B]">Handover Awaiting Lead Approval</h2>
          <p className="text-xs text-[#7A7B72] max-w-md mx-auto leading-relaxed">
            Team Lead Deepak has not yet approved and published this handover package. Once verified and approved, the complete knowledge base, verified decisions, and remaining technical gaps will unlock here for your review.
          </p>

          <div className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs max-w-sm mx-auto text-left space-y-1">
            <p className="font-bold text-[#1F201B]">
              {activeHandover?.project_name || 'Campus Events App'}
            </p>
            <p className="text-[#7A7B72]">Title: {activeHandover?.title || 'Knowledge Handover'}</p>
            <p className="text-[#5A5B4C] font-semibold">Status: Draft (Pending Lead Review)</p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={loadHandoverView}
              className="px-4 py-2 rounded-full bg-white border border-[#E6E6DE] text-xs font-semibold text-[#3A3B34] hover:bg-[#EAEAE2] inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw size={12} />
              <span>Check Approval Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = !!receipt || !!handoverView.receipt;
  const receiptUser = receipt?.user_name || handoverView.receipt?.user_name || 'Kiran';
  const receiptDate = receipt?.created_at || handoverView.receipt?.created_at;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center justify-between shadow-2xs">
          <span>{errorMessage}</span>
          <button onClick={clearMessages} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-2xs">
          <span>{successMessage}</span>
          <button onClick={clearMessages} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-[#1F201B]">
              {handoverView.handover.project_name}
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Approved Handover
            </span>
          </div>
          <p className="text-xs text-[#7A7B72] mt-0.5">
            Successor knowledge handover package from Asha to <strong className="text-[#1F201B]">Kiran</strong>.
          </p>
        </div>

        <div>
          {isConfirmed ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <CheckCircle2 size={15} />
              <span>Receipt Confirmed by {receiptUser}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] disabled:opacity-50 text-white text-xs font-semibold shadow-soft transition-all"
            >
              {isConfirming ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <ThumbsUp size={14} />
                  <span>Confirm Receipt</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice & Redaction Banner */}
      <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] flex items-start gap-3 shadow-soft">
        <Info size={16} className="text-[#5A5B4C] shrink-0 mt-0.5" />
        <div className="text-xs text-[#3A3B34] leading-relaxed space-y-1">
          <div>
            <strong className="text-[#1F201B]">Notice to Successor: </strong>
            All answers submitted by departing member Asha are explicitly marked <span className="font-semibold text-amber-800">Unverified</span> below. Open technical questions and gaps remain active for team onboarding.
          </div>
          <div className="text-[11px] text-[#7A7B72]">
            Sensitive data (passwords, private API keys, emails) has been pattern-redacted by the backend security filter for this view.
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Architectural Decisions ─────────────────────────────── */}
      {handoverView.decisions.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
              <Sparkles size={16} className="text-[#5A5B4C]" />
              Architectural Decisions ({handoverView.decisions.length})
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Verified
            </span>
          </div>

          <div className="divide-y divide-[#E6E6DE]">
            {handoverView.decisions.map((st) => (
              <div key={st.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-[#1F201B] leading-relaxed">
                  {st.text}
                </p>
                {st.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {st.sources.map((src) => (
                      <button
                        key={src.piece_id}
                        type="button"
                        onClick={() => openPieceInspection(src.piece_id)}
                        className="px-2.5 py-1 rounded-lg bg-[#F4F4F0] hover:bg-[#EAEAE2] border border-[#E6E6DE] text-[11px] text-[#3A3B34] flex items-center gap-1.5 transition-colors"
                      >
                        <FileText size={11} className="text-[#5A5B4C]" />
                        <span>{src.source_name} ({src.locator})</span>
                        <ExternalLink size={9} className="text-[#7A7B72]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 2: Code Ownership & System Access ──────────────────────── */}
      {handoverView.owns.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
            <Users size={16} className="text-[#5A5B4C]" />
            Code Ownership &amp; System Access ({handoverView.owns.length})
          </h3>
          <div className="divide-y divide-[#E6E6DE]">
            {handoverView.owns.map((st) => (
              <div key={st.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <p className="text-xs sm:text-sm text-[#1F201B] leading-relaxed">{st.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Unfinished Deliverables ─────────────────────────────── */}
      {handoverView.unfinished.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
            <GitBranch size={16} className="text-[#5A5B4C]" />
            Unfinished Deliverables &amp; Open Branches ({handoverView.unfinished.length})
          </h3>
          <div className="divide-y divide-[#E6E6DE]">
            {handoverView.unfinished.map((st) => (
              <div key={st.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <p className="text-xs sm:text-sm text-[#1F201B] leading-relaxed">{st.text}</p>
                {st.sources[0] && (
                  <p className="text-[11px] text-[#7A7B72] italic pl-2 border-l-2 border-[#5A5B4C]">
                    &ldquo;{st.sources[0].quote}&rdquo; — {st.sources[0].source_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Risks & Vulnerabilities ─────────────────────────────── */}
      {handoverView.risks.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600" />
            Risks, Blockers &amp; Vulnerabilities ({handoverView.risks.length})
          </h3>
          <div className="divide-y divide-[#E6E6DE]">
            {handoverView.risks.map((st) => (
              <div key={st.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <p className="text-xs sm:text-sm text-[#1F201B] leading-relaxed">{st.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 5: Departing Member Answers (EXPLICITLY MARKED UNVERIFIED) ─ */}
      {handoverView.from_departing_member.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F201B]">
                Answers From Departing Member ({handoverView.from_departing_member.length})
              </h3>
              <p className="text-xs text-[#7A7B72] mt-0.5">
                Explanations provided by Asha during the AI knowledge interview.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
              <ShieldQuestion size={12} /> Always Unverified
            </span>
          </div>

          <div className="divide-y divide-[#E6E6DE]">
            {handoverView.from_departing_member.map((st) => (
              <div key={st.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="p-3.5 rounded-2xl bg-[#F8F8F4] border border-[#E6E6DE] text-xs text-[#1F201B] leading-relaxed">
                  <span className="font-bold text-[#5A5B4C] block mb-1">Asha&apos;s Direct Note:</span>
                  {st.text}
                </div>
                {st.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[11px] text-[#7A7B72]">
                    <span>Linked to evidence:</span>
                    {st.sources.map((s) => (
                      <span key={s.piece_id} className="font-mono underline">
                        {s.source_name} ({s.locator})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 6: Outstanding Gaps / Open Questions ───────────────────── */}
      {handoverView.open_questions.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-200 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F201B]">
                Open Technical Questions &amp; Gaps ({handoverView.open_questions.length})
              </h3>
              <p className="text-xs text-[#7A7B72] mt-0.5">
                Items accepted as known unknowns or unconfirmed during handover review.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 uppercase tracking-wider">
              Accepted Gap
            </span>
          </div>

          <div className="divide-y divide-[#E6E6DE]">
            {handoverView.open_questions.map((st) => (
              <div key={st.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <p className="text-xs sm:text-sm text-[#1F201B] leading-relaxed">{st.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 7: Recommended Next Actions ────────────────────────────── */}
      {handoverView.next_actions.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E6E6DE] shadow-soft space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#1F201B] flex items-center gap-2">
              <ListOrdered size={16} className="text-[#5A5B4C]" />
              Recommended Next Actions ({handoverView.next_actions.length})
            </h3>
            <p className="text-xs text-[#7A7B72] mt-0.5">
              Suggested next steps for team lead and successor review (in recommended priority order).
            </p>
          </div>

          <div className="space-y-2.5">
            {handoverView.next_actions.map((act) => (
              <div
                key={act.order}
                className="p-3.5 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#5A5B4C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {act.order}
                </div>
                <p className="text-xs text-[#1F201B] font-medium leading-relaxed mt-0.5">{act.text}</p>
              </div>
            ))}
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
              <button onClick={() => setInspectPiece(null)} className="text-[#7A7B72] hover:text-[#1F201B]">
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
