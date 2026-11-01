'use client';

import React, { useState } from 'react';
import { useHandover } from '@/context/HandoverContext';
import { ProjectHandover } from '@/types';
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
  X,
} from 'lucide-react';

// ─── Stat Card ──────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white border border-[#E5EAF1] rounded-xl p-5 flex items-start gap-4 shadow-card">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-navy-800">{value}</p>
        <p className="text-sm text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Evidence Badge ─────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    'Active Handover': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Active' },
    'In Progress': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'In Progress' },
    Approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
    Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
    'Pre-release': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Pre-release' },
  };
  const s = map[status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─── Create Handover Modal ──────────────────────────────
function CreateHandoverModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<ProjectHandover>) => void }) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    objectives: string;
    techStack: string;
    status: 'In Progress' | 'Pre-release' | 'Active Handover' | 'Approved' | 'Completed';
    departingMember: string;
    departingRole: string;
    incomingMember: string;
    githubRepo: string;
  }>({
    name: '',
    description: '',
    objectives: '',
    techStack: '',
    status: 'In Progress',
    departingMember: 'Alex Chen',
    departingRole: 'Backend Developer',
    incomingMember: 'Priya Sharma',
    githubRepo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.objectives.trim()) newErrors.objectives = 'Objectives are required';
    if (!formData.techStack.trim()) newErrors.techStack = 'Technology stack is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onCreate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-start justify-center pt-12 px-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-[#E5EAF1] shadow-xl w-full max-w-2xl mb-12">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAF1]">
          <div>
            <h2 className="text-lg font-semibold text-navy-800">Create New Handover</h2>
            <p className="text-sm text-muted">Provide project details to generate AI questions</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-muted hover:text-navy-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Project Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 transition-colors ${errors.name ? 'border-red-300' : 'border-[#E5EAF1]'}`}
              placeholder="e.g. Smart Healthcare Management System"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Project Description <span className="text-red-500">*</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 transition-colors ${errors.description ? 'border-red-300' : 'border-[#E5EAF1]'}`}
              placeholder="Describe what this project does and its key components..."
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Project Objectives <span className="text-red-500">*</span></label>
            <textarea
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              rows={2}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 transition-colors ${errors.objectives ? 'border-red-300' : 'border-[#E5EAF1]'}`}
              placeholder="What are the key goals and deliverables?"
            />
            {errors.objectives && <p className="text-xs text-red-500 mt-1">{errors.objectives}</p>}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Technology Stack <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.techStack}
                onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 transition-colors ${errors.techStack ? 'border-red-300' : 'border-[#E5EAF1]'}`}
                placeholder="Python, FastAPI, PostgreSQL..."
              />
              {errors.techStack && <p className="text-xs text-red-500 mt-1">{errors.techStack}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Current Status</label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF1] text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500 transition-colors"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Pre-release">Pre-release</option>
                  <option value="Active Handover">Active Handover</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Team members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Departing Member</label>
              <select
                value={formData.departingMember}
                onChange={(e) => setFormData({ ...formData, departingMember: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF1] text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500"
              >
                <option>Alex Chen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Member&apos;s Role</label>
              <select
                value={formData.departingRole}
                onChange={(e) => setFormData({ ...formData, departingRole: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF1] text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500"
              >
                <option>Backend Developer</option>
                <option>Frontend Developer</option>
                <option>Full Stack Developer</option>
                <option>DevOps Engineer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-800 mb-1.5">Incoming Member</label>
              <select
                value={formData.incomingMember}
                onChange={(e) => setFormData({ ...formData, incomingMember: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF1] text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500"
              >
                <option>Priya Sharma</option>
              </select>
            </div>
          </div>

          {/* GitHub Repo */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">GitHub Repository</label>
            <div className="relative">
              <GitBranch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="url"
                value={formData.githubRepo}
                onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#E5EAF1] text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-500"
                placeholder="https://github.com/org/repo"
              />
            </div>
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Project Documents</label>
            <div className="border border-dashed border-[#E5EAF1] rounded-lg p-6 text-center hover:border-brand-300 transition-colors cursor-pointer">
              <Upload size={20} className="mx-auto text-muted mb-2" />
              <p className="text-sm text-muted">Drag and drop files, or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">PDF, MD, DOCX up to 10MB each</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-navy-800 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors flex items-center gap-2">
              <Plus size={16} />
              Create Handover
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard Screen ──────────────────────────────
export function Screen1TeamLeadDashboard() {
  const { project, dashboardMetrics, createNewProject, setActiveScreen } = useHandover();
  const [showCreate, setShowCreate] = useState(false);

  const answeredCount = project.questions.filter((q) => q.status === 'answered').length;
  const totalQuestions = project.questions.length;
  const openGaps = project.gaps.filter((g) => g.status === 'open').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-800">Welcome back, Kishan</h2>
          <p className="text-sm text-muted mt-0.5">Here&apos;s an overview of your project handovers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors"
        >
          <Plus size={16} />
          Create Handover
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={dashboardMetrics.totalProjects} icon={<FolderKanban size={20} className="text-brand-600" />} accent="bg-brand-50" />
        <StatCard label="Pending Handovers" value={dashboardMetrics.pendingHandovers} icon={<Clock size={20} className="text-amber-600" />} accent="bg-amber-50" />
        <StatCard label="Awaiting Approval" value={dashboardMetrics.awaitingApproval} icon={<AlertCircle size={20} className="text-orange-600" />} accent="bg-orange-50" />
        <StatCard label="Completed" value={dashboardMetrics.completedHandovers} icon={<CheckCircle2 size={20} className="text-green-600" />} accent="bg-green-50" />
      </div>

      {/* Active Handover Detail */}
      <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card">
        <div className="px-6 py-4 border-b border-[#E5EAF1] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-navy-800">Active Handovers</h3>
            <p className="text-sm text-muted">Current project knowledge transfers</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5EAF1]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Project</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Departing</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Incoming</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Progress</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Gaps</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E5EAF1] hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800">{project.name}</p>
                      <p className="text-xs text-muted">{project.techStack}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-50 text-red-700 flex items-center justify-center text-xs font-bold">AC</div>
                    <span className="text-sm text-navy-700">{project.departingMember}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-xs font-bold">PS</div>
                    <span className="text-sm text-navy-700">{project.incomingMember}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all"
                        style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">{answeredCount}/{totalQuestions}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {openGaps > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                      <AlertCircle size={12} /> {openGaps} open
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">All resolved</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setActiveScreen('review')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    Review <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* Recent Questions Activity */}
        <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card p-5">
          <h4 className="text-sm font-semibold text-navy-800 mb-4">Recent Question Activity</h4>
          <div className="space-y-3">
            {project.questions
              .filter((q) => q.status === 'answered')
              .slice(0, 3)
              .map((q) => (
                <div key={q.id} className="flex items-start gap-3 pb-3 border-b border-[#E5EAF1] last:border-0 last:pb-0">
                  <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-navy-700 line-clamp-1">{q.question}</p>
                    <p className="text-xs text-muted mt-0.5">Answered by {project.departingMember}</p>
                  </div>
                </div>
              ))}
            {project.questions.filter((q) => q.status === 'answered').length === 0 && (
              <p className="text-sm text-muted text-center py-4">No questions answered yet</p>
            )}
          </div>
        </div>

        {/* Open Gaps */}
        <div className="bg-white border border-[#E5EAF1] rounded-xl shadow-card p-5">
          <h4 className="text-sm font-semibold text-navy-800 mb-4">Open Gaps</h4>
          <div className="space-y-3">
            {project.gaps
              .filter((g) => g.status === 'open')
              .map((g) => (
                <div key={g.id} className="flex items-start gap-3 pb-3 border-b border-[#E5EAF1] last:border-0 last:pb-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${g.risk === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    <AlertCircle size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-navy-700 line-clamp-1">{g.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs font-medium ${g.risk === 'High' ? 'text-red-600' : 'text-amber-600'}`}>{g.risk} risk</span>
                      <span className="text-xs text-muted">• {g.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            {project.gaps.filter((g) => g.status === 'open').length === 0 && (
              <p className="text-sm text-muted text-center py-4">No open gaps — looking good!</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateHandoverModal
          onClose={() => setShowCreate(false)}
          onCreate={createNewProject}
        />
      )}
    </div>
  );
}
