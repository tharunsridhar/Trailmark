'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Question } from '@/types';
import { VoiceRecorder } from '@/components/interview/VoiceRecorder';
import { InterviewIntroduction } from '@/components/interview/InterviewIntroduction';
import { InterviewCompletion } from '@/components/interview/InterviewCompletion';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Check,
  Mic,
  MicOff,
  Square,
  X,
  Menu,
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
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colour}`}
      title={status}
    />
  );
}

// ─── Slide direction ─────────────────────────────────────────────────────────
type SlideDir = 'left' | 'right' | 'none';

export function Screen2DepartingQuestions() {
  const {
    project,
    activeScreen,
    setActiveScreen,
    saveAnswer,
    saveFollowUpAnswer,
    skipQuestion,
    markDontKnow,
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalQuestions = project.questions.length;
  const currentQuestion: Question | undefined = project.questions[currentIndex];

  // ── Sync answer text when question changes ───────────────────────────────
  useEffect(() => {
    if (currentQuestion) {
      setAnswerText(currentQuestion.answer || '');
      setFollowUpText(currentQuestion.followUp?.answer || '');
      setSaveStatus('saved');
      setWhyOpen(false);
      setShowVoice(false);
    }
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording timer ──────────────────────────────────────────────────────
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

  // ── Early returns ────────────────────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────────────
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

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

  const handleVoiceTranscription = (text: string, durationSeconds: number) => {
    setAnswerText(text);
    setIsRecording(false);
    handleSaveCurrent({ hasVoice: true, durationSeconds });
  };

  // ── Slide CSS ────────────────────────────────────────────────────────────
  const slideClass =
    slideDir === 'left'
      ? 'animate-slide-in-left'
      : slideDir === 'right'
      ? 'animate-slide-in-right'
      : '';

  // ── Source quotes for "Why we're asking" ────────────────────────────────
  const isRestricted = currentQuestion.evidenceStatus === 'missing_conflicting';
  const sourceQuotes = currentQuestion.reason
    ? currentQuestion.reason.split('|').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* Slide animation keyframes injected once */}
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left  { animation: slideInFromRight 0.22s cubic-bezier(.4,0,.2,1) both; }
        .animate-slide-in-right { animation: slideInFromLeft  0.22s cubic-bezier(.4,0,.2,1) both; }
        .recording-pulse { animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div className="min-h-screen bg-[#F4F4F0] flex flex-col font-sans select-none">

        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <header className="h-14 bg-white border-b border-[#E6E6DE] px-5 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
          {/* Left: brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#5A5B4C] flex items-center justify-center text-white shrink-0">
              <Compass size={14} />
            </div>
            <div className="hidden sm:block leading-none min-w-0">
              <div className="text-[10px] font-bold text-[#1F201B] tracking-widest uppercase">TRAILMARK</div>
              <div className="text-[10px] text-[#7A7B72] truncate max-w-[180px]">{project.name}</div>
            </div>
          </div>

          {/* Center: progress + label */}
          <div className="flex flex-col items-center gap-1.5 flex-1 px-6 max-w-xs mx-auto">
            <div className="w-full h-[3px] bg-[#E6E6DE] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A5B4C] transition-all duration-400 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-[#7A7B72] whitespace-nowrap">
              Question{' '}
              <span className="font-bold text-[#1F201B]">{currentIndex + 1}</span>
              {' '}of {totalQuestions}
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNavDrawer(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E6E6DE] bg-white text-[11px] font-medium text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors"
            >
              <Menu size={12} />
              Overview
            </button>
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
            >
              Save &amp; Exit
            </button>
          </div>
        </header>

        {/* ── Main content area ─────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 pb-24">
          <div
            key={slideKey}
            className={`w-full max-w-2xl ${slideClass}`}
          >
            {/* Category chip + risk dot */}
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EAEAE2] text-[#5A5B4C]">
                {currentQuestion.category}
              </span>
              <RiskDot status={currentQuestion.evidenceStatus} />
              {saveStatus === 'saved' && answerText.trim() && (
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                  <Check size={12} />
                  Saved
                </span>
              )}
            </div>

            {/* Question — large type */}
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1F201B] leading-tight tracking-tight mb-6 line-clamp-3">
              {currentQuestion.question}
            </h1>

            {/* "Why we're asking" collapsible */}
            <div className="mb-7">
              <button
                type="button"
                onClick={() => setWhyOpen((o) => !o)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[#5A5B4C] hover:text-[#4A4B3E] transition-colors"
              >
                Why we&apos;re asking
                {whyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {whyOpen && (
                <div className="mt-3 p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] space-y-3">
                  {isRestricted ? (
                    <p className="text-xs text-[#7A7B72] italic">
                      Source evidence for this item is restricted.
                    </p>
                  ) : sourceQuotes.length > 0 ? (
                    sourceQuotes.map((q, i) => (
                      <blockquote
                        key={i}
                        className="border-l-2 border-[#5A5B4C] pl-3 text-xs text-[#3A3B34] italic leading-relaxed"
                      >
                        {q}
                      </blockquote>
                    ))
                  ) : (
                    <p className="text-xs text-[#7A7B72] italic leading-relaxed">
                      {currentQuestion.reason ||
                        'This question helps the incoming team member understand key decisions and risks.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Answer area */}
            <div className="relative">
              <textarea
                value={answerText}
                onChange={(e) => handleAnswerChange(e.target.value)}
                rows={7}
                placeholder="Share what you know — decisions made, edge cases, important context, or anything the next person should understand…"
                className="w-full px-5 py-4 pr-14 rounded-2xl border border-[#E6E6DE] bg-white text-sm text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-2 focus:ring-[#5A5B4C]/25 focus:border-[#5A5B4C] leading-relaxed resize-none transition-all font-[inherit]"
              />

              {/* Mic button in textarea corner */}
              <button
                type="button"
                onClick={() => {
                  setShowVoice((v) => !v);
                  setIsRecording(false);
                }}
                title={showVoice ? 'Hide voice recorder' : 'Record voice answer'}
                className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white recording-pulse'
                    : showVoice
                    ? 'bg-[#5A5B4C] text-white'
                    : 'bg-[#EAEAE2] text-[#5A5B4C] hover:bg-[#DCDCD2]'
                }`}
              >
                {isRecording ? <Square size={15} /> : <Mic size={15} />}
              </button>

              {/* Character count */}
              {answerText.length > 0 && (
                <div className="absolute bottom-3 right-3 text-[10px] text-[#A2A399] pointer-events-none">
                  {answerText.length}
                </div>
              )}

              {/* Recording badge */}
              {isRecording && (
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 recording-pulse" />
                  Recording {fmtTime(recordSecs)}
                </div>
              )}
            </div>

            {/* Voice recorder panel */}
            {showVoice && (
              <div className="mt-4 rounded-2xl border border-[#E6E6DE] bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E6E6DE] flex items-center gap-2">
                  <Mic size={13} className="text-[#5A5B4C]" />
                  <span className="text-xs font-semibold text-[#1F201B]">Voice Response</span>
                  <span className="ml-auto text-[10px] text-[#7A7B72]">Transcribed automatically</span>
                </div>
                <div className="p-4">
                  <VoiceRecorder
                    initialText={answerText}
                    onTranscriptionComplete={handleVoiceTranscription}
                  />
                </div>
              </div>
            )}

            {/* Follow-up question */}
            {currentQuestion.followUp && answerText.trim().length > 15 && (
              <div className="mt-5 p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] space-y-2.5">
                <span className="text-[10px] font-bold text-[#5A5B4C] uppercase tracking-wider">
                  Follow-up
                </span>
                <p className="text-sm font-semibold text-[#1F201B] leading-snug">
                  {currentQuestion.followUp.question}
                </p>
                <textarea
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  rows={2}
                  placeholder="Clarify this point…"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] font-[inherit] resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveFollowUp}
                    className="px-3 py-1.5 rounded-full bg-[#5A5B4C] text-white text-[11px] font-semibold hover:bg-[#4A4B3E] transition-colors"
                  >
                    Save Clarification
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── Fixed bottom bar ──────────────────────────────────────────── */}
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-[#E6E6DE] px-5 sm:px-8 flex items-center justify-between z-20">
          {/* Back */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-[#7A7B72] hover:bg-[#EAEAE2] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 rounded-full text-sm font-medium text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
          >
            Skip
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-sm font-semibold shadow-soft transition-colors"
          >
            {currentIndex === totalQuestions - 1 ? 'Review & Submit' : 'Next'}
            <ChevronRight size={16} />
          </button>
        </nav>

        {/* ── Overview drawer ───────────────────────────────────────────── */}
        {showNavDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/20" onClick={() => setShowNavDrawer(false)} />
            <div className="relative w-80 bg-white h-full shadow-elevated border-l border-[#E6E6DE] p-5 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-[#E6E6DE] mb-4">
                <h3 className="text-sm font-bold text-[#1F201B]">All Questions</h3>
                <button onClick={() => setShowNavDrawer(false)}>
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

        {/* ── Save & Exit confirm ───────────────────────────────────────── */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30">
            <div className="bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-elevated max-w-sm w-full space-y-4">
              <h3 className="text-base font-bold text-[#1F201B]">Save &amp; Exit?</h3>
              <p className="text-sm text-[#7A7B72] leading-relaxed">
                All your answers are saved. You can resume this interview anytime from your dashboard.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 rounded-full text-sm font-medium text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setActiveScreen('role-select');
                  }}
                  className="px-4 py-2 rounded-full bg-[#5A5B4C] text-white text-sm font-semibold shadow-soft hover:bg-[#4A4B3E] transition-colors"
                >
                  Save &amp; Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
