'use client';

import React, { useState, useEffect } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Question, QuestionCategory } from '@/types';
import { VoiceRecorder } from '@/components/interview/VoiceRecorder';
import { InterviewIntroduction } from '@/components/interview/InterviewIntroduction';
import { InterviewCompletion } from '@/components/interview/InterviewCompletion';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  SkipForward,
  HelpCircle,
  Save,
  AlertTriangle,
  FileText,
  Mic,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  RotateCcw,
  PauseCircle,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

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

  // If in introduction view
  const [inInterviewMode, setInInterviewMode] = useState(false);
  const [isCompletedMode, setIsCompletedMode] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const totalQuestions = project.questions.length;
  const currentQuestion: Question | undefined = project.questions[currentIndex];

  // Initialize or update text when current question changes
  useEffect(() => {
    if (currentQuestion) {
      setAnswerText(currentQuestion.answer || '');
      setFollowUpText(currentQuestion.followUp?.answer || '');
      setActiveTab(currentQuestion.hasVoiceRecording ? 'voice' : 'text');
      setSaveStatus('saved');
    }
  }, [currentIndex, currentQuestion]);

  // If coming directly from role selection or menu
  if (activeScreen === 'departing-intro' && !inInterviewMode) {
    return <InterviewIntroduction />;
  }

  if (isCompletedMode) {
    return (
      <InterviewCompletion
        onRevisitQuestion={(idx) => {
          setIsCompletedMode(false);
          setInInterviewMode(true);
          setCurrentIndex(idx);
        }}
      />
    );
  }

  if (!currentQuestion) {
    return <InterviewIntroduction />;
  }

  // Answered stats
  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  // Handlers
  const handleAnswerChange = (val: string) => {
    setAnswerText(val);
    setSaveStatus('unsaved');
  };

  const handleSaveCurrent = (options?: { hasVoice?: boolean; durationSeconds?: number }) => {
    if (!currentQuestion) return;
    setSaveStatus('saving');
    setTimeout(() => {
      saveAnswer(currentQuestion.id, answerText, options);
      setSaveStatus('saved');
    }, 200);
  };

  const handleSaveFollowUp = () => {
    if (!currentQuestion || !followUpText.trim()) return;
    saveFollowUpAnswer(currentQuestion.id, followUpText.trim());
  };

  const handleNext = () => {
    // If text modified and unsaved, save it
    if (saveStatus === 'unsaved' && answerText.trim()) {
      handleSaveCurrent();
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompletedMode(true);
    }
  };

  const handlePrevious = () => {
    if (saveStatus === 'unsaved' && answerText.trim()) {
      handleSaveCurrent();
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

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
    handleSaveCurrent({ hasVoice: true, durationSeconds });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Brand & Handover Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Compass size={18} />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-bold text-[#0F172A] tracking-wider uppercase">
              TRAILMARK
            </div>
            <div className="text-[11px] text-[#64748B] font-medium truncate max-w-[240px]">
              {project.name}
            </div>
          </div>
          <span className="hidden md:inline-block text-xs bg-slate-100 text-[#64748B] px-2 py-0.5 rounded font-medium">
            Knowledge Handover
          </span>
        </div>

        {/* Center: Checkpoint Counter & Save Status */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <span className="text-xs font-bold text-[#0F172A]">
              Question {String(currentIndex + 1).padStart(2, '0')}{' '}
              <span className="text-[#64748B] font-normal">of {String(totalQuestions).padStart(2, '0')}</span>
            </span>
          </div>

          {/* Dynamic Save State Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1 font-medium text-[11px]">
                <CheckCircle2 size={13} /> Saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-brand-600 flex items-center gap-1 font-medium text-[11px] animate-pulse">
                <Clock size={13} /> Saving...
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-600 flex items-center gap-1 font-medium text-[11px]">
                <AlertTriangle size={13} /> Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions (Checkpoints Overview + Pause/Exit) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNavDrawer(!showNavDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-slate-50 transition-colors"
          >
            <Menu size={14} />
            <span className="hidden sm:inline">All Questions</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            title="Pause and exit interview"
          >
            <PauseCircle size={15} />
            <span className="hidden sm:inline">Pause</span>
          </button>
        </div>
      </header>

      {/* HORIZONTAL PROGRESS BAR */}
      <div className="w-full h-1 bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-brand-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* 2. MAIN INTERVIEW WORKSPACE */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Question Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Header: Category Badge & Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-600 border border-blue-100">
                <Sparkles size={12} />
                {currentQuestion.category}
              </span>

              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  currentQuestion.status === 'answered'
                    ? 'bg-emerald-50 text-emerald-700'
                    : currentQuestion.status === 'unknown'
                      ? 'bg-amber-50 text-amber-700'
                      : currentQuestion.status === 'skipped'
                        ? 'bg-slate-100 text-[#64748B]'
                        : 'bg-blue-50 text-brand-600'
                }`}
              >
                {currentQuestion.status === 'answered'
                  ? 'Answered'
                  : currentQuestion.status === 'unknown'
                    ? 'Flagged as Unknown'
                    : currentQuestion.status === 'skipped'
                      ? 'Skipped'
                      : 'In Progress'}
              </span>
            </div>

            {/* Question Title in Large Readable Typography */}
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] leading-snug mb-4">
              {currentQuestion.question}
            </h1>

            {/* Context: Why we're asking */}
            {currentQuestion.reason && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0] mb-6 flex items-start gap-2.5 text-xs text-[#64748B]">
                <HelpCircle size={15} className="text-brand-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-[#0F172A]">Why we&apos;re asking: </strong>
                  {currentQuestion.reason}
                </div>
              </div>
            )}

            {/* Dual Answer Interface: Text vs Voice Toggle */}
            <div className="border-t border-[#F1F5F9] pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'text'
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    <FileText size={14} />
                    Text Response
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('voice')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'voice'
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                    }`}
                  >
                    <Mic size={14} />
                    Voice Recording & Transcription
                  </button>
                </div>

                <span className="text-[11px] text-[#64748B]">
                  Departing persona: {project.departingMember}
                </span>
              </div>

              {/* Option A: Text Answer */}
              {activeTab === 'text' && (
                <div>
                  <textarea
                    value={answerText}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={5}
                    placeholder="Explain the technical reasoning, file locations, operational edge cases, or who to contact..."
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-2 text-[11px] text-[#64748B]">
                    <span>
                      {answerText ? `${answerText.split(/\s+/).filter(Boolean).length} words` : 'Provide detailed explanation for your successor.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveCurrent()}
                      disabled={!answerText.trim() || saveStatus === 'saved'}
                      className="px-3 py-1 rounded-md text-xs font-semibold text-brand-600 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                    >
                      Save Answer
                    </button>
                  </div>
                </div>
              )}

              {/* Option B: Voice Answer */}
              {activeTab === 'voice' && (
                <VoiceRecorder
                  initialText={answerText}
                  onTranscriptionComplete={handleVoiceTranscription}
                />
              )}
            </div>

            {/* 3. AI CONVERSATIONAL FOLLOW-UP SECTION */}
            {currentQuestion.followUp && answerText.trim().length > 15 && (
              <div className="mt-6 pt-5 border-t border-[#F1F5F9] animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-md bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">
                      AI
                    </span>
                    <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                      AI Interviewer Follow-up Question
                    </h3>
                  </div>

                  <p className="text-sm font-semibold text-blue-950 mb-3 leading-relaxed">
                    {currentQuestion.followUp.question}
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      rows={2}
                      placeholder="Add clarification for this specific detail..."
                      className="w-full px-3 py-2 rounded-lg border border-blue-200 text-xs text-[#0F172A] bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveFollowUp}
                        disabled={!followUpText.trim() || currentQuestion.followUp.status === 'answered'}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
                      >
                        {currentQuestion.followUp.status === 'answered' ? 'Follow-up Saved' : 'Save Clarification'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. BOTTOM CONTROLS & NAVIGATION BAR */}
        <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Previous Question */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <ArrowLeft size={14} /> Previous
            </button>
          </div>

          {/* Center: Secondary Response Actions (Skip / I Don't Know) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 flex items-center gap-1 transition-colors"
            >
              <SkipForward size={14} /> Skip Question
            </button>
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1 transition-colors"
            >
              <AlertTriangle size={14} /> I Don&apos;t Know
            </button>
          </div>

          {/* Right: Next Question or Finish */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{currentIndex === totalQuestions - 1 ? 'Review & Submit' : 'Next Question'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. SLIDE-OUT QUESTION CHECKPOINT DRAWER */}
      {showNavDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-2xs transition-opacity"
            onClick={() => setShowNavDrawer(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E2E8F0]">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Checkpoint Overview</h3>
                <p className="text-xs text-[#64748B]">
                  {answeredCount} of {totalQuestions} completed ({progressPct}%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNavDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {project.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowNavDrawer(false);
                    }}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-start gap-3 ${
                      isCurrent
                        ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500'
                        : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-brand-600 text-white'
                          : q.status === 'answered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-semibold text-brand-600 truncate">
                          {q.category}
                        </span>
                        {q.status === 'answered' && (
                          <span className="text-emerald-600">
                            <CheckCircle2 size={12} />
                          </span>
                        )}
                        {q.status === 'unknown' && (
                          <span className="text-amber-600 text-[10px] font-bold">Unknown</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#0F172A] line-clamp-2">
                        {q.shortTitle || q.question}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setShowNavDrawer(false);
                  setIsCompletedMode(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Go to Review Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EXIT / PAUSE CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Pause Handover Interview?</h3>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              All your recorded answers and transcriptions up to checkpoint {currentIndex + 1} are saved. You can resume this interview anytime from the dashboard.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors"
              >
                Continue Answering
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  setActiveScreen('role-select');
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm transition-colors"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
