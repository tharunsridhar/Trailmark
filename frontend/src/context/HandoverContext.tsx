'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  ProjectHandover,
  UserProfile,
  Question,
  Gap,
  Statement,
  EvidenceStatus,
  EvidencePiece,
  QuestionCategory,
  FollowUpQuestion,
} from '@/types';

export const DEMO_USERS: Record<Role, UserProfile> = {
  lead: {
    id: 'user-lead',
    name: 'Deepak',
    role: 'lead',
    roleTitle: 'Engineering Lead & Reviewer',
    avatar: 'D',
    email: 'deepak-lead@campus-synthetic.internal',
  },
  departing: {
    id: 'user-departing',
    name: 'Asha',
    role: 'departing',
    roleTitle: 'Senior Backend Developer (Leaver)',
    avatar: 'A',
    email: 'asha@campus-synthetic.internal',
  },
  incoming: {
    id: 'user-incoming',
    name: 'Kiran',
    role: 'incoming',
    roleTitle: 'Software Engineer (Successor)',
    avatar: 'K',
    email: 'kiran@campus-synthetic.internal',
  },
};

const SYNTHETIC_PROJECT: ProjectHandover = {
  id: 'proj-campus-01',
  name: 'Campus Events App',
  description:
    'Campus event ticketing, live student registration portal, and background ReportLab badge dispatch system for university student activities.',
  objectives:
    'Transition backend services to Kiran: SQLite WAL database, Render worker queues, ticket webhooks with exponential backoff, and resolve unowned tasks and PR conflicts.',
  techStack: 'Python, FastAPI, SQLite (WAL), Render, Celery, ReportLab, Tailwind CSS',
  status: 'Active Handover',
  departingMember: 'Asha',
  departingRole: 'Backend Developer',
  incomingMember: 'Kiran',
  githubRepo: 'https://github.com/campus-synthetic/events-app',
  documents: [
    'architecture_overview.md',
    'deployment_guide.md',
    'meeting_notes_august.md',
    'tasks.csv',
    'chat.json',
    'hr_private_notes.md',
  ],
  createdAt: '2026-07-16T10:00:00Z',
  updatedAt: '2026-09-28T16:30:00Z',
  isApproved: false,
  receipt: {
    acknowledged: false,
  },
  questions: [
    {
      id: 'q-1',
      category: 'Backend Architecture',
      shortTitle: 'SQLite WAL Database Choice',
      question:
        'Why was the database configured as SQLite in WAL mode instead of PostgreSQL for the initial campus launch?',
      reason:
        'Identified in docs/architecture_overview.md section 1. Team chose SQLite with WAL mode to avoid database hosting costs and simplify zero-configuration deployment during the student pilot.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer:
        'We chose SQLite with WAL mode over PostgreSQL for the initial campus MVP to avoid database hosting costs and simplify zero-configuration deployment during the student pilot. WAL mode allows concurrent readers alongside the registration writer.',
      evidenceStatus: 'verified',
      updatedAt: '2026-09-24T14:20:00Z',
      followUp: {
        id: 'fu-q-1',
        question:
          'What is the busy timeout setting configured in app/db.py to prevent "database is locked" errors during 200+ registration surges?',
        answer:
          'We added a busy_timeout of 15,000ms (15 seconds) in PR #1 connect args so write locks wait gracefully.',
        status: 'answered',
        answeredAt: '2026-09-24T14:25:00Z',
      },
    },
    {
      id: 'q-2',
      category: 'Technical Decisions',
      shortTitle: 'Render vs Heroku Hosting',
      question:
        'Why did the engineering team select Render over Heroku for hosting the API and worker daemons?',
      reason:
        'Identified in chat/chat.json message 5. Team chose Render over Heroku because of the free tier and cheaper background workers for our student budget.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer:
        'Team chose Render over Heroku because of the free tier and cheaper background workers for our student budget, plus direct integration with our GitHub repository preview branches.',
      evidenceStatus: 'verified',
      updatedAt: '2026-09-24T15:00:00Z',
    },
    {
      id: 'q-3',
      category: 'API Development',
      shortTitle: 'Session Token Expiry Conflict',
      question:
        'What is the token expiration strategy for student sessions, and why is there a conflict between commit c18d402 (60 mins) and Deepak\'s mandate (15 mins)?',
      reason:
        'Conflicting values detected: commit c18d402 set ACCESS_TOKEN_EXPIRE_MINUTES = 60, while chat message 17 mandates 15 minutes for campus compliance.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer:
        'I set it to 60 mins in commit c18d402 so students don\'t get logged out mid-checkout, but Deepak requested 15 mins for security compliance. We should add a background refresh endpoint before Kiran releases to production.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-09-24T16:15:00Z',
      followUp: {
        id: 'fu-q-3',
        question:
          'How are refresh tokens stored and revoked when a student logs out on a shared lab computer?',
        status: 'pending',
      },
    },
    {
      id: 'q-4',
      category: 'Pending Tasks',
      shortTitle: 'Multi-tier Ticket PR #4',
      question:
        'What is the current status of the multi-tier ticket tiering and student discounts feature in PR #4?',
      reason:
        'PR #4 has been open since late August with unaddressed merge conflicts in app/api/discounts.py and failing type checks.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer:
        'The discount calculation logic is implemented, but there is a merge conflict with master branch in app/api/discounts.py that needs to be resolved before merging. The schema models are in app/models/discounts.py.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-09-25T11:00:00Z',
    },
    {
      id: 'q-5',
      category: 'Dependencies & Credentials',
      shortTitle: 'Unowned Task T05: S3 Backups',
      question:
        'Who owns task T05 (automated daily database backup to S3) and where are the AWS credentials stored?',
      reason:
        'Task T05 is unassigned on the task board and no S3 backup script exists in the repository.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer:
        'Task T05 is currently unowned because I did not have AWS IAM credentials for the campus S3 bucket. Deepak needs to provision IAM keys for Kiran before launch.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-09-25T12:30:00Z',
    },
    {
      id: 'q-6',
      category: 'Risks & Vulnerabilities',
      shortTitle: 'Mobile QR Scanner Benchmark',
      question:
        'What is the verification status of the mobile QR ticket scanner benchmark where you claimed 5,000 scans per minute with zero errors?',
      reason:
        'Asha claimed in chat message 32 that the scanner was tested at 5,000 scans/min, but no benchmark script or test log exists in the repo.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer:
        'I ran the test locally against a mock server from a scratch file that was not pushed to git. A reproducible benchmark script still needs to be created by Kiran.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-09-25T14:45:00Z',
    },
    {
      id: 'q-7',
      category: 'Technical Decisions',
      shortTitle: 'Auditorium Capacity Discrepancy',
      question:
        'Why is there a discrepancy in auditorium capacity between PR #5 (350 seats) and architecture_overview.md (500 seats)?',
      reason:
        'Contradiction detected: PR #5 limits auditorium bookings to 350 seats, while architecture_overview.md specifies a hard cap of 500 seats.',
      roleTarget: 'Backend Developer',
      status: 'pending',
      evidenceStatus: 'unverified',
    },
    {
      id: 'q-8',
      category: 'Dependencies & Credentials',
      shortTitle: 'Undocumented campus_sms_sdk',
      question:
        'Where are the credentials and configuration instructions for campus_sms_sdk imported in commit f710a34?',
      reason:
        'Commit f710a34 added the SMS dispatch library, but no setup notes or API keys exist in deployment_guide.md.',
      roleTarget: 'Backend Developer',
      status: 'pending',
      evidenceStatus: 'unverified',
    },
  ],
  evidencePieces: [
    {
      id: 'ev-01',
      title: 'PR #3: HTTP-Only Secure Cookies',
      type: 'commit',
      sourceRef: 'repo/export.json commit e4b1029',
      quote: 'Store JWT in HTTP-only cookies instead of localStorage to prevent XSS credential theft',
      timestamp: '2026-07-27 16:45 UTC',
      author: 'Asha',
    },
    {
      id: 'ev-02',
      title: 'Architecture Overview: Database Decision',
      type: 'doc',
      sourceRef: 'docs/architecture_overview.md paragraph 1',
      quote: 'We chose SQLite with WAL mode over PostgreSQL for the initial campus MVP to avoid database hosting costs and simplify zero-configuration deployment',
      timestamp: '2026-07-20 10:00 UTC',
      author: 'Asha',
    },
    {
      id: 'ev-03',
      title: 'Chat Message #5: Hosting Selection',
      type: 'chat',
      sourceRef: 'chat/chat.json message 5',
      quote: 'Team chose Render over Heroku because of the free tier and cheaper background workers for our student budget',
      timestamp: '2026-07-17 09:42 UTC',
      author: 'Asha',
    },
    {
      id: 'ev-04',
      title: 'Commit a3f9c21: Webhook Retry Policy',
      type: 'commit',
      sourceRef: 'repo/export.json commit a3f9c21',
      quote: 'Implement exponential backoff for ticket webhook delivery to prevent campus server overload',
      timestamp: '2026-08-08 15:10 UTC',
      author: 'Asha',
    },
    {
      id: 'ev-05',
      title: 'Meeting Notes: Frontend Tailwind Decision',
      type: 'doc',
      sourceRef: 'docs/meeting_notes_august.md paragraph 1',
      quote: 'The team agreed to adopt Tailwind CSS instead of Chakra UI for the frontend rebuild to reduce build bundle size and eliminate runtime emotion CSS overhead',
      timestamp: '2026-08-15 14:00 UTC',
      author: 'Engineering Team',
    },
  ],
  statements: [
    {
      id: 'st-01',
      category: 'decision',
      title: 'SQLite Database in WAL Mode for Pilot',
      content:
        'SQLite in WAL mode was selected over PostgreSQL to eliminate database server operational costs during the student pilot while supporting concurrent read access.',
      evidenceStatus: 'verified',
      evidenceId: 'ev-02',
      evidenceQuote:
        'We chose SQLite with WAL mode over PostgreSQL for the initial campus MVP to avoid database hosting costs and simplify zero-configuration deployment',
      sourceLabel: 'docs/architecture_overview.md',
      departingAnswer: 'Confirmed: WAL mode supports concurrent student checkouts with 15s timeout.',
    },
    {
      id: 'st-02',
      category: 'decision',
      title: 'Render Cloud Deployment Platform',
      content:
        'Render was chosen over Heroku for hosting the FastAPI backend and Celery worker due to the free tier and cheaper background worker instances.',
      evidenceStatus: 'verified',
      evidenceId: 'ev-03',
      evidenceQuote:
        'Team chose Render over Heroku because of the free tier and cheaper background workers for our student budget',
      sourceLabel: 'chat/chat.json message 5',
      departingAnswer: 'Confirmed: Render links directly to GitHub preview branches.',
    },
    {
      id: 'st-03',
      category: 'decision',
      title: 'HTTP-Only SameSite Cookie Authentication',
      content:
        'JWT tokens are stored strictly in HTTP-only SameSite cookies rather than browser localStorage to protect student authentication tokens from cross-site scripting (XSS).',
      evidenceStatus: 'verified',
      evidenceId: 'ev-01',
      evidenceQuote:
        'Store JWT in HTTP-only cookies instead of localStorage to prevent XSS credential theft',
      sourceLabel: 'repo/export.json PR #3',
      departingAnswer: 'Confirmed: Standardized on HTTP-only SameSite=Lax cookies.',
    },
    {
      id: 'st-04',
      category: 'decision',
      title: 'Exponential Backoff Webhook Retries',
      content:
        'Ticket purchase webhooks utilize exponential backoff to prevent cascading failures when the university accounting portal is congested.',
      evidenceStatus: 'verified',
      evidenceId: 'ev-04',
      evidenceQuote:
        'Implement exponential backoff for ticket webhook delivery to prevent campus server overload',
      sourceLabel: 'repo/export.json commit a3f9c21',
      departingAnswer: 'Confirmed: Backoff up to 5 retries implemented in services/webhooks.py.',
    },
    {
      id: 'st-05',
      category: 'risk',
      title: 'QR Scanner 5,000 Scans/Min Benchmark Claim',
      content:
        'Asha stated the mobile QR scanner was stress-tested up to 5,000 scans per minute with zero errors, but no reproducible script or test log exists in repository.',
      evidenceStatus: 'unverified',
      sourceLabel: 'chat/chat.json message 32 (Asha Claim)',
      departingAnswer: 'Tested locally from a scratch file that was not pushed to git.',
    },
    {
      id: 'st-06',
      category: 'risk',
      title: 'Redis Sunday 3 AM Auto-Purge Claim',
      content:
        'Asha stated Redis cache automatically purges inactive event sessions at 3 AM every Sunday, but no cron schedule or TTL policy is configured in codebase.',
      evidenceStatus: 'unverified',
      sourceLabel: 'chat/chat.json message 46 (Asha Claim)',
      departingAnswer: 'Configured manually via Redis CLI eviction policy on staging.',
    },
    {
      id: 'st-07',
      category: 'dependency',
      title: 'ReportLab PDF Worker Background Daemon',
      content:
        'Ticket PDF badge rendering relies strictly on Ravi\'s background Celery worker daemon (deploy/worker_daemon.py). If worker is offline, registration succeeds but badge generation hangs.',
      evidenceStatus: 'verified',
      evidenceId: 'ev-05',
      sourceLabel: 'docs/meeting_notes_august.md',
    },
  ],
  gaps: [
    {
      id: 'gap-01',
      title: 'Auditorium Capacity Conflict (350 vs 500 Seats)',
      description:
        'PR #5 limits auditorium event bookings to 350 seats per Student Affairs request, whereas architecture_overview.md specifies a hard limit of 500 attendees.',
      category: 'conflicting',
      risk: 'High',
      sourcesInConflict: ['PR #5', 'docs/architecture_overview.md paragraph 2'],
      status: 'open',
    },
    {
      id: 'gap-02',
      title: 'JWT Token Expiry Policy Discrepancy',
      description:
        'Commit c18d402 sets 60-minute token expiry for student convenience, but chat message 17 from Deepak mandates a strict 15-minute expiration.',
      category: 'conflicting',
      risk: 'Medium',
      sourcesInConflict: ['commit c18d402', 'chat/chat.json message 17'],
      status: 'resolved',
      resolutionReason: 'Approved as 15-minute token with auto-refresh endpoint per campus safety compliance.',
    },
    {
      id: 'gap-03',
      title: 'Ticket QR Code Format Discrepancy',
      description:
        'Task T08 states QR codes use raw UUID v4 strings, while architecture_overview.md specifies an HMAC-SHA256 signed JSON payload.',
      category: 'conflicting',
      risk: 'Medium',
      sourcesInConflict: ['tasks.csv task T08', 'docs/architecture_overview.md paragraph 3'],
      status: 'open',
    },
    {
      id: 'gap-04',
      title: 'Unowned Task T05: Automated S3 Database Backups',
      description:
        'Daily backup to Amazon S3 has no assigned developer and lacks AWS IAM credentials in repository secrets.',
      category: 'missing',
      risk: 'High',
      status: 'open',
    },
    {
      id: 'gap-05',
      title: 'Missing CAMPUS_PAY_SECRET Environment Variable',
      description:
        'api/payments.py reads environment variable CAMPUS_PAY_SECRET, but it is omitted from deployment_guide.md and example env files.',
      category: 'missing',
      risk: 'High',
      status: 'open',
    },
  ],
};

interface HandoverContextType {
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  currentUser: UserProfile;
  project: ProjectHandover;
  dashboardMetrics: {
    totalProjects: number;
    pendingHandovers: number;
    awaitingApproval: number;
    completedHandovers: number;
  };
  saveAnswer: (
    questionId: string,
    answer: string,
    options?: { hasVoice?: boolean; durationSeconds?: number }
  ) => void;
  saveFollowUpAnswer: (questionId: string, answer: string) => void;
  markDontKnow: (questionId: string) => void;
  skipQuestion: (questionId: string) => void;
  submitDepartingAnswers: () => void;
  editStatement: (statementId: string, newContent: string) => void;
  rejectStatement: (statementId: string) => void;
  resolveGap: (gapId: string, reason: string) => void;
  flagGap: (gapId: string) => void;
  approveHandover: () => void;
  acknowledgeReceipt: () => void;
  createNewProject: (data: Partial<ProjectHandover>) => void;
  resetDemoData: () => void;
}

const HandoverContext = createContext<HandoverContextType | undefined>(undefined);

export function HandoverProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<Role>('lead');
  const [activeScreen, setActiveScreen] = useState<string>('role-select');
  const [project, setProject] = useState<ProjectHandover>(SYNTHETIC_PROJECT);

  useEffect(() => {
    // Clear old localStorage if project was the previous healthcare one
    const saved = localStorage.getItem('trailmark_project_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Campus Events App') {
          setProject(parsed);
        } else {
          setProject(SYNTHETIC_PROJECT);
        }
      } catch {
        setProject(SYNTHETIC_PROJECT);
      }
    }
  }, []);

  const persist = (updated: ProjectHandover) => {
    setProject(updated);
    try {
      localStorage.setItem('trailmark_project_state', JSON.stringify(updated));
    } catch {}
  };

  const currentUser = DEMO_USERS[activeRole];

  const dashboardMetrics = {
    totalProjects: 3,
    pendingHandovers: project.isApproved ? 0 : 1,
    awaitingApproval: !project.isApproved && project.questions.some((q) => q.status === 'answered') ? 1 : 0,
    completedHandovers: project.receipt.acknowledged ? 2 : 1,
  };

  const saveAnswer = (
    questionId: string,
    answer: string,
    options?: { hasVoice?: boolean; durationSeconds?: number }
  ) => {
    const updatedQuestions = project.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          answer,
          status: 'answered' as const,
          evidenceStatus: 'unverified' as EvidenceStatus,
          hasVoiceRecording: options?.hasVoice ?? q.hasVoiceRecording,
          audioDurationSeconds: options?.durationSeconds ?? q.audioDurationSeconds,
          updatedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    const q = project.questions.find((item) => item.id === questionId);
    let updatedStatements = [...project.statements];
    if (q) {
      const existingIdx = updatedStatements.findIndex((s) => s.id === `st-${questionId}`);
      const newStatement: Statement = {
        id: `st-${questionId}`,
        category: 'decision',
        title: q.question.slice(0, 45) + '...',
        content: answer,
        evidenceStatus: 'unverified',
        sourceLabel: `Departing Answer (${options?.hasVoice ? 'Voice' : 'Text'})`,
        departingAnswer: answer,
      };

      if (existingIdx >= 0) {
        updatedStatements[existingIdx] = {
          ...updatedStatements[existingIdx],
          content: answer,
          departingAnswer: answer,
          evidenceStatus: 'unverified',
        };
      } else {
        updatedStatements.push(newStatement);
      }
    }

    persist({
      ...project,
      questions: updatedQuestions,
      statements: updatedStatements,
      updatedAt: new Date().toISOString(),
    });
  };

  const saveFollowUpAnswer = (questionId: string, followUpAnswer: string) => {
    const updatedQuestions = project.questions.map((q) => {
      if (q.id === questionId && q.followUp) {
        return {
          ...q,
          followUp: {
            ...q.followUp,
            answer: followUpAnswer,
            status: 'answered' as const,
            answeredAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    persist({
      ...project,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const markDontKnow = (questionId: string) => {
    const q = project.questions.find((item) => item.id === questionId);
    const updatedQuestions = project.questions.map((item) =>
      item.id === questionId
        ? {
            ...item,
            status: 'unknown' as const,
            answer: 'Departing member indicated no knowledge or record of this item.',
            evidenceStatus: 'missing_conflicting' as EvidenceStatus,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    const newGap: Gap = {
      id: `gap-unk-${questionId}`,
      title: q?.shortTitle || q?.question || 'Unknown project question',
      description: `Asha indicated no knowledge of "${q?.question}". Flagged as open knowledge gap for Kiran.`,
      category: 'missing',
      risk: 'Medium',
      status: 'open',
    };

    persist({
      ...project,
      questions: updatedQuestions,
      gaps: [...project.gaps.filter((g) => g.id !== newGap.id), newGap],
      updatedAt: new Date().toISOString(),
    });
  };

  const skipQuestion = (questionId: string) => {
    const updatedQuestions = project.questions.map((q) =>
      q.id === questionId
        ? {
            ...q,
            status: 'skipped' as const,
            updatedAt: new Date().toISOString(),
          }
        : q
    );
    persist({
      ...project,
      questions: updatedQuestions,
    });
  };

  const submitDepartingAnswers = () => {
    persist({
      ...project,
      status: 'Active Handover',
      updatedAt: new Date().toISOString(),
    });
  };

  const editStatement = (statementId: string, newContent: string) => {
    const updated = project.statements.map((s) =>
      s.id === statementId ? { ...s, content: newContent } : s
    );
    persist({
      ...project,
      statements: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const rejectStatement = (statementId: string) => {
    const updated = project.statements.filter((s) => s.id !== statementId);
    persist({
      ...project,
      statements: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const resolveGap = (gapId: string, reason: string) => {
    const updated = project.gaps.map((g) =>
      g.id === gapId ? { ...g, status: 'resolved' as const, resolutionReason: reason } : g
    );
    persist({
      ...project,
      gaps: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const flagGap = (gapId: string) => {
    const updated = project.gaps.map((g) =>
      g.id === gapId ? { ...g, status: 'flagged' as const } : g
    );
    persist({
      ...project,
      gaps: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const approveHandover = () => {
    persist({
      ...project,
      isApproved: true,
      status: 'Approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser.name,
      updatedAt: new Date().toISOString(),
    });
  };

  const acknowledgeReceipt = () => {
    persist({
      ...project,
      status: 'Completed',
      receipt: {
        acknowledged: true,
        acknowledgedBy: currentUser.name,
        acknowledgedAt: new Date().toISOString(),
        notes: 'Handover received and reviewed. All open gaps and evidence trail verified.',
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const createNewProject = (data: Partial<ProjectHandover>) => {
    const newProj: ProjectHandover = {
      ...SYNTHETIC_PROJECT,
      id: `proj-${Date.now()}`,
      name: data.name || 'Campus Events App',
      description: data.description || '',
      objectives: data.objectives || '',
      techStack: data.techStack || 'Python, FastAPI, SQLite (WAL), Render, Celery, ReportLab',
      status: (data.status as any) || 'Active Handover',
      departingMember: data.departingMember || 'Asha',
      departingRole: data.departingRole || 'Backend Developer',
      incomingMember: data.incomingMember || 'Kiran',
      githubRepo: data.githubRepo || 'https://github.com/campus-synthetic/events-app',
      documents: data.documents || [
        'architecture_overview.md',
        'deployment_guide.md',
        'meeting_notes_august.md',
        'tasks.csv',
        'chat.json',
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isApproved: false,
      receipt: { acknowledged: false },
    };
    persist(newProj);
  };

  const resetDemoData = () => {
    localStorage.removeItem('trailmark_project_state');
    setProject(SYNTHETIC_PROJECT);
    setActiveScreen('role-select');
  };

  return (
    <HandoverContext.Provider
      value={{
        activeRole,
        setActiveRole,
        activeScreen,
        setActiveScreen,
        currentUser,
        project,
        dashboardMetrics,
        saveAnswer,
        saveFollowUpAnswer,
        markDontKnow,
        skipQuestion,
        submitDepartingAnswers,
        editStatement,
        rejectStatement,
        resolveGap,
        flagGap,
        approveHandover,
        acknowledgeReceipt,
        createNewProject,
        resetDemoData,
      }}
    >
      {children}
    </HandoverContext.Provider>
  );
}

export function useHandover() {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error('useHandover must be used within a HandoverProvider');
  }
  return context;
}
