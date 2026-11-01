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
} from '@/types';

export const DEMO_USERS: Record<Role, UserProfile> = {
  lead: {
    id: 'user-lead',
    name: 'Kishan S',
    role: 'lead',
    roleTitle: 'Project Lead & Reviewer',
    avatar: 'KS',
    email: 'kishan.lead@trailmark.io',
  },
  departing: {
    id: 'user-departing',
    name: 'Alex Chen',
    role: 'departing',
    roleTitle: 'Backend Developer (Departing)',
    avatar: 'AC',
    email: 'alex.chen@trailmark.io',
  },
  incoming: {
    id: 'user-incoming',
    name: 'Priya Sharma',
    role: 'incoming',
    roleTitle: 'Software Engineer (Incoming)',
    avatar: 'PS',
    email: 'priya.sharma@trailmark.io',
  },
};

const INITIAL_PROJECT: ProjectHandover = {
  id: 'proj-health-01',
  name: 'Smart Healthcare Management System',
  description:
    'FHIR-compliant patient management system, asynchronous tele-consultation pipeline, and clinical report processing platform.',
  objectives:
    'Scale hospital intake microservices, implement HIPAA-compliant audit logging, streamline insurance payment retries, and ensure seamless transition of core backend APIs.',
  techStack: 'Python, FastAPI, PostgreSQL, Redis, Celery, Docker, Next.js',
  status: 'Active Handover',
  departingMember: 'Alex Chen',
  departingRole: 'Backend Developer',
  incomingMember: 'Priya Sharma',
  githubRepo: 'https://github.com/trailmark-org/smart-healthcare-core',
  documents: [
    'Architecture_Decisions_ADR-04.md',
    'Patient_Ingestion_SOP.pdf',
    'Slack_Backend_Sync_Export.json',
    'Database_Schema_v2.sql',
  ],
  createdAt: '2026-10-24T09:30:00Z',
  updatedAt: '2026-11-01T11:00:00Z',
  isApproved: false,
  receipt: {
    acknowledged: false,
  },
  questions: [
    {
      id: 'q-1',
      question: 'Why was the payment and insurance retry policy rewritten to exponential backoff without a circuit breaker?',
      reason: 'Identified in commit c8e92a1 on PR #104. No Architecture Decision Record (ADR) was found documenting why the circuit breaker was removed.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer: 'The third-party payer API threw sporadic 504 gateway timeouts during morning batch processing. We introduced exponential backoff up to 5 attempts. The circuit breaker was temporarily postponed to prevent Celery task timeout conflicts.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-10-31T14:20:00Z',
    },
    {
      id: 'q-2',
      question: 'What is the token expiration strategy for emergency clinical access endpoints?',
      reason: 'Conflicting timestamps detected between PR #88 (15 minutes) and Slack sync discussion #dev-core (1 hour).',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer: 'We kept the JWT expiration at 15 minutes for strict security compliance, but added a refresh endpoint (/auth/emergency/refresh) that auto-renews while a clinical session is active.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-10-31T15:45:00Z',
    },
    {
      id: 'q-3',
      question: 'Who owns the Celery worker deployment scripts and AWS S3 credentials for HIPAA archives?',
      reason: 'Unowned cron jobs found in deploy/workers/celery.sh referencing a restricted S3 bucket.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer: 'I provisioned it manually via Ansible vault. For the handover, Priya needs to be added to the AWS IAM role "HealthcareWorkerS3Policy" before Friday.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-10-31T16:10:00Z',
    },
    {
      id: 'q-4',
      question: 'What is the current status of the HL7-to-FHIR payload conversion parser?',
      reason: 'Task card #342 was marked "In Progress" for 3 weeks with no subsequent commit linked.',
      roleTarget: 'Backend Developer',
      status: 'answered',
      answer: 'The parser is roughly 80% complete in app/parsers/hl7.py. Demographics and patient identification pass all unit tests, but diagnostic lab observation parsing still requires schema validation against FHIR R4.',
      evidenceStatus: 'unverified',
      updatedAt: '2026-10-31T17:05:00Z',
    },
    {
      id: 'q-5',
      question: 'Are there any unencrypted staging credentials in the notification dispatch service?',
      reason: 'Found placeholder comment "// TODO: Migrate Twilio dev keys to Vault" in services/notify.py:44.',
      roleTarget: 'Backend Developer',
      status: 'pending',
      evidenceStatus: 'unverified',
    },
    {
      id: 'q-6',
      question: 'Why are Alembic migrations #12 and #13 conflicting on the patient_records foreign key?',
      reason: 'Two branches created migration files touching table patients_v2 concurrently.',
      roleTarget: 'Backend Developer',
      status: 'pending',
      evidenceStatus: 'unverified',
    },
    {
      id: 'q-7',
      question: 'What occurs when the Redis cache goes down during high-throughput patient vitals streaming?',
      reason: 'Fallback logic in cache.py falls back directly to raw PostgreSQL queries without rate limiting.',
      roleTarget: 'Backend Developer',
      status: 'pending',
      evidenceStatus: 'unverified',
    },
  ],
  evidencePieces: [
    {
      id: 'ev-01',
      title: 'PR #104: Payment Retry Refactor',
      type: 'commit',
      sourceRef: 'github.com/trailmark-org/smart-healthcare-core/pull/104',
      quote: 'commit c8e92a1: "Replace retry loop with exponential backoff; drop breaker until async task refactor"',
      timestamp: '2026-10-18 14:12 UTC',
      author: 'Alex Chen',
    },
    {
      id: 'ev-02',
      title: 'PR #88: Emergency Access Security',
      type: 'commit',
      sourceRef: 'github.com/trailmark-org/smart-healthcare-core/pull/88',
      quote: 'ACCESS_TOKEN_EXPIRE_MINUTES = 15; # Short-lived clinical emergency session',
      timestamp: '2026-10-12 09:24 UTC',
      author: 'Alex Chen',
    },
    {
      id: 'ev-03',
      title: 'Slack #dev-core Discussion',
      type: 'chat',
      sourceRef: 'Slack_Backend_Sync_Export.json #L184',
      quote: 'Doctor on-call complained about re-authenticating every 15 mins. Can we bump emergency JWT to 1 hour?',
      timestamp: '2026-10-14 11:05 UTC',
      author: 'Dr. Marcus & Dev Team',
    },
    {
      id: 'ev-04',
      title: 'ADR-04: Asynchronous Medical Pipeline',
      type: 'doc',
      sourceRef: 'Architecture_Decisions_ADR-04.md',
      quote: 'All incoming HL7 payloads are dispatched to Celery queue `patient_ingest` with persistent PostgreSQL state tracking.',
      timestamp: '2026-09-30 16:00 UTC',
      author: 'Kishan S (Lead)',
    },
    {
      id: 'ev-05',
      title: 'Task Board #342: FHIR R4 Ingestion',
      type: 'task',
      sourceRef: 'Jira / Linear board task #342',
      quote: 'Status: In Progress. Assignee: Alex Chen. "Implement HL7 v2.5 to FHIR R4 transformer for Lab Observations".',
      timestamp: '2026-10-10 10:00 UTC',
      author: 'Project Board',
    },
  ],
  statements: [
    {
      id: 'st-01',
      category: 'decision',
      title: 'Emergency Clinical Access Token Strategy',
      content:
        'Tokens expire every 15 minutes for HIPAA compliance; client applications automatically refresh through /auth/emergency/refresh without interrupting doctor sessions.',
      evidenceStatus: 'verified',
      evidenceId: 'ev-02',
      evidenceQuote: 'ACCESS_TOKEN_EXPIRE_MINUTES = 15; # Short-lived clinical emergency session',
      sourceLabel: 'PR #88 (GitHub)',
      sourceRef: 'https://github.com/trailmark-org/smart-healthcare-core/pull/88',
      departingAnswer: 'Confirmed: 15 min JWT + auto-renewing refresh endpoint preserves security without medical disruption.',
    },
    {
      id: 'st-02',
      category: 'decision',
      title: 'Insurance Retry Mechanism',
      content:
        'Third-party payer timeouts handled by exponential backoff (up to 5 retries). Circuit breaker removal is temporary pending worker refactor.',
      evidenceStatus: 'unverified',
      evidenceId: 'ev-01',
      evidenceQuote: 'commit c8e92a1: "Replace retry loop with exponential backoff; drop breaker until async task refactor"',
      sourceLabel: 'Departing Member Q1 Answer',
      departingAnswer: 'Stated by Alex Chen: Circuit breaker postponed due to Celery task timeout conflicts.',
    },
    {
      id: 'st-03',
      category: 'ownership',
      title: 'FHIR Conversion & Core Ingestion Pipeline',
      content:
        'Primary domain ownership previously held solely by Alex Chen. Complete handover to Priya Sharma requires AWS S3 IAM credentials and Ansible vault access.',
      evidenceStatus: 'unverified',
      sourceLabel: 'Departing Member Q3 Answer',
      departingAnswer: 'Priya needs HealthcareWorkerS3Policy credentials to deploy the Celery worker queue.',
    },
    {
      id: 'st-04',
      category: 'unfinished',
      title: 'HL7-to-FHIR Observation Transformer',
      content:
        'Core demographic parser completed (80%). Diagnostic observation mapping against FHIR R4 is incomplete and lacks unit test coverage.',
      evidenceStatus: 'unverified',
      evidenceId: 'ev-05',
      evidenceQuote: 'Task #342: "Implement HL7 v2.5 to FHIR R4 transformer for Lab Observations"',
      sourceLabel: 'Departing Member Q4 Answer',
      departingAnswer: 'Parser at app/parsers/hl7.py needs schema validation for lab results before production release.',
    },
    {
      id: 'st-05',
      category: 'risk',
      title: 'Redis Cache Fallback Throttling Vulnerability',
      content:
        'Under heavy vitals streaming traffic, Redis failure triggers direct, unbounded queries against PostgreSQL, risking database connection pool exhaustion.',
      evidenceStatus: 'missing_conflicting',
      sourceLabel: 'Automated Codebase Gap Scan (cache.py)',
    },
    {
      id: 'st-06',
      category: 'risk',
      title: 'Staging Twilio Credentials in Source Code',
      content:
        'Notification service source code has hardcoded developer API tokens awaiting migration to HashiCorp Vault.',
      evidenceStatus: 'missing_conflicting',
      sourceLabel: 'Automated Codebase Gap Scan (services/notify.py:44)',
    },
  ],
  gaps: [
    {
      id: 'gap-01',
      title: 'Discrepancy in Emergency Session Token Lifespan',
      description:
        'PR #88 enforces strict 15-minute token expiry, while Slack sync archives state doctors requested a 60-minute window.',
      category: 'conflicting',
      risk: 'Medium',
      sourcesInConflict: ['PR #88', 'Slack #dev-core #L184'],
      status: 'resolved',
      resolutionReason: 'Approved as 15-minute JWT with background token refresh. Complies with hospital audit mandate.',
    },
    {
      id: 'gap-02',
      title: 'Direct Database Fallback During Redis Failure',
      description:
        'No rate limiting exists when Redis stream cache drops. PostgreSQL connection pool will exhaust at >500 req/sec.',
      category: 'missing',
      risk: 'High',
      status: 'open',
    },
    {
      id: 'gap-03',
      title: 'Twilio Notification Secret Migration',
      description:
        'Notification module credentials remain unverified; pending rotation and key revocation in production.',
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
  saveAnswer: (questionId: string, answer: string) => void;
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
  const [project, setProject] = useState<ProjectHandover>(INITIAL_PROJECT);

  // Load persisted demo state if available
  useEffect(() => {
    const saved = localStorage.getItem('trailmark_project_state');
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch {
        // use default initial
      }
    }
  }, []);

  const persist = (updated: ProjectHandover) => {
    setProject(updated);
    try {
      localStorage.setItem('trailmark_project_state', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const currentUser = DEMO_USERS[activeRole];

  // Derived metrics
  const dashboardMetrics = {
    totalProjects: 4,
    pendingHandovers: project.isApproved ? 1 : 2,
    awaitingApproval: !project.isApproved && project.questions.some((q) => q.status === 'answered') ? 1 : 0,
    completedHandovers: project.receipt.acknowledged ? 3 : 2,
  };

  const saveAnswer = (questionId: string, answer: string) => {
    const updatedQuestions = project.questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          answer,
          status: 'answered' as const,
          evidenceStatus: 'unverified' as EvidenceStatus, // Rule: stays unverified!
          updatedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    // Also update or add statement corresponding to the answer
    const q = project.questions.find((item) => item.id === questionId);
    let updatedStatements = [...project.statements];
    if (q) {
      const existingIdx = updatedStatements.findIndex((s) => s.id === `st-${questionId}`);
      const newStatement: Statement = {
        id: `st-${questionId}`,
        category: 'ownership',
        title: q.question.slice(0, 45) + '...',
        content: answer,
        evidenceStatus: 'unverified',
        sourceLabel: `Departing Member Answer`,
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

  const markDontKnow = (questionId: string) => {
    const q = project.questions.find((item) => item.id === questionId);
    const updatedQuestions = project.questions.map((item) =>
      item.id === questionId
        ? {
            ...item,
            status: 'unknown' as const,
            answer: 'Departing member does not know or has no recorded answer.',
            evidenceStatus: 'missing_conflicting' as EvidenceStatus,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    // Add to gaps
    const newGap: Gap = {
      id: `gap-unk-${questionId}`,
      title: q?.question || 'Unknown project question',
      description: 'Departing member indicated no knowledge of this component. Marked as a known unknown.',
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
    // Preserve evidence statuses according to rule:
    // "Don't automatically turn an answer into Verified just because the Team Lead approves the handover. Preserve its evidence status."
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
      ...INITIAL_PROJECT,
      id: `proj-${Date.now()}`,
      name: data.name || 'New Project Handover',
      description: data.description || '',
      objectives: data.objectives || '',
      techStack: data.techStack || 'TypeScript, Next.js, FastAPI',
      status: (data.status as any) || 'In Progress',
      departingMember: data.departingMember || 'Alex Chen',
      departingRole: data.departingRole || 'Backend Developer',
      incomingMember: data.incomingMember || 'Priya Sharma',
      githubRepo: data.githubRepo || '',
      documents: data.documents || ['README.md', 'Architecture.md'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isApproved: false,
      receipt: { acknowledged: false },
      // AI generates dynamic contextual questions based on the role and project details!
      questions: [
        {
          id: `q-gen-1`,
          question: `What are the critical architectural decisions made for the ${data.name || 'project'} tech stack (${data.techStack || 'core services'})?`,
          reason: `Extracted from repository source and project objectives provided by Team Lead.`,
          roleTarget: data.departingRole || 'Backend Developer',
          status: 'pending',
          evidenceStatus: 'unverified',
        },
        {
          id: `q-gen-2`,
          question: `Which API endpoints or background workers have undocumented edge cases or failure modes?`,
          reason: `Detected unlinked exception handlers in repository codebase.`,
          roleTarget: data.departingRole || 'Backend Developer',
          status: 'pending',
          evidenceStatus: 'unverified',
        },
        {
          id: `q-gen-3`,
          question: `Where are the operational credentials, third-party webhook secrets, and deployment variables stored?`,
          reason: `Compliance check: Team Lead flagged transition to ${data.incomingMember || 'incoming member'}.`,
          roleTarget: data.departingRole || 'Backend Developer',
          status: 'pending',
          evidenceStatus: 'unverified',
        },
        {
          id: `q-gen-4`,
          question: `What is the current status of unfinished tasks before your departure?`,
          reason: `Gaps identified in project milestone objectives.`,
          roleTarget: data.departingRole || 'Backend Developer',
          status: 'pending',
          evidenceStatus: 'unverified',
        },
      ],
    };
    persist(newProj);
  };

  const resetDemoData = () => {
    localStorage.removeItem('trailmark_project_state');
    setProject(INITIAL_PROJECT);
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

