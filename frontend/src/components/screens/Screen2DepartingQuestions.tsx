'use client';

import React, { useState, useEffect } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Question } from '@/types';
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
  AlertTriangle,
  FileText,
  Mic,
  Sparkles,
  Menu,
  X,
  PauseCircle,
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCompletedMode, setIsCompletedMode] = useState(false);

  const totalQuestions = project.questions.length;
  const currentQuestion: Question | undefined = project.questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) {
      setAnswerText(currentQuestion.answer || '');
      setFollowUpText(currentQuestion.followUp?.answer || '');
      setActiveTab(currentQuestion.hasVoiceRecording ? 'voice' : 'text');
      setSaveStatus('saved');
    }
  }, [currentIndex, currentQuestion]);

  if (activeScreen === 'departing-intro') {
    return <InterviewIntroduction />;
  }

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

  if (!currentQuestion) {
    return <InterviewIntroduction />;
  }

  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;

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
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col select-none">
      {/* Top Bar matching reference */}
      <header className="h-20 bg-[#F4F4F0] border-b border-[#E6E6DE] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5A5B4C] flex items-center justify-center text-white shadow-2xs">
            <Compass size={16} />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-bold text-[#1F201B] tracking-wider uppercase">
              TRAILMARK
            </div>
            <div className="text-[11px] text-[#7A7B72] truncate max-w-[200px]">
              {project.name}
            </div>
          </div>
        </div>

        {/* Center: Question Counter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#1F201B]">
            Question {String(currentIndex + 1).padStart(2, '0')}{' '}
            <span className="text-[#7A7B72] font-normal">of {String(totalQuestions).padStart(2, '0')}</span>
          </span>
          {saveStatus === 'saved' && (
            <span className="text-emerald-700 flex items-center gap-1 font-medium text-[11px]">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNavDrawer(!showNavDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E6E6DE] bg-white text-xs font-medium text-[#3A3B34] hover:bg-[#EAEAE2] shadow-2xs"
          >
            <Menu size={13} />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#7A7B72] hover:bg-[#EAEAE2]"
          >
            <PauseCircle size={14} />
            <span className="hidden sm:inline">Pause</span>
          </button>
        </div>
      </header>

      {/* Thin Progress line */}
      <div className="w-full h-1 bg-[#E6E6DE] overflow-hidden">
        <div
          className="h-full bg-[#5A5B4C] transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main Question Card in reference style */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-between">
        <div className="bg-white rounded-3xl p-7 sm:p-9 border border-[#E6E6DE] shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F4F0] text-[#5A5B4C]">
              <Sparkles size={11} />
              {currentQuestion.category}
            </span>

            <span className="text-xs font-semibold text-[#7A7B72]">
              Assigned: {project.departingRole}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F201B] leading-snug">
            {currentQuestion.question}
          </h1>

          {currentQuestion.reason && (
            <div className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs text-[#7A7B72] leading-relaxed flex items-start gap-2.5">
              <HelpCircle size={15} className="text-[#5A5B4C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1F201B]">Context from sources: </strong>
                {currentQuestion.reason}
              </div>
            </div>
          )}

          {/* Response Switcher */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'text'
                    ? 'bg-[#5A5B4C] text-white shadow-soft'
                    : 'text-[#7A7B72] hover:bg-[#EAEAE2]'
                }`}
              >
                <FileText size={13} /> Text Response
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'voice'
                    ? 'bg-[#5A5B4C] text-white shadow-soft'
                    : 'text-[#7A7B72] hover:bg-[#EAEAE2]'
                }`}
              >
                <Mic size={13} /> Voice Note
              </button>
            </div>

            {activeTab === 'text' && (
              <div>
                <textarea
                  value={answerText}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  rows={5}
                  placeholder="Detail your architecture decisions, edge cases, deployment keys, or unfinished code branches..."
                  className="w-full px-4 py-3 rounded-2xl border border-[#E6E6DE] text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] leading-relaxed resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveCurrent()}
                    className="px-4 py-1.5 rounded-full bg-[#F4F4F0] hover:bg-[#EAEAE2] text-xs font-semibold text-[#5A5B4C]"
                  >
                    Save Answer
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <VoiceRecorder
                initialText={answerText}
                onTranscriptionComplete={handleVoiceTranscription}
              />
            )}
          </div>

          {/* Follow-up question if answered */}
          {currentQuestion.followUp && answerText.trim().length > 15 && (
            <div className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] space-y-2">
              <span className="text-[10px] font-bold text-[#5A5B4C] uppercase tracking-wider">
                Follow-up Clarification
              </span>
              <p className="text-xs font-bold text-[#1F201B]">
                {currentQuestion.followUp.question}
              </p>
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                rows={2}
                placeholder="Clarify this point for Priya..."
                className="w-full px-3 py-2 rounded-xl border border-[#E6E6DE] text-xs text-[#1F201B] bg-white"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveFollowUp}
                  className="px-3 py-1 rounded-full bg-[#5A5B4C] text-white text-[11px] font-semibold"
                >
                  Save Clarification
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Strip with pill buttons */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#E6E6DE] bg-white hover:bg-[#EAEAE2] text-xs font-semibold text-[#1F201B] disabled:opacity-30 shadow-2xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={13} /> Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#7A7B72] hover:bg-[#EAEAE2]"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleDontKnow}
              className="px-4 py-2 rounded-full text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            >
              I Don&apos;t Know
            </button>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft flex items-center justify-center gap-1.5"
          >
            <span>{currentIndex === totalQuestions - 1 ? 'Review & Submit' : 'Next Question'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Slideout Overview Drawer */}
      {showNavDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowNavDrawer(false)} />
          <div className="relative w-80 bg-[#F4F4F0] h-full shadow-elevated border-l border-[#E6E6DE] p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E6DE] mb-4">
              <h3 className="text-sm font-bold text-[#1F201B]">All Questions</h3>
              <button onClick={() => setShowNavDrawer(false)}>
                <X size={16} className="text-[#7A7B72]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {project.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowNavDrawer(false);
                  }}
                  className={`w-full p-3 rounded-2xl text-left text-xs border transition-all ${
                    idx === currentIndex
                      ? 'bg-[#5A5B4C] text-white border-[#5A5B4C]'
                      : 'bg-white text-[#1F201B] border-[#E6E6DE] hover:bg-[#EAEAE2]'
                  }`}
                >
                  <p className="font-bold">{q.shortTitle || `Question ${idx + 1}`}</p>
                  <p className={`text-[10px] mt-0.5 ${idx === currentIndex ? 'text-white/80' : 'text-[#7A7B72]'}`}>
                    {q.category}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pause Confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30">
          <div className="bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-elevated max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#1F201B]">Pause Handover Interview?</h3>
            <p className="text-xs text-[#7A7B72] leading-relaxed">
              All progress is saved. You can resume anytime from the dashboard.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#7A7B72]"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  setActiveScreen('role-select');
                }}
                className="px-4 py-2 rounded-full bg-[#5A5B4C] text-white text-xs font-semibold shadow-soft"
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
