'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Question } from '@/types';
import { VoiceRecorder } from '@/components/interview/VoiceRecorder';
import { InterviewIntroduction } from '@/components/interview/InterviewIntroduction';
import { InterviewCompletion } from '@/components/interview/InterviewCompletion';
import { PieceOut } from '@/services/api';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Check,
  Mic,
  Square,
  X,
  Menu,
  HelpCircle,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

// ─── Risk dot colour per evidence status ────────────────────────────────────
function RiskDot({ status }: { status: Question['evidenceStatus'] }) {
  const colour =
    status === 'verified'
      ? 'bg-emerald-500'
      : status === 'unverified'
      ? 'bg-amber-400'
      : 'bg-red-500';
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${colour}`}
      title={`Evidence: ${status}`}
    />
  );
}

type SlideDir = 'left' | 'right' | 'none';

export function Screen2DepartingQuestions() {
  const {
    project,
    questions: backendQuestions,
    activeScreen,
    setActiveScreen,
    saveAnswer,
    saveFollowUpAnswer,
    skipQuestion,
    markDontKnow,
    getPiece,
  } = useHandover();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [whyOpen, setWhyOpen] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [isCompletedMode, setIsCompletedMode] = useState(false);
  const [slideDir, setSlideDir] = useState<SlideDir>('none');
  const [slideKey, setSlideKey] = useState(0);
  const [inspectPiece, setInspectPiece] = useState<PieceOut | null>(null);
  const [inspectPieceLoading, setInspectPieceLoading] = useState(false);
  const [pieceError, setPieceError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalQuestions = project.questions.length;
  const currentQuestion: Question | undefined = project.questions[currentIndex];

  // Sync answer state on question switch
  useEffect(() => {
    if (currentQuestion) {
      setAnswerText(currentQuestion.answer || '');
      setFollowUpText(currentQuestion.followUp?.answer || '');
      setSaveStatus('saved');
      setWhyOpen(false);
      setShowVoice(false);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleAnswerChange = (val: string) => {
    setAnswerText(val);
    setSaveStatus('unsaved');
  };

  const handleSaveCurrent = (opts?: { hasVoice?: boolean; durationSeconds?: number }) => {
    if (!currentQuestion) return;
    setSaveStatus('saving');
    setTimeout(() => {
      saveAnswer(currentQuestion.id, answerText, opts);
      setSaveStatus('saved');
    }, 200);
  };

  const handleSaveFollowUp = () => {
    if (!currentQuestion || !followUpText.trim()) return;
    saveFollowUpAnswer(currentQuestion.id, followUpText.trim());
  };

  const navigate = useCallback(
    (dir: 'next' | 'prev') => {
      if (saveStatus === 'unsaved' && answerText.trim()) handleSaveCurrent();
      if (dir === 'next') {
        if (currentIndex < totalQuestions - 1) {
          setSlideDir('left');
          setSlideKey((k) => k + 1);
          setTimeout(() => setCurrentIndex((p) => p + 1), 10);
        } else {
          setIsCompletedMode(true);
        }
      } else {
        if (currentIndex > 0) {
          setSlideDir('right');
          setSlideKey((k) => k + 1);
          setTimeout(() => setCurrentIndex((p) => p - 1), 10);
        }
      }
    },
    [saveStatus, answerText, currentIndex, totalQuestions] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleNext = () => navigate('next');
  const handlePrevious = () => navigate('prev');

  const handleSkip = () => {
    if (!currentQuestion) return;
    skipQuestion(currentQuestion.id);
    handleNext();
  };

  const handleDontKnow = () => {
    if (!currentQuestion) return;
    markDontKnow(currentQuestion.id);
    handleNext();
  };

  const handleVoiceTranscription = (text: string, durationSeconds: number) => {
    setAnswerText(text);
    setIsRecording(false);
    handleSaveCurrent({ hasVoice: true, durationSeconds });
  };

  if (activeScreen === 'departing-intro') return <InterviewIntroduction />;
  if (isCompletedMode) {
    return (
      <InterviewCompletion
        onRevisitQuestion={(idx) => {
          setIsCompletedMode(false);
          setCurrentIndex(idx);
        }}
      />
    );
  }
  if (!currentQuestion) return <InterviewIntroduction />;

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  const slideClass =
    slideDir === 'left'
      ? 'animate-slide-in-left'
      : slideDir === 'right'
      ? 'animate-slide-in-right'
      : '';

  const currentBackendQuestion = backendQuestions[currentIndex];
  const backendEvidence = currentBackendQuestion?.evidence || [];
  const isRestricted = currentQuestion.evidenceStatus === 'missing_conflicting';
  const sourceQuotes = currentQuestion.reason
    ? currentQuestion.reason.split('|').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleInspectEvidence = async (pieceId: number) => {
    setInspectPieceLoading(true);
    setPieceError(null);
    const p = await getPiece(pieceId);
    if (p) {
      setInspectPiece(p);
    } else {
      setPieceError('Source evidence for this item is restricted under project access controls.');
    }
    setInspectPieceLoading(false);
  };

  return (
    <>
      {/* Slide animation keyframes */}
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left  { animation: slideInFromRight 0.22s cubic-bezier(.4,0,.2,1) both; }
        .animate-slide-in-right { animation: slideInFromLeft  0.22s cubic-bezier(.4,0,.2,1) both; }
        .recording-pulse { animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div className="min-h-screen bg-[#F4F4F0] flex flex-col font-sans select-none">
        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <header className="h-16 bg-white border-b border-[#E6E6DE] px-6 sm:px-10 flex items-center justify-between sticky top-0 z-30 shrink-0">
          {/* Left: Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#5A5B4C] flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Compass size={16} />
            </div>
            <div className="hidden sm:block leading-none min-w-0">
              <div className="text-[11px] font-bold text-[#1F201B] tracking-widest uppercase">TRAILMARK</div>
              <div className="text-[11px] text-[#7A7B72] truncate max-w-[200px] mt-0.5">{project.name}</div>
            </div>
          </div>

          {/* Center: Thin Progress Bar + Question Counter */}
          <div className="flex flex-col items-center gap-1.5 flex-1 px-6 max-w-sm mx-auto">
            <div className="w-full h-1 bg-[#E6E6DE] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A5B4C] transition-all duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#7A7B72] whitespace-nowrap">
              Question{' '}
              <span className="font-bold text-[#1F201B]">{currentIndex + 1}</span>
              {' '}of {totalQuestions}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNavDrawer(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6E6DE] bg-white text-xs font-medium text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors"
            >
              <Menu size={13} />
              Overview
            </button>
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
            >
              Save &amp; Exit
            </button>
          </div>
        </header>

        {/* ── Main Two-Column Split (Question Left | Answer Right) ─────────── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-12 pb-28 flex items-center">
          <div
            key={slideKey}
            className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start ${slideClass}`}
          >
            {/* ── LEFT COLUMN: Question Details ───────────────────────────── */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-6">
              {/* Category chip + Risk dot + Target role */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAEAE2] text-[#5A5B4C]">
                  <Sparkles size={12} />
                  {currentQuestion.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white border border-[#E6E6DE] text-[#7A7B72]">
                  <RiskDot status={currentQuestion.evidenceStatus} />
                  <span className="capitalize">{currentQuestion.evidenceStatus.replace('_', ' / ')}</span>
                </span>
                <span className="text-xs text-[#A2A399] ml-auto hidden sm:inline">
                  Target: {project.departingRole}
                </span>
              </div>

              {/* Question Text (Large Type, max 2-3 lines) */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1F201B] leading-tight tracking-tight">
                {currentQuestion.question}
              </h1>

              {/* Collapsible "Why we're asking" (Closed by default) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setWhyOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A5B4C] hover:text-[#4A4B3E] transition-colors"
                >
                  <HelpCircle size={14} />
                  <span>Why we&apos;re asking</span>
                  {whyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {whyOpen && (
                  <div className="mt-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-[#E6E6DE] shadow-soft space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A7B72]">
                      Grounded Source Context &amp; Evidence
                    </p>
                    {backendEvidence.length > 0 ? (
                      <div className="space-y-2.5">
                        {backendEvidence.map((ev, idx) => (
                          <div key={idx} className="border-l-2 border-[#5A5B4C] pl-3.5 text-xs space-y-1">
                            <p className="italic text-[#3A3B34]">&ldquo;{ev.quote}&rdquo;</p>
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="font-mono text-[#7A7B72]">{ev.locator}</span>
                              <button
                                type="button"
                                onClick={() => handleInspectEvidence(ev.piece_id)}
                                className="text-[#5A5B4C] hover:underline flex items-center gap-1 font-semibold"
                              >
                                <span>Inspect Source Piece #{ev.piece_id}</span>
                                <ExternalLink size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : isRestricted ? (
                      <p className="text-xs text-[#7A7B72] italic leading-relaxed">
                        Source evidence for this item is restricted to Lead review.
                      </p>
                    ) : sourceQuotes.length > 0 ? (
                      sourceQuotes.map((quote, idx) => (
                        <blockquote
                          key={idx}
                          className="border-l-2 border-[#5A5B4C] pl-3.5 text-xs text-[#3A3B34] italic leading-relaxed"
                        >
                          {quote}
                        </blockquote>
                      ))
                    ) : (
                      <p className="text-xs text-[#7A7B72] italic leading-relaxed">
                        {currentQuestion.reason ||
                          'This question ensures critical technical context and unowned dependencies are carried forward.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Source Reference Note */}
              <div className="p-4 rounded-2xl bg-[#F0F0E8] border border-[#E6E6DE] text-xs text-[#5A5B4C] leading-relaxed flex items-start gap-2.5">
                <FileText size={15} className="shrink-0 mt-0.5 text-[#5A5B4C]" />
                <div>
                  <strong className="text-[#1F201B]">Context from project sources: </strong>
                  Answers will be verified against commit history, pull requests, and architecture records before handover approval.
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Answer Area ──────────────────────────────── */}
            <div className="lg:col-span-6 xl:col-span-6 flex flex-col space-y-4">
              {/* Answer Box Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1F201B] uppercase tracking-wider">
                    Your Response
                  </span>
                  {showVoice && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAEAE2] text-[#5A5B4C]">
                      Voice Enabled
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {saveStatus === 'saved' && answerText.trim() && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check size={13} />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="text-xs text-[#7A7B72]">Saving...</span>
                  )}
                </div>
              </div>

              {/* Big Answer Textarea */}
              <div className="relative">
                <textarea
                  value={answerText}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  rows={8}
                  placeholder="Detail your architecture decisions, edge cases, deployment keys, or unfinished code branches..."
                  className="w-full px-5 py-4 pr-14 rounded-3xl border border-[#E6E6DE] bg-white text-sm text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-2 focus:ring-[#5A5B4C]/25 focus:border-[#5A5B4C] leading-relaxed resize-none transition-all shadow-soft font-[inherit]"
                />

                {/* Mic Button in Textarea Corner */}
                <button
                  type="button"
                  onClick={() => {
                    setShowVoice((v) => !v);
                    setIsRecording(false);
                  }}
                  title={showVoice ? 'Hide voice recorder' : 'Record voice answer'}
                  className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-2xs ${
                    isRecording
                      ? 'bg-red-500 text-white recording-pulse'
                      : showVoice
                      ? 'bg-[#5A5B4C] text-white'
                      : 'bg-[#EAEAE2] text-[#5A5B4C] hover:bg-[#DCDCD2]'
                  }`}
                >
                  {isRecording ? <Square size={15} /> : <Mic size={15} />}
                </button>

                {/* Character Count */}
                {answerText.length > 0 && (
                  <div className="absolute bottom-3.5 right-4 text-[10px] text-[#A2A399] pointer-events-none">
                    {answerText.length} characters
                  </div>
                )}

                {/* Recording Pulse Badge */}
                {isRecording && (
                  <div className="absolute bottom-3.5 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-500 recording-pulse" />
                    Recording {fmtTime(recordSecs)}
                  </div>
                )}
              </div>

              {/* Inline Voice Recorder (Expands non-destructively) */}
              {showVoice && (
                <div className="rounded-2xl border border-[#E6E6DE] bg-white shadow-soft overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#E6E6DE] bg-[#F4F4F0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic size={13} className="text-[#5A5B4C]" />
                      <span className="text-xs font-semibold text-[#1F201B]">Voice Transcription</span>
                    </div>
                    <span className="text-[10px] text-[#7A7B72]">Speech-to-Text auto appends</span>
                  </div>
                  <div className="p-4">
                    <VoiceRecorder
                      initialText={answerText}
                      onTranscriptionComplete={handleVoiceTranscription}
                    />
                  </div>
                </div>
              )}

              {/* Follow-up Clarification */}
              {currentQuestion.followUp && answerText.trim().length > 15 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6E6DE] shadow-soft space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5A5B4C] uppercase tracking-wider">
                      Follow-up Clarification
                    </span>
                    <span className="text-[10px] text-[#7A7B72]">For {project.incomingMember}</span>
                  </div>
                  <p className="text-xs font-bold text-[#1F201B] leading-snug">
                    {currentQuestion.followUp.question}
                  </p>
                  <textarea
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    rows={2}
                    placeholder="Provide additional technical clarity..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E6DE] bg-[#F4F4F0] text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] font-[inherit] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveFollowUp}
                      className="px-3.5 py-1.5 rounded-full bg-[#5A5B4C] text-white text-[11px] font-semibold hover:bg-[#4A4B3E] transition-colors"
                    >
                      Save Clarification
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── Fixed Bottom Navigation Bar ──────────────────────────────────── */}
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-[#E6E6DE] px-6 sm:px-10 flex items-center justify-between z-20">
          {/* Back Button */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#7A7B72] hover:bg-[#EAEAE2] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {/* Center Actions: Skip & Don't Know */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 rounded-full text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              I Don&apos;t Know
            </button>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft transition-colors"
          >
            {currentIndex === totalQuestions - 1 ? 'Review & Submit' : 'Next Question'}
            <ChevronRight size={16} />
          </button>
        </nav>

        {/* ── Overview Drawer ──────────────────────────────────────────────── */}
        {showNavDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/20" onClick={() => setShowNavDrawer(false)} />
            <div className="relative w-80 bg-white h-full shadow-elevated border-l border-[#E6E6DE] p-5 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E6DE] mb-4">
                <h3 className="text-sm font-bold text-[#1F201B]">All Questions</h3>
                <button aria-label="Close" onClick={() => setShowNavDrawer(false)}>
                  <X size={16} className="text-[#7A7B72]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {project.questions.map((q, idx) => {
                  const isActive = idx === currentIndex;
                  const isAnswered = q.status === 'answered';
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSlideDir(idx > currentIndex ? 'left' : 'right');
                        setSlideKey((k) => k + 1);
                        setTimeout(() => setCurrentIndex(idx), 10);
                        setShowNavDrawer(false);
                      }}
                      className={`w-full p-3 rounded-2xl text-left text-xs border transition-all ${
                        isActive
                          ? 'bg-[#5A5B4C] text-white border-[#5A5B4C]'
                          : 'bg-white text-[#1F201B] border-[#E6E6DE] hover:bg-[#EAEAE2]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate">{q.shortTitle || `Q${idx + 1}`}</p>
                        {isAnswered && !isActive && (
                          <Check size={11} className="text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-[#7A7B72]'}`}>
                        {q.category}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Save & Exit Modal ────────────────────────────────────────────── */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30">
            <div className="bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-elevated max-w-sm w-full space-y-4">
              <h3 className="text-base font-bold text-[#1F201B]">Save &amp; Exit?</h3>
              <p className="text-xs text-[#7A7B72] leading-relaxed">
                All your answers are saved. You can resume this interview anytime from your dashboard.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setActiveScreen('role-select');
                  }}
                  className="px-4 py-2 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold shadow-soft hover:bg-[#4A4B3E] transition-colors"
                >
                  Save &amp; Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Evidence Piece Inspection Modal ──────────────────────────────── */}
        {(inspectPiece || pieceError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E6E6DE] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#5A5B4C]" />
                  <h3 className="text-sm font-bold text-[#1F201B]">
                    {inspectPiece ? inspectPiece.source_name : 'Evidence Restricted'}
                  </h3>
                </div>
                <button aria-label="Close"
                  onClick={() => {
                    setInspectPiece(null);
                    setPieceError(null);
                  }}
                  className="text-[#7A7B72] hover:text-[#1F201B]"
                >
                  <X size={16} />
                </button>
              </div>

              {inspectPiece ? (
                <>
                  <div className="text-xs text-[#7A7B72] font-mono bg-[#F4F4F0] px-3 py-1.5 rounded-lg w-fit">
                    Locator: {inspectPiece.locator} (Piece #{inspectPiece.id})
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8F8F4] border border-[#E6E6DE] text-xs text-[#1F201B] font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {inspectPiece.content}
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  {pieceError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setInspectPiece(null);
                    setPieceError(null);
                  }}
                  className="px-4 py-2 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold hover:bg-[#4A4B3E]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
