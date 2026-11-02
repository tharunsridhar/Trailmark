'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { ProjectHandover, QuestionCategory } from '@/types';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  FileText,
  GitBranch,
  Upload,
  ChevronDown,
  Sparkles,
  Layers,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  Compass,
} from 'lucide-react';

// Role-specific AI questions grounded in backend codebase pipeline
const ROLE_QUESTION_TEMPLATES: Record<string, { category: QuestionCategory; shortTitle: string; question: string; reason: string }[]> = {
  'Backend Developer': [
    {
      category: 'Backend Architecture',
      shortTitle: 'SQLite WAL Database Choice',
      question: 'Why was the database configured as SQLite in WAL mode instead of PostgreSQL for the initial campus launch?',
      reason: 'Identified in docs/architecture_overview.md section 1. Team chose SQLite with WAL mode to avoid database hosting costs during student pilot.',
    },
    {
      category: 'Technical Decisions',
      shortTitle: 'Render vs Heroku Hosting',
      question: 'Why did the engineering team select Render over Heroku for hosting the API and worker daemons?',
      reason: 'Identified in chat/chat.json message 5. Team chose Render over Heroku because of the free tier and cheaper background workers.',
    },
    {
      category: 'API Development',
      shortTitle: 'Session Token Expiry Conflict',
      question: 'What is the token expiration strategy for student sessions, and why is there a conflict between commit c18d402 (60 mins) and Deepak\'s mandate (15 mins)?',
      reason: 'Conflicting values detected: commit c18d402 set ACCESS_TOKEN_EXPIRE_MINUTES = 60, while chat message 17 mandates 15 minutes.',
    },
    {
      category: 'Pending Tasks',
      shortTitle: 'Multi-tier Ticket PR #4',
      question: 'What is the current status of the multi-tier ticket tiering and student discounts feature in PR #4?',
      reason: 'PR #4 has been open since late August with unaddressed merge conflicts in app/api/discounts.py.',
    },
    {
      category: 'Dependencies & Credentials',
      shortTitle: 'Unowned Task T05: S3 Backups',
      question: 'Who owns task T05 (automated daily database backup to S3) and where are the AWS credentials stored?',
      reason: 'Task T05 is unassigned on the task board and no S3 backup script exists in the repository.',
    },
    {
      category: 'Risks & Vulnerabilities',
      shortTitle: 'Mobile QR Scanner Benchmark',
      question: 'What is the verification status of the mobile QR ticket scanner benchmark where you claimed 5,000 scans per minute with zero errors?',
      reason: 'Claimed in chat message 32 that scanner handled 5,000 scans/min, but no benchmark script or log exists in repo.',
    },
  ],
  'Frontend Developer': [
    {
      category: 'Backend Architecture',
      shortTitle: 'Tailwind CSS Migration',
      question: 'Why was the student portal redesigned with Tailwind CSS instead of Chakra UI, and are there legacy components?',
      reason: 'docs/meeting_notes_august.md notes decision to switch to Tailwind to eliminate runtime Emotion CSS overhead.',
    },
    {
      category: 'API Development',
      shortTitle: 'Ticket QR Code Scanner Integration',
      question: 'How does the mobile check-in view handle HMAC-SHA256 verification when validating attendee QR tokens offline?',
      reason: 'Contradiction found between raw UUID v4 in task T08 and HMAC payload in architecture_overview.md.',
    },
    {
      category: 'Pending Tasks',
      shortTitle: 'Auditorium Seating Selector',
      question: 'What remains to be completed on the 350-seat auditorium visual layout selector in PR #5?',
      reason: 'PR #5 caps capacity at 350 while architecture doc specifies 500 attendees.',
    },
  ],
  'DevOps Engineer': [
    {
      category: 'Dependencies & Credentials',
      shortTitle: 'Render Worker Daemon & Celery',
      question: 'How is the ReportLab PDF badge rendering worker managed on Render, and what happens if Redis restarts?',
      reason: 'Worker daemon script deploy/worker_daemon.py does not define an automatic restart watchdog in Render config.',
    },
    {
      category: 'Risks & Vulnerabilities',
      shortTitle: 'CAMPUS_PAY_SECRET Missing Secret',
      question: 'Where is CAMPUS_PAY_SECRET provisioned for payment webhook verification, and why is it absent from deployment_guide.md?',
      reason: 'api/payments.py reads CAMPUS_PAY_SECRET from env, but no instructions or key rotation notes exist.',
    },
  ],
};

export function Screen1TeamLeadDashboard() {
  const { project, dashboardMetrics, createNewProject, setActiveScreen } = useHandover();

  // Create Handover Form State (following the attached reference layout)
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    objectives: project.objectives,
    techStack: project.techStack,
    departingMember: project.departingMember,
    departingRole: project.departingRole,
    incomingMember: project.incomingMember,
    githubRepo: project.githubRepo,
  });

  const [isSavedBanner, setIsSavedBanner] = useState(false);

  // Dynamically generated preview of AI questions for selected role
  const activeQuestionsPreview =
    ROLE_QUESTION_TEMPLATES[formData.departingRole] || ROLE_QUESTION_TEMPLATES['Backend Developer'];

  const handleRoleChange = (newRole: string) => {
    setFormData((prev) => ({ ...prev, departingRole: newRole }));
  };

  const handleSaveAndGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    createNewProject({
      name: formData.name,
      description: formData.description,
      objectives: formData.objectives,
      techStack: formData.techStack,
      departingMember: formData.departingMember,
      departingRole: formData.departingRole,
      incomingMember: formData.incomingMember,
      githubRepo: formData.githubRepo,
    });
    setIsSavedBanner(true);
    setTimeout(() => setIsSavedBanner(false), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Success feedback pill */}
      {isSavedBanner && (
        <div className="p-4 rounded-2xl bg-white border border-[#E6E6DE] text-xs font-semibold text-[#5A5B4C] flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#5A5B4C]" />
            <span>Handover project updated. AI questions have been generated based on {formData.departingRole} codebase analysis.</span>
          </div>
          <button
            onClick={() => setActiveScreen('review')}
            className="text-xs underline font-bold hover:text-[#1F201B]"
          >
            Go to Review
          </button>
        </div>
      )}

      {/* Top Action Bar matching reference: Page Title / Save Draft / Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1F201B]">Project Knowledge Handover</h2>
          <p className="text-xs text-[#7A7B72] mt-0.5">
            Configure project details and let the AI agent extract role-specific questions from repository evidence.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveScreen('review')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-white border border-[#E6E6DE] text-xs font-medium text-[#3A3B34] hover:bg-[#EAEAE2] transition-colors shadow-2xs"
          >
            Review & Approve
          </button>
          <button
            type="button"
            onClick={handleSaveAndGenerate}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            Generate AI Questions
          </button>
        </div>
      </div>

      {/* Summary KPI Strip in Warm SaaS Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#7A7B72] font-medium">Active Handovers</p>
          <p className="text-2xl font-bold text-[#1F201B] mt-1">{dashboardMetrics.pendingHandovers}</p>
          <p className="text-[11px] text-[#5A5B4C] mt-1 font-medium">In transition pipeline</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#7A7B72] font-medium">AI Questions Posed</p>
          <p className="text-2xl font-bold text-[#1F201B] mt-1">{project.questions.length}</p>
          <p className="text-[11px] text-[#7A7B72] mt-1">
            {project.questions.filter((q) => q.status === 'answered').length} answered by {project.departingMember}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#7A7B72] font-medium">Gaps & Unknowns</p>
          <p className="text-2xl font-bold text-[#5A5B4C] mt-1">
            {project.gaps.filter((g) => g.status === 'open').length}
          </p>
          <p className="text-[11px] text-[#7A7B72] mt-1">Requiring lead review</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E6E6DE] shadow-soft">
          <p className="text-xs text-[#7A7B72] font-medium">Handover Status</p>
          <p className="text-base font-bold text-[#1F201B] mt-1 truncate">{project.status}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {project.isApproved ? 'Approved by Team Lead' : 'Awaiting Final Approval'}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout from Reference Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Project & Handover Configuration Form */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-7 border border-[#E6E6DE] shadow-soft space-y-6">
          <div>
            <h3 className="text-base font-bold text-[#1F201B]">Handover Setup</h3>
            <p className="text-xs text-[#7A7B72] mt-0.5">
              Enter the departing member&apos;s role and repository context. The AI agent analyzes this metadata to generate targeted technical checkpoints.
            </p>
          </div>

          <form onSubmit={handleSaveAndGenerate} className="space-y-5">
            {/* Row 1: Project Name & Tech Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Campus Events App"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Technology Stack</label>
                <input
                  type="text"
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  placeholder="e.g. Python, FastAPI, SQLite (WAL), Render, Celery, ReportLab"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] transition-all"
                />
              </div>
            </div>

            {/* Row 2: Departing Member & Role (triggers role-specific AI questions) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Departing Member</label>
                <input
                  type="text"
                  value={formData.departingMember}
                  onChange={(e) => setFormData({ ...formData, departingMember: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">
                  Departing Role <span className="text-[#5A5B4C] font-normal">(AI Target)</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.departingRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] appearance-none focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
                  >
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A7B72] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Successor (Incoming)</label>
                <input
                  type="text"
                  value={formData.incomingMember}
                  onChange={(e) => setFormData({ ...formData, incomingMember: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B]"
                />
              </div>
            </div>

            {/* GitHub Repo */}
            <div>
              <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">GitHub Repository URL</label>
              <div className="relative">
                <GitBranch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7B72]" />
                <input
                  type="url"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                  placeholder="https://github.com/campus-synthetic/events-app"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C]"
                />
              </div>
            </div>

            {/* Project Scope & Objectives */}
            <div>
              <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Project Description & Scope</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Describe critical backend services, ticket webhook retries, and transition milestones..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] resize-none leading-relaxed"
              />
            </div>

            {/* Upload Area styled exactly like reference screenshot */}
            <div>
              <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Architecture Documents & Task Exports</label>
              <div className="border border-dashed border-[#DCDCD2] rounded-2xl p-6 text-center hover:bg-[#FAF9F6] transition-colors cursor-pointer bg-white">
                <div className="w-10 h-10 rounded-xl bg-[#F4F4F0] flex items-center justify-center mx-auto mb-2 text-[#5A5B4C]">
                  <Upload size={18} />
                </div>
                <p className="text-xs font-medium text-[#1F201B]">
                  Upload project files, or <span className="underline text-[#5A5B4C]">browse</span>
                </p>
                <p className="text-[11px] text-[#A2A399] mt-0.5">
                  Loaded: architecture_overview.md, deployment_guide.md, meeting_notes_august.md, tasks.csv, chat.json
                </p>
              </div>
            </div>

            {/* Bottom Actions matching reference: Cancel / Save Changes */}
            <div className="pt-4 border-t border-[#E6E6DE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveScreen('dashboard')}
                className="px-6 py-2.5 rounded-full border border-[#E6E6DE] bg-white text-xs font-medium text-[#7A7B72] hover:bg-[#EAEAE2] transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-7 py-2.5 rounded-full bg-[#5A5B4C] hover:bg-[#4A4B3E] text-white text-xs font-semibold shadow-soft transition-all"
              >
                Save Handover & Update AI Agent
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (4 cols): AI Agent Question Preview based on Role & Backend Data */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E6E6DE] shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F201B] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#5A5B4C]" />
              AI Question Agent
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F4F0] text-[#5A5B4C]">
              {formData.departingRole}
            </span>
          </div>

          <p className="text-xs text-[#7A7B72] leading-relaxed">
            The AI engine inspects repository commits, ADR documents, and task boards to formulate questions for{' '}
            <strong className="text-[#1F201B]">{formData.departingMember}</strong>.
          </p>

          <div className="space-y-3 pt-2">
            {activeQuestionsPreview.map((q, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#F4F4F0] border border-[#E6E6DE] text-xs space-y-1.5 hover:bg-[#EAEAE2] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#5A5B4C] uppercase tracking-wider">
                    {q.category}
                  </span>
                  <span className="text-[10px] text-[#A2A399]">Q{idx + 1}</span>
                </div>
                <p className="font-semibold text-[#1F201B] leading-snug">{q.question}</p>
                <p className="text-[11px] text-[#7A7B72] leading-relaxed italic">
                  Why: {q.reason}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveScreen('review')}
              className="w-full py-2.5 rounded-full bg-white border border-[#E6E6DE] hover:bg-[#F4F4F0] text-xs font-semibold text-[#3A3B34] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Review & Verification</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
