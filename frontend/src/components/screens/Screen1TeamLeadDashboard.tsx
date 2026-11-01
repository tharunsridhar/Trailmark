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
      shortTitle: 'Payment Retry Architecture',
      question: 'Why was the payment and insurance retry policy rewritten to exponential backoff without a circuit breaker?',
      reason: 'Identified in commit c8e92a1 on PR #104. No Architecture Decision Record (ADR) documented why the circuit breaker was dropped.',
    },
    {
      category: 'API Development',
      shortTitle: 'Emergency Token Expiration',
      question: 'What is the token expiration strategy for emergency clinical access endpoints and how is security maintained?',
      reason: 'Conflicting timestamps detected between PR #88 (15 mins) and Slack sync discussion #dev-core (1 hour request).',
    },
    {
      category: 'Dependencies & Credentials',
      shortTitle: 'Celery Workers & AWS S3 IAM',
      question: 'Who owns the Celery worker deployment scripts and AWS S3 credentials for HIPAA archives?',
      reason: 'Unowned cron jobs found in deploy/workers/celery.sh referencing restricted bucket `med-archive-vault-prod`.',
    },
    {
      category: 'Pending Tasks',
      shortTitle: 'HL7-to-FHIR Transformer Status',
      question: 'What is the current status of the HL7-to-FHIR payload conversion parser, and what remains unfinished?',
      reason: 'Task card #342 was marked "In Progress" for 3 weeks with no subsequent commit linked in main branch.',
    },
    {
      category: 'Risks & Vulnerabilities',
      shortTitle: 'Staging Twilio Credentials',
      question: 'Are there any unencrypted staging credentials in the notification dispatch service that require rotation before departure?',
      reason: 'Found placeholder comment "// TODO: Migrate Twilio dev keys to Vault" in services/notify.py:44.',
    },
  ],
  'Frontend Developer': [
    {
      category: 'Backend Architecture',
      shortTitle: 'Next.js App Router State Hydration',
      question: 'How are clinical session states synchronized between Next.js client components and backend WebSocket streams?',
      reason: 'PR #112 altered real-time vital update subscriptions without client-side reconnect throttling.',
    },
    {
      category: 'API Development',
      shortTitle: 'FHIR Client Form Validation',
      question: 'Which custom validation hooks govern patient intake forms before sending payloads to the FastAPI endpoints?',
      reason: 'Issue #204 noted validation mismatches between frontend schemas and FHIR R4 schema definitions.',
    },
    {
      category: 'Pending Tasks',
      shortTitle: 'Unfinished Patient Discharge Screen',
      question: 'What work remains on the multi-step patient discharge workflow before Priya takes over the frontend repo?',
      reason: 'Branch `feat/discharge-flow` has 3 unmerged PR comments and pending mock fixtures.',
    },
  ],
  'DevOps Engineer': [
    {
      category: 'Dependencies & Credentials',
      shortTitle: 'Ansible Vault & Secret Rotation',
      question: 'Where are master decryption keys for staging and production Ansible vaults stored, and who has access?',
      reason: 'Automated scan detected deploy scripts relying on local developer environment variables.',
    },
    {
      category: 'Technical Decisions',
      shortTitle: 'Redis Cluster Failover & Backup',
      question: 'How is automated failover configured for the Redis vitals streaming broker in production Kubernetes pods?',
      reason: 'Codebase ADR-02 outlines single-node fallback without replication monitoring.',
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
                  placeholder="e.g. Smart Healthcare Management System"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E6DE] bg-white text-xs text-[#1F201B] placeholder-[#A2A399] focus:outline-none focus:ring-1 focus:ring-[#5A5B4C] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F201B] mb-1.5">Technology Stack</label>
                <input
                  type="text"
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  placeholder="e.g. Python, FastAPI, PostgreSQL, Redis, Celery"
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
                  placeholder="https://github.com/trailmark-org/smart-healthcare-core"
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
                placeholder="Describe critical services, HIPAA mandates, and transition milestones..."
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
                  Loaded: ADR-04.md, Patient_Ingestion_SOP.pdf, Slack_Export.json
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
