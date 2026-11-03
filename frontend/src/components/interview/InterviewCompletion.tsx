'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  CheckCircle2,
  ArrowLeft,
  Send,
  Edit3,
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

  const handleSubmit = () => {
    submitDepartingAnswers();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-10 select-none">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E6E6DE] text-center shadow-soft space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#F4F4F0] text-[#5A5B4C] flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F201B]">
              Handover Knowledge Submitted
            </h2>
            <p className="text-xs text-[#62635A] mt-1 max-w-md mx-auto leading-relaxed">
              Your responses have been recorded and sent to <strong className="text-[#1F201B]">Deepak (Team Lead)</strong> for verification against repository code and documentation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs max-w-sm mx-auto text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-[#62635A]">Project:</span>
              <span className="font-bold text-[#1F201B]">{project.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#62635A]">Questions Answered:</span>
              <span className="font-bold text-[#5A5B4C]">{answered} / {total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#62635A]">Status:</span>
              <span className="font-bold text-amber-800">Pending Lead Approval</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveScreen('my-handover-departing')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft"
            >
              Handover Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen('role-select')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white border border-[#E6E6DE] hover:bg-[#EAEAE2] text-xs font-semibold text-[#1F201B]"
            >
              Switch Role for Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1F201B]">Review Before Submission</h1>
          <p className="text-xs text-[#62635A] mt-0.5">
            Verify your answers before forwarding the knowledge handover to Deepak.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRevisitQuestion(0)}
          className="text-xs font-semibold text-[#5A5B4C] hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Edit Questions
        </button>
      </div>

      <div className="bg-white rounded-3xl p-7 border border-[#E6E6DE] shadow-soft space-y-4">
        <h2 className="text-sm font-bold text-[#1F201B] flex items-center gap-2">
          <FileCheck size={16} className="text-[#5A5B4C]" />
          Summary of Recorded Checkpoints
        </h2>

        <div className="divide-y divide-[#E6E6DE]">
          {project.questions.map((q, idx) => (
            <div key={q.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#5A5B4C]">Q{idx + 1}</span>
                  <span className="font-bold text-[#1F201B]">{q.shortTitle || q.question}</span>
                </div>
                <p className="text-[#3A3B34] bg-[#F4F4F0] p-2.5 rounded-xl border border-[#E6E6DE]">
                  {q.answer || (
                    <span className="italic text-[#6B6C62]">
                      {q.status === 'answered'
                        ? 'Answered and saved. The text is not shown again after a reload.'
                        : q.status === 'skipped'
                          ? 'Skipped.'
                          : q.status === 'unknown'
                            ? "Marked as \"I don't know\"."
                            : 'No answer recorded.'}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRevisitQuestion(idx)}
                className="p-1.5 text-[#62635A] hover:text-[#1F201B] hover:bg-[#F4F4F0] rounded-lg shrink-0 mt-1"
                title="Edit response"
                aria-label="Edit response"
              >
                <Edit3 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#E6E6DE] flex items-center justify-between">
          <p className="text-xs text-[#62635A]">
            {answered} answered, {skipped} skipped, {unknown} unknown.
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft flex items-center gap-1.5"
          >
            <Send size={13} />
            Submit Answers to Team Lead
          </button>
        </div>
      </div>
    </div>
  );
}
