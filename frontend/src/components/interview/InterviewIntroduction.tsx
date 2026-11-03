'use client';

import React, { useEffect } from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  Compass,
  ArrowRight,
  Clock,
  HelpCircle,
  Mic,
  FileText,
  ShieldCheck,
  FolderGit2,
  User,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function InterviewIntroduction() {
  const {
    project,
    setActiveScreen,
    loadQuestions,
    questionsLoading,
    activeHandoverId,
    authUser,
  } = useHandover();

  // Refetch questions once login completes or when active handover changes
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions, activeHandoverId, authUser]);

  const totalQuestions = project.questions.length;
  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;

  if (questionsLoading && totalQuestions === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center select-none text-center">
        <Loader2 size={32} className="animate-spin text-[#5A5B4C] mb-3" />
        <h3 className="text-base font-bold text-[#1F201B]">Loading Handover Checkpoints...</h3>
        <p className="text-xs text-[#7A7B72] mt-1">Retrieving assigned interview questions for your session.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 select-none">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E6E6DE] shadow-soft space-y-8">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F4F0] text-[#5A5B4C]">
            <Sparkles size={12} />
            AI Handover Agent
          </span>
          <span className="text-xs text-[#62635A]">
            Assigned: {project.departingMember}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F201B] mb-2">
            Project Knowledge Handover
          </h1>
          <p className="text-xs sm:text-sm text-[#62635A] leading-relaxed">
            The AI agent formulated questions from repository commits, PR reviews, and ADR documents to ensure complete transition of your backend components to <strong className="text-[#1F201B]">{project.incomingMember}</strong>.
          </p>
        </div>

        {/* Project Card in reference style */}
        <div className="p-6 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[#62635A] font-semibold mb-0.5">Project</p>
              <p className="font-bold text-[#1F201B]">{project.name}</p>
            </div>
            <div>
              <p className="text-[#62635A] font-semibold mb-0.5">Role</p>
              <p className="font-bold text-[#1F201B]">{project.departingRole}</p>
            </div>
          </div>

          <div className="text-xs pt-2 border-t border-[#E6E6DE]">
            <p className="text-[#62635A] font-semibold mb-0.5">Scope & Tech Stack</p>
            <p className="text-[#3A3B34] leading-relaxed">{project.techStack}</p>
          </div>
        </div>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] shadow-2xs">
            <span className="text-[#62635A]">Checkpoints</span>
            <p className="text-base font-bold text-[#1F201B] mt-0.5">{totalQuestions} Questions</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] shadow-2xs">
            <span className="text-[#62635A]">Pacing</span>
            <p className="text-base font-bold text-[#1F201B] mt-0.5">~15 mins</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] shadow-2xs">
            <span className="text-[#62635A]">Text Option</span>
            <p className="text-base font-bold text-[#1F201B] mt-0.5">Full Editor</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] shadow-2xs">
            <span className="text-[#62635A]">Voice Option</span>
            <p className="text-base font-bold text-[#1F201B] mt-0.5">Browser dictation</p>
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-4 border-t border-[#E6E6DE] flex items-center justify-between">
          <p className="text-xs text-[#62635A]">
            {answeredCount > 0 ? `${answeredCount} of ${totalQuestions} answered` : 'An answer is saved when you press Save Answer.'}
          </p>

          <button
            type="button"
            onClick={() => setActiveScreen('interview')}
            className="px-6 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition-all"
          >
            <span>{answeredCount > 0 ? 'Resume Interview' : 'Start Handover Interview'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
