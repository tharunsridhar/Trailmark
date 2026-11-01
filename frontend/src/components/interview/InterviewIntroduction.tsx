'use client';

import React from 'react';
import { useHandover } from '@/context/HandoverContext';
import {
  Compass,
  ArrowRight,
  Clock,
  HelpCircle,
  Mic,
  FileText,
  ShieldCheck,
  CheckCircle2,
  FolderGit2,
  User,
  Sparkles,
} from 'lucide-react';

export function InterviewIntroduction() {
  const { project, setActiveScreen } = useHandover();

  const totalQuestions = project.questions.length;
  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-6">
        <span>Trailmark</span>
        <span>/</span>
        <span>Knowledge Handover</span>
        <span>/</span>
        <span className="text-[#0F172A] font-semibold">{project.name}</span>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-7 sm:p-9 shadow-sm">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-brand-600 border border-blue-100">
            <Sparkles size={13} />
            AI-Guided Handover Interview
          </span>
          <span className="text-xs font-medium text-[#64748B]">
            Assigned to {project.departingMember}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-3">
          Project Knowledge Handover Interview
        </h1>
        <p className="text-sm text-[#64748B] leading-relaxed mb-8">
          Before your transition, Trailmark captures critical architectural decisions, undocumented workflows, dependencies, and unfinished milestones to ensure a seamless succession for{' '}
          <strong className="text-[#0F172A]">{project.incomingMember}</strong>.
        </p>

        {/* Project & Role Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl bg-slate-50 border border-[#E2E8F0] mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] mb-1">
              <FolderGit2 size={13} className="text-brand-600" />
              Project Name
            </div>
            <p className="text-sm font-bold text-[#0F172A]">{project.name}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] mb-1">
              <User size={13} className="text-brand-600" />
              Interview For & Role
            </div>
            <p className="text-sm font-bold text-[#0F172A]">
              {project.departingMember}{' '}
              <span className="text-xs font-medium text-[#64748B]">({project.departingRole})</span>
            </p>
          </div>

          <div className="sm:col-span-2 pt-3 border-t border-[#E2E8F0]/60">
            <div className="text-xs font-semibold text-[#64748B] mb-1">Project Overview</div>
            <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="sm:col-span-2 pt-2">
            <div className="text-xs font-semibold text-[#64748B] mb-1">Core Tech Stack</div>
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.split(',').map((tech) => (
                <span
                  key={tech.trim()}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[11px] font-medium text-[#0F172A]"
                >
                  {tech.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Checkpoint Stats & Capabilities */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-1.5 text-brand-600 text-xs font-semibold mb-1">
              <HelpCircle size={14} />
              Questions
            </div>
            <p className="text-lg font-bold text-[#0F172A]">{totalQuestions} Checkpoints</p>
            <p className="text-[11px] text-[#64748B]">Role-targeted</p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold mb-1">
              <Clock size={14} />
              Duration
            </div>
            <p className="text-lg font-bold text-[#0F172A]">~15 mins</p>
            <p className="text-[11px] text-[#64748B]">At your pace</p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold mb-1">
              <FileText size={14} />
              Text Option
            </div>
            <p className="text-lg font-bold text-[#0F172A]">Available</p>
            <p className="text-[11px] text-[#64748B]">Guided editor</p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold mb-1">
              <Mic size={14} />
              Voice Option
            </div>
            <p className="text-lg font-bold text-[#0F172A]">Available</p>
            <p className="text-[11px] text-[#64748B]">Auto-transcribed</p>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 mb-8 text-xs text-blue-900 leading-relaxed">
          <ShieldCheck size={18} className="text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-950">Team Lead Review Workflow: </span>
            Answers provided here will be organized and forwarded to{' '}
            <strong>Kishan S (Team Lead)</strong> for verification against source repositories and documentation before publication to your successor.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
          <div className="text-xs text-[#64748B]">
            {answeredCount > 0 ? (
              <span className="font-medium text-emerald-600">
                You have previously saved {answeredCount} of {totalQuestions} questions.
              </span>
            ) : (
              <span>You can pause and resume the interview anytime.</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('interview')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:gap-3"
          >
            <span>{answeredCount > 0 ? 'Resume Interview' : 'Start Handover Interview'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

