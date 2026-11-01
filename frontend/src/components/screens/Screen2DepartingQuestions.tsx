'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { EvidenceBadge } from '@/components/EvidenceBadge';
import {
  HelpCircle,
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  SkipForward,
  HelpCircle as QuestionMark,
  Info,
  ShieldAlert,
} from 'lucide-react';

export function Screen2DepartingQuestions() {
  const {
    project,
    saveAnswer,
    markDontKnow,
    skipQuestion,
    submitDepartingAnswers,
    setActiveScreen,
    currentUser,
  } = useHandover();

  // Local draft states for each textarea
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    project.questions.forEach((q) => {
      initial[q.id] = q.answer || '';
    });
    return initial;
  });

  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});

  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;
  const totalCount = project.questions.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);

  const handleTextChange = (id: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = (id: string) => {
    const text = drafts[id]?.trim();
    if (text) {
      saveAnswer(id, text);
      setSavedFeedback((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setSavedFeedback((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    }
  };

  const handleDontKnow = (id: string) => {
    markDontKnow(id);
    setDrafts((prev) => ({ ...prev, [id]: 'Departing member does not know or has no recorded answer.' }));
  };

  const handleSkip = (id: string) => {
    skipQuestion(id);
  };

  const handleSubmitAll = () => {
    submitDepartingAnswers();
    setActiveScreen('review');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Role Info */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Targeted AI Knowledge Extraction</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Departing Member Handover Q&A
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Project: <strong className="text-slate-800 dark:text-white">{project.name}</strong> • Role:{' '}
              <span className="font-semibold text-brand-600 dark:text-blue-400">
                {project.departingRole}
              </span>{' '}
              ({currentUser.name})
            </p>
          </div>

          <div className="text-right sm:self-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completion Progress
            </span>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">
              {answeredCount} of {totalCount} answered
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-navy-950 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-brand-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Verification Rule Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Core Verification Rule:</strong> Answers you provide here are preserved with the label{' '}
            <strong className="underline decoration-amber-500">Unverified</strong> until reviewed and confirmed against project evidence by the Team Lead. This maintains honest uncertainty and transparency.
          </p>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-6">
        {project.questions.map((q, index) => {
          const isAnswered = q.status === 'answered';
          const isUnknown = q.status === 'unknown';
          const isSkipped = q.status === 'skipped';

          return (
            <div
              key={q.id}
              className={`p-6 rounded-2xl border transition-all duration-200 bg-white dark:bg-navy-900 ${
                isAnswered
                  ? 'border-emerald-200 dark:border-emerald-900/60 shadow-sm'
                  : isUnknown
                  ? 'border-rose-200 dark:border-rose-900/60 shadow-sm'
                  : isSkipped
                  ? 'border-slate-300 dark:border-navy-700 opacity-80'
                  : 'border-slate-200 dark:border-navy-800 shadow-sm'
              }`}
            >
              {/* Question Header & Why It's Asked */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {q.question}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {isAnswered && (
                      <EvidenceBadge status="unverified" />
                    )}
                    {isUnknown && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                        Marked Unknown (Gap)
                      </span>
                    )}
                    {isSkipped && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-400">
                        Skipped
                      </span>
                    )}
                    {q.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-brand-700 dark:bg-navy-800 dark:text-blue-300">
                        Needs Answer
                      </span>
                    )}
                  </div>
                </div>

                {/* Explanation of Why It is Being Asked */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs text-slate-600 dark:text-slate-300">
                  <Info className="w-4 h-4 text-brand-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Why this was raised: </strong>
                    {q.reason}
                  </p>
                </div>
              </div>

              {/* Answer Textarea */}
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={drafts[q.id] || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder="Type your explanation, context, decisions made, or remaining unfinished tasks..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white dark:border-navy-700 dark:bg-navy-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />

                {/* Question Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDontKnow(q.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-300 dark:bg-navy-800 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <QuestionMark className="w-3.5 h-3.5" />
                      <span>I Don't Know</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkip(q.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span>Skip for now</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {savedFeedback[q.id] && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Saved!
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSave(q.id)}
                      disabled={!drafts[q.id]?.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-600 dark:hover:bg-brand-500 shadow-sm transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Answer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Ready to hand over responses?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Your answers will be compiled for the Team Lead's review and cross-referenced with repository sources.
          </p>
        </div>

        <button
          onClick={handleSubmitAll}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 shadow-md transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Submit Answers to Team Lead</span>
        </button>
      </div>
    </div>
  );
}

