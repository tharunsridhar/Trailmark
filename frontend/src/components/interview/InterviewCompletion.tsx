'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  CheckCircle2,
  Clock,
  SkipForward,
  AlertTriangle,
  ArrowLeft,
  Send,
  Edit3,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface InterviewCompletionProps {
  onRevisitQuestion: (index: number) => void;
}

export function InterviewCompletion({ onRevisitQuestion }: InterviewCompletionProps) {
  const { project, submitDepartingAnswers, setActiveScreen } = useHandover();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const total = project.questions.length;
  const answered = project.questions.filter((q) => q.status === 'answered').length;
  const skipped = project.questions.filter((q) => q.status === 'skipped').length;
  const unknown = project.questions.filter((q) => q.status === 'unknown').length;
  const followUpsAnswered = project.questions.filter(
    (q) => q.followUp && q.followUp.status === 'answered'
  ).length;

  const handleSubmit = () => {
    submitDepartingAnswers();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={36} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-3">
            Your project knowledge has been submitted successfully.
          </h2>

          <p className="text-sm text-[#64748B] leading-relaxed max-w-lg mx-auto mb-8">
            Thank you, <strong className="text-[#0F172A]">{project.departingMember}</strong>. Your answers and voice transcriptions have been recorded and forwarded to{' '}
            <strong className="text-[#0F172A]">Kishan S (Team Lead)</strong> for verification against source repositories and code artifacts.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] text-left text-xs text-[#64748B] max-w-md mx-auto mb-8 space-y-2">
            <div className="flex items-center justify-between">
              <span>Handover Project:</span>
              <span className="font-semibold text-[#0F172A]">{project.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Submitted Responses:</span>
              <span className="font-semibold text-[#0F172A]">
                {answered} of {total} Questions Answered
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className="font-semibold text-amber-600">Pending Lead Review (Unverified)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveScreen('my-handover-departing')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              Return to Handover Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('role-select')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] font-medium text-sm transition-colors"
            >
              Switch Role for Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Interview Summary & Review</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Review your answers before submitting to the Team Lead for review.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRevisitQuestion(0)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to interview
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-medium text-[#64748B] mb-1">Answered</div>
          <div className="text-2xl font-bold text-emerald-600">
            {answered} <span className="text-xs text-[#64748B] font-normal">/ {total}</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-medium text-[#64748B] mb-1">Follow-ups</div>
          <div className="text-2xl font-bold text-brand-600">{followUpsAnswered}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-medium text-[#64748B] mb-1">Skipped</div>
          <div className="text-2xl font-bold text-[#64748B]">{skipped}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="text-xs font-medium text-[#64748B] mb-1">Flagged Gaps</div>
          <div className="text-2xl font-bold text-amber-600">{unknown}</div>
        </div>
      </div>

      {/* Answer List */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-slate-50/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <FileCheck size={16} className="text-brand-600" />
            Checkpoint Responses ({total})
          </h2>
          <span className="text-xs text-[#64748B]">Click any response to edit</span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {project.questions.map((q, idx) => {
            return (
              <div
                key={q.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-[#0F172A]">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-brand-600">{q.category}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        q.status === 'answered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : q.status === 'unknown'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {q.status === 'answered'
                        ? 'Answered'
                        : q.status === 'unknown'
                          ? "Marked Don't Know"
                          : 'Skipped'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-[#0F172A] mb-2">{q.question}</p>

                  {q.answer ? (
                    <div className="p-3 rounded-lg bg-slate-50 border border-[#E2E8F0] text-xs text-[#0F172A] leading-relaxed">
                      {q.answer}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748B] italic">No answer provided.</p>
                  )}

                  {/* Follow-up answer if present */}
                  {q.followUp && q.followUp.answer && (
                    <div className="mt-2 pl-3 border-l-2 border-brand-300">
                      <p className="text-[11px] font-medium text-brand-700">Follow-up clarification:</p>
                      <p className="text-xs text-[#0F172A]">{q.followUp.answer}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRevisitQuestion(idx)}
                  className="p-2 rounded-lg text-[#64748B] hover:text-brand-600 hover:bg-white border border-transparent hover:border-[#E2E8F0] shrink-0"
                  title="Edit answer"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission CTA */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A]">Ready to submit your handover knowledge?</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Your responses will be transmitted to Team Lead Kishan S for verification.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <Send size={15} />
          Submit Answers to Team Lead
        </button>
      </div>
    </div>
  );
}

