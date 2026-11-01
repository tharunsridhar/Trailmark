'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { Question } from '@/types';
import {
  MessageSquareText,
  CheckCircle2,
  SkipForward,
  HelpCircle,
  Save,
  Send,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Question Card ──────────────────────────────────────
function QuestionCard({
  question,
  index,
  onSave,
  onSkip,
  onDontKnow,
}: {
  question: Question;
  index: number;
  onSave: (id: string, answer: string) => void;
  onSkip: (id: string) => void;
  onDontKnow: (id: string) => void;
}) {
  const [answer, setAnswer] = useState(question.answer || '');
  const [expanded, setExpanded] = useState(question.status === 'pending');

  const statusConfig = {
    pending: { icon: <Clock size={14} />, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
    answered: { icon: <CheckCircle2 size={14} />, bg: 'bg-green-50', text: 'text-green-700', label: 'Answered' },
    skipped: { icon: <SkipForward size={14} />, bg: 'bg-gray-50', text: 'text-gray-600', label: 'Skipped' },
    unknown: { icon: <HelpCircle size={14} />, bg: 'bg-red-50', text: 'text-red-700', label: "Don't Know" },
  };

  const s = statusConfig[question.status];

  return (
    <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card overflow-hidden">
      {/* Question Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-navy-800 leading-relaxed">{question.question}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              {s.icon} {s.label}
            </span>
            <span className="text-xs text-muted">{question.roleTarget}</span>
          </div>
        </div>
        <span className="text-muted shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-[#E5EAF1]">
          {/* AI Reason */}
          <div className="bg-brand-50/50 rounded-lg p-3 mt-4 mb-4">
            <p className="text-xs font-medium text-brand-700 mb-1">Why this question was generated</p>
            <p className="text-xs text-brand-600 leading-relaxed">{question.reason}</p>
          </div>

          {/* Answer Area */}
          {question.status !== 'unknown' && (
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Your Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF1] text-sm bg-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 transition-colors"
                placeholder="Provide your answer with as much relevant context as possible..."
                disabled={question.status === 'skipped'}
              />

              {/* Actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSkip(question.id)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-muted hover:text-navy-800 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    disabled={question.status === 'answered'}
                  >
                    <SkipForward size={14} /> Skip
                  </button>
                  <button
                    onClick={() => onDontKnow(question.id)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle size={14} /> I Don&apos;t Know
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (answer.trim()) onSave(question.id, answer.trim());
                  }}
                  disabled={!answer.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={14} /> Save Answer
                </button>
              </div>
            </div>
          )}

          {question.status === 'unknown' && (
            <div className="bg-red-50 rounded-lg p-3 mt-4 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-700">Marked as unknown</p>
                <p className="text-xs text-red-600">This has been flagged as a gap for the Team Lead to review.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ────────────────────────────────────────
export function Screen2DepartingQuestions() {
  const { project, saveAnswer, skipQuestion, markDontKnow, submitDepartingAnswers, setActiveScreen } = useHandover();

  const questions = project.questions;
  const answeredCount = questions.filter((q) => q.status === 'answered').length;
  const pendingCount = questions.filter((q) => q.status === 'pending').length;
  const totalCount = questions.length;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const allDone = pendingCount === 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-800">AI-Generated Questions</h2>
        <p className="text-sm text-muted mt-1">
          Answer these questions about <span className="font-medium text-navy-700">{project.name}</span>. The AI generated them based on your project role and source analysis.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-navy-800">Your Progress</span>
          <span className="text-sm font-semibold text-brand-600">{progressPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted">
          <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> {answeredCount} answered</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500" /> {pendingCount} pending</span>
          <span className="flex items-center gap-1"><SkipForward size={12} className="text-gray-400" /> {questions.filter(q => q.status === 'skipped').length} skipped</span>
          <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-red-500" /> {questions.filter(q => q.status === 'unknown').length} unknown</span>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            onSave={saveAnswer}
            onSkip={skipQuestion}
            onDontKnow={markDontKnow}
          />
        ))}
      </div>

      {/* Submit */}
      {allDone && (
        <div className="mt-6 bg-white border border-[#E5EAF1] rounded-xl shadow-card p-5 text-center">
          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-navy-800">All questions addressed</h3>
          <p className="text-sm text-muted mt-1 mb-4">Your responses have been saved. Submit for Team Lead review.</p>
          <button
            onClick={() => {
              submitDepartingAnswers();
              setActiveScreen('my-handover-departing');
            }}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors inline-flex items-center gap-2"
          >
            <Send size={16} /> Submit for Review
          </button>
        </div>
      )}
    </div>
  );
}
