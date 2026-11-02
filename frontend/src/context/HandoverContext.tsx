'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Role,
  UserProfile,
  ProjectHandover,
  Question,
  Statement,
  Gap,
  EvidencePiece,
  EvidenceStatus,
  QuestionStatus,
  QuestionCategory,
  HandoverReceipt as TypesHandoverReceipt,
} from '@/types';
import {
  HandoverApiService,
  UserOut,
  HandoverOut,
  MemberOut,
  SourceOut,
  AnalysisOut,
  ApiQuestion,
  ApiStatement,
  StatementVersion,
  HandoverView,
  HandoverReceipt,
  PieceOut,
} from '@/services/api';

export const DEMO_CREDENTIALS: Record<Role, { name: string; email: string; role: Role; roleTitle: string; avatar: string }> = {
  lead: {
    name: 'Deepak',
    email: 'deepak-lead@campus-synthetic.internal',
    role: 'lead',
    roleTitle: 'Engineering Lead & Reviewer',
    avatar: 'D',
  },
  departing: {
    name: 'Asha',
    email: 'asha@campus-synthetic.internal',
    role: 'departing',
    roleTitle: 'Senior Backend Developer (Leaver)',
    avatar: 'A',
  },
  incoming: {
    name: 'Kiran',
    email: 'kiran@campus-synthetic.internal',
    role: 'incoming',
    roleTitle: 'Software Engineer (Successor)',
    avatar: 'K',
  },
};

export const DEMO_USERS: Record<Role, UserProfile> = {
  lead: {
    id: 'user-lead',
    name: DEMO_CREDENTIALS.lead.name,
    role: 'lead',
    roleTitle: DEMO_CREDENTIALS.lead.roleTitle,
    avatar: DEMO_CREDENTIALS.lead.avatar,
    email: DEMO_CREDENTIALS.lead.email,
  },
  departing: {
    id: 'user-departing',
    name: DEMO_CREDENTIALS.departing.name,
    role: 'departing',
    roleTitle: DEMO_CREDENTIALS.departing.roleTitle,
    avatar: DEMO_CREDENTIALS.departing.avatar,
    email: DEMO_CREDENTIALS.departing.email,
  },
  incoming: {
    id: 'user-incoming',
    name: DEMO_CREDENTIALS.incoming.name,
    role: 'incoming',
    roleTitle: DEMO_CREDENTIALS.incoming.roleTitle,
    avatar: DEMO_CREDENTIALS.incoming.avatar,
    email: DEMO_CREDENTIALS.incoming.email,
  },
};

interface HandoverContextType {
  // Auth state
  currentUser: UserProfile;
  authUser: UserOut | null;
  authLoading: boolean;
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (email: string, name: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoRole: (role: Role) => Promise<void>;

  // Handovers state
  handovers: HandoverOut[];
  activeHandoverId: number | null;
  activeHandover: HandoverOut | null;
  selectHandover: (id: number) => Promise<void>;
  createHandover: (title: string, projectName: string) => Promise<number | null>;
  members: MemberOut[];
  addMember: (email: string, role: Role) => Promise<boolean>;
  refreshHandovers: () => Promise<void>;

  // Sources & Analysis
  sources: SourceOut[];
  analysis: AnalysisOut | null;
  isAnalyzing: boolean;
  uploadSyntheticSources: () => Promise<{ success: number; failed: number; errors: string[] }>;
  uploadCustomSource: (file: File, type: 'repo' | 'doc' | 'chat' | 'tasks', name: string, allowedRoles?: string[]) => Promise<boolean>;
  triggerAnalysis: () => Promise<void>;
  refreshSources: () => Promise<void>;

  // Questions (Departing)
  questions: ApiQuestion[];
  questionsLoading: boolean;
  loadQuestions: () => Promise<void>;
  answerQuestionApi: (questionId: number, action: 'answer' | 'skip' | 'unknown', text?: string) => Promise<boolean>;

  // Statements (Review)
  statements: ApiStatement[];
  statementsLoading: boolean;
  loadStatements: () => Promise<void>;
  editStatementApi: (statementId: number, text: string, reason?: string) => Promise<boolean>;
  rejectStatementApi: (statementId: number, reason: string) => Promise<boolean>;
  resolveStatementApi: (statementId: number, chosenPieceId: number, reason: string, text?: string) => Promise<boolean>;
  acceptGapApi: (statementId: number, reason: string) => Promise<boolean>;
  getVersionsApi: (statementId: number) => Promise<StatementVersion[]>;
  approveHandoverApi: () => Promise<boolean>;

  // Handover View (Incoming)
  handoverView: HandoverView | null;
  handoverViewLoading: boolean;
  handoverViewError: string | null;
  receipt: HandoverReceipt | null;
  loadHandoverView: () => Promise<void>;
  confirmReceiptApi: () => Promise<boolean>;
  getPiece: (pieceId: number) => Promise<PieceOut | null>;

  // Notification and Error state
  errorMessage: string | null;
  successMessage: string | null;
  clearMessages: () => void;

  // Compatibility adapters for existing screens
  project: ProjectHandover;
  dashboardMetrics: {
    totalProjects: number;
    pendingHandovers: number;
    awaitingApproval: number;
    completedHandovers: number;
  };
  saveAnswer: (questionId: string | number, answer: string, options?: { hasVoice?: boolean; durationSeconds?: number }) => Promise<void>;
  saveFollowUpAnswer: (questionId: string | number, answer: string) => void;
  markDontKnow: (questionId: string | number) => Promise<void>;
  skipQuestion: (questionId: string | number) => Promise<void>;
  submitDepartingAnswers: () => void;
  editStatement: (statementId: string | number, newContent: string) => Promise<void>;
  rejectStatement: (statementId: string | number) => Promise<void>;
  resolveGap: (gapId: string | number, reason: string, chosenPieceId?: number) => Promise<void>;
  flagGap: (gapId: string | number) => void;
  approveHandover: () => Promise<void>;
  acknowledgeReceipt: () => Promise<void>;
  createNewProject: (data: Partial<ProjectHandover>) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const HandoverContext = createContext<HandoverContextType | undefined>(undefined);

export function HandoverProvider({ children }: { children: React.ReactNode }) {
  // Auth & Screen State
  const [activeRole, setActiveRole] = useState<Role>('lead');
  const [activeScreen, setActiveScreen] = useState<string>('role-select');
  const [authUser, setAuthUser] = useState<UserOut | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Handover data
  const [handovers, setHandovers] = useState<HandoverOut[]>([]);
  const [activeHandoverId, setActiveHandoverId] = useState<number | null>(null);
  const [activeHandover, setActiveHandover] = useState<HandoverOut | null>(null);
  const [members, setMembers] = useState<MemberOut[]>([]);

  // Sources & Analysis
  const [sources, setSources] = useState<SourceOut[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisOut | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Questions
  const [backendQuestions, setBackendQuestions] = useState<ApiQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Statements
  const [backendStatements, setBackendStatements] = useState<ApiStatement[]>([]);
  const [statementsLoading, setStatementsLoading] = useState(false);

  // Handover View & Receipt
  const [handoverView, setHandoverView] = useState<HandoverView | null>(null);
  const [handoverViewLoading, setHandoverViewLoading] = useState(false);
  const [handoverViewError, setHandoverViewError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<HandoverReceipt | null>(null);

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  // ─── AUTHENTICATION (docs/api.md) ──────────────────────────────────────────

  const checkCurrentUser = useCallback(async () => {
    setAuthLoading(true);
    const res = await HandoverApiService.me();
    if (res.data) {
      setAuthUser(res.data);
    } else {
      setAuthUser(null);
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    checkCurrentUser();
  }, [checkCurrentUser]);

  const login = useCallback(async (email: string, password = 'password123'): Promise<boolean> => {
    clearMessages();
    const res = await HandoverApiService.login(email, password);
    if (res.data) {
      setAuthUser(res.data);
      return true;
    }
    setErrorMessage(res.error || 'Login failed. Please check credentials.');
    return false;
  }, [clearMessages]);

  const register = useCallback(async (email: string, name: string, password = 'password123'): Promise<boolean> => {
    clearMessages();
    const res = await HandoverApiService.register(email, name, password);
    if (res.data) {
      setAuthUser(res.data);
      return true;
    }
    setErrorMessage(res.error || 'Registration failed.');
    return false;
  }, [clearMessages]);

  const logout = useCallback(async () => {
    await HandoverApiService.logout();
    setAuthUser(null);
    setActiveScreen('role-select');
    setHandovers([]);
    setActiveHandoverId(null);
    setActiveHandover(null);
  }, []);

  const switchDemoRole = useCallback(async (role: Role) => {
    clearMessages();
    setActiveRole(role);
    const cred = DEMO_CREDENTIALS[role];
    if (cred) {
      const user = await HandoverApiService.ensureDemoAuth(cred.email, cred.name, 'password123');
      if (user) {
        setAuthUser(user);
      }
    }
  }, [clearMessages]);

  // ─── HANDOVERS (docs/api.md) ───────────────────────────────────────────────

  const refreshHandovers = useCallback(async () => {
    const res = await HandoverApiService.listHandovers();
    if (res.data) {
      setHandovers(res.data);
      if (res.data.length > 0) {
        const match = res.data.find((h) => h.id === activeHandoverId);
        if (match) {
          setActiveHandover(match);
        } else {
          setActiveHandoverId(res.data[0].id);
          setActiveHandover(res.data[0]);
        }
      }
    }
  }, [activeHandoverId]);

  useEffect(() => {
    if (authUser) {
      refreshHandovers();
    }
  }, [authUser, refreshHandovers]);

  const selectHandover = useCallback(async (id: number) => {
    setActiveHandoverId(id);
    const res = await HandoverApiService.getHandover(id);
    if (res.data) {
      setActiveHandover(res.data);
    }
  }, []);

  const createHandover = useCallback(async (title: string, projectName: string): Promise<number | null> => {
    clearMessages();
    const res = await HandoverApiService.createHandover(title, projectName);
    if (res.data) {
      const newId = res.data.id;
      setActiveHandoverId(newId);
      setActiveHandover(res.data);
      setSuccessMessage(`Handover #${newId} created successfully.`);

      // Automatically register & invite Asha (departing) and Kiran (incoming) to this handover
      try {
        await HandoverApiService.ensureDemoAuth(DEMO_CREDENTIALS.departing.email, DEMO_CREDENTIALS.departing.name, 'password123');
        await HandoverApiService.ensureDemoAuth(DEMO_CREDENTIALS.incoming.email, DEMO_CREDENTIALS.incoming.name, 'password123');
        // Re-authenticate as Deepak (lead) to add members
        await HandoverApiService.login(DEMO_CREDENTIALS.lead.email, 'password123');
        await HandoverApiService.addMember(newId, DEMO_CREDENTIALS.departing.email, 'departing');
        await HandoverApiService.addMember(newId, DEMO_CREDENTIALS.incoming.email, 'incoming');
      } catch (err) {
        console.warn('Member auto-add notice:', err);
      }

      await refreshHandovers();
      return newId;
    }
    setErrorMessage(res.error || 'Failed to create handover.');
    return null;
  }, [clearMessages, refreshHandovers]);

  const addMember = useCallback(async (email: string, role: Role): Promise<boolean> => {
    if (!activeHandoverId) return false;
    clearMessages();
    const res = await HandoverApiService.addMember(activeHandoverId, email, role);
    if (res.data) {
      setSuccessMessage(`Added ${res.data.name} as ${role}.`);
      const membersRes = await HandoverApiService.listMembers(activeHandoverId);
      if (membersRes.data) setMembers(membersRes.data);
      return true;
    }
    setErrorMessage(res.error || 'Failed to add member.');
    return false;
  }, [activeHandoverId, clearMessages]);

  // Load members when active handover changes
  useEffect(() => {
    if (activeHandoverId && activeRole === 'lead') {
      HandoverApiService.listMembers(activeHandoverId).then((res) => {
        if (res.data) setMembers(res.data);
      });
    }
  }, [activeHandoverId, activeRole]);

  // ─── SOURCES & ANALYSIS (docs/api.md) ──────────────────────────────────────

  const refreshSources = useCallback(async () => {
    if (!activeHandoverId) return;
    const res = await HandoverApiService.listSources(activeHandoverId);
    if (res.data) {
      setSources(res.data);
    }
  }, [activeHandoverId]);

  useEffect(() => {
    if (activeHandoverId && activeRole === 'lead') {
      refreshSources();
    }
  }, [activeHandoverId, activeRole, refreshSources]);

  const uploadSyntheticSources = useCallback(async () => {
    if (!activeHandoverId) {
      setErrorMessage('Please create a handover first before uploading sources.');
      return { success: 0, failed: 0, errors: ['Please create a handover first.'] };
    }
    clearMessages();
    const result = await HandoverApiService.uploadSyntheticManifestSources(activeHandoverId);
    await refreshSources();
    if (result.failed > 0) {
      setErrorMessage(`Uploaded ${result.success} sources, ${result.failed} failed: ${result.errors.join(', ')}`);
    } else {
      setSuccessMessage(`All ${result.success} synthetic sources uploaded successfully.`);
    }
    return result;
  }, [activeHandoverId, clearMessages, refreshSources]);

  const uploadCustomSource = useCallback(
    async (file: File, type: 'repo' | 'doc' | 'chat' | 'tasks', name: string, allowedRoles = ['lead', 'departing', 'incoming']): Promise<boolean> => {
      if (!activeHandoverId) return false;
      clearMessages();
      const res = await HandoverApiService.uploadSource(activeHandoverId, file, type, name, allowedRoles);
      if (res.data) {
        setSuccessMessage(`Uploaded ${name} (${res.data.piece_count} pieces extracted).`);
        await refreshSources();
        return true;
      }
      setErrorMessage(res.error || 'Failed to upload source file.');
      return false;
    },
    [activeHandoverId, clearMessages, refreshSources]
  );

  const triggerAnalysis = useCallback(async () => {
    if (!activeHandoverId) return;
    clearMessages();
    setIsAnalyzing(true);
    const res = await HandoverApiService.triggerAnalysis(activeHandoverId);
    if (res.error) {
      setIsAnalyzing(false);
      setErrorMessage(res.error);
      return;
    }

    // Poll until done or failed
    const pollInterval = setInterval(async () => {
      const pollRes = await HandoverApiService.getAnalysis(activeHandoverId);
      if (pollRes.data) {
        setAnalysis(pollRes.data);
        if (pollRes.data.status === 'done' || pollRes.data.status === 'failed') {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          if (pollRes.data.status === 'done') {
            setSuccessMessage(`AI Analysis completed (${pollRes.data.counts?.verified || 0} verified, ${pollRes.data.counts?.conflicting || 0} conflicting).`);
            // Refresh questions and statements
            const qRes = await HandoverApiService.listQuestions(activeHandoverId);
            if (qRes.data) setBackendQuestions(qRes.data);
            const sRes = await HandoverApiService.listStatements(activeHandoverId);
            if (sRes.data) setBackendStatements(sRes.data);
          } else {
            setErrorMessage(pollRes.data.notice || 'AI analysis failed.');
          }
        }
      }
    }, 2000);
  }, [activeHandoverId, clearMessages]);

  // ─── QUESTIONS (docs/api.md) ───────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    if (!activeHandoverId) return;
    setQuestionsLoading(true);
    const res = await HandoverApiService.listQuestions(activeHandoverId);
    if (res.data) {
      setBackendQuestions(res.data);
    }
    setQuestionsLoading(false);
  }, [activeHandoverId]);

  useEffect(() => {
    if (activeHandoverId && (activeRole === 'departing' || activeRole === 'lead')) {
      loadQuestions();
    }
  }, [activeHandoverId, activeRole, loadQuestions]);

  const answerQuestionApi = useCallback(
    async (questionId: number, action: 'answer' | 'skip' | 'unknown', text?: string): Promise<boolean> => {
      clearMessages();
      const res = await HandoverApiService.answerQuestion(questionId, action, text);
      if (res.data) {
        setSuccessMessage(action === 'answer' ? 'Answer saved.' : action === 'skip' ? 'Question skipped.' : 'Marked as unknown.');
        await loadQuestions();
        if (activeHandoverId) {
          const sRes = await HandoverApiService.listStatements(activeHandoverId);
          if (sRes.data) setBackendStatements(sRes.data);
        }
        return true;
      }
      setErrorMessage(res.error || 'Failed to submit response.');
      return false;
    },
    [activeHandoverId, clearMessages, loadQuestions]
  );

  // ─── STATEMENTS & REVIEW (docs/api.md) ──────────────────────────────────────

  const loadStatements = useCallback(async () => {
    if (!activeHandoverId || activeRole !== 'lead') return;
    setStatementsLoading(true);
    const res = await HandoverApiService.listStatements(activeHandoverId);
    if (res.data) {
      setBackendStatements(res.data);
    }
    setStatementsLoading(false);
  }, [activeHandoverId, activeRole]);

  useEffect(() => {
    if (activeHandoverId && activeRole === 'lead') {
      loadStatements();
    }
  }, [activeHandoverId, activeRole, loadStatements]);

  const editStatementApi = useCallback(
    async (statementId: number, text: string, reason?: string): Promise<boolean> => {
      clearMessages();
      const res = await HandoverApiService.editStatement(statementId, text, reason);
      if (res.data) {
        setSuccessMessage('Statement updated successfully.');
        await loadStatements();
        return true;
      }
      setErrorMessage(res.error || 'Failed to edit statement.');
      return false;
    },
    [clearMessages, loadStatements]
  );

  const rejectStatementApi = useCallback(
    async (statementId: number, reason: string): Promise<boolean> => {
      clearMessages();
      const res = await HandoverApiService.rejectStatement(statementId, reason);
      if (res.data) {
        setSuccessMessage('Statement rejected.');
        await loadStatements();
        return true;
      }
      setErrorMessage(res.error || 'Failed to reject statement.');
      return false;
    },
    [clearMessages, loadStatements]
  );

  const resolveStatementApi = useCallback(
    async (statementId: number, chosenPieceId: number, reason: string, text?: string): Promise<boolean> => {
      clearMessages();
      const res = await HandoverApiService.resolveStatement(statementId, chosenPieceId, reason, text);
      if (res.data) {
        setSuccessMessage('Conflict resolved and marked verified.');
        await loadStatements();
        return true;
      }
      setErrorMessage(res.error || 'Failed to resolve conflict.');
      return false;
    },
    [clearMessages, loadStatements]
  );

  const acceptGapApi = useCallback(
    async (statementId: number, reason: string): Promise<boolean> => {
      clearMessages();
      const res = await HandoverApiService.acceptGap(statementId, reason);
      if (res.data) {
        setSuccessMessage('Gap accepted as known unknown.');
        await loadStatements();
        return true;
      }
      setErrorMessage(res.error || 'Failed to accept gap.');
      return false;
    },
    [clearMessages, loadStatements]
  );

  const getVersionsApi = useCallback(async (statementId: number): Promise<StatementVersion[]> => {
    const res = await HandoverApiService.getStatementVersions(statementId);
    return res.data || [];
  }, []);

  const approveHandoverApi = useCallback(async (): Promise<boolean> => {
    if (!activeHandoverId) return false;
    clearMessages();
    const res = await HandoverApiService.approveHandover(activeHandoverId);
    if (res.data) {
      setSuccessMessage('Handover approved and published to Incoming Member!');
      setActiveHandover(res.data);
      await refreshHandovers();
      return true;
    }
    setErrorMessage(res.error || 'Failed to approve handover.');
    return false;
  }, [activeHandoverId, clearMessages, refreshHandovers]);

  // ─── INCOMING MEMBER VIEW & RECEIPT (docs/api.md) ──────────────────────────

  const loadHandoverView = useCallback(async () => {
    if (!activeHandoverId) return;
    setHandoverViewLoading(true);
    setHandoverViewError(null);

    const res = await HandoverApiService.getHandoverView(activeHandoverId);
    if (res.data) {
      setHandoverView(res.data);
    } else if (res.status === 409) {
      setHandoverView(null);
      setHandoverViewError('Handover has not been approved by the Team Lead yet. Once approved, the knowledge base will be unlocked.');
    } else {
      setHandoverViewError(res.error || 'Could not load handover view.');
    }

    // Also check receipt
    const receiptRes = await HandoverApiService.getReceipt(activeHandoverId);
    if (receiptRes.data) {
      setReceipt(receiptRes.data);
    } else {
      setReceipt(null);
    }

    setHandoverViewLoading(false);
  }, [activeHandoverId]);

  useEffect(() => {
    if (activeHandoverId && activeRole === 'incoming') {
      loadHandoverView();
    }
  }, [activeHandoverId, activeRole, loadHandoverView]);

  const confirmReceiptApi = useCallback(async (): Promise<boolean> => {
    if (!activeHandoverId) return false;
    clearMessages();
    const res = await HandoverApiService.confirmReceipt(activeHandoverId);
    if (res.data) {
      setReceipt(res.data);
      setSuccessMessage('Handover receipt acknowledged successfully.');
      return true;
    }
    setErrorMessage(res.error || 'Failed to confirm receipt.');
    return false;
  }, [activeHandoverId, clearMessages]);

  const getPiece = useCallback(async (pieceId: number): Promise<PieceOut | null> => {
    const res = await HandoverApiService.getPiece(pieceId);
    return res.data;
  }, []);

  // ─── COMPATIBILITY ADAPTERS FOR EXISTING UI ───────────────────────────────

  const adaptedQuestions: Question[] = useMemo(() => {
    if (backendQuestions.length > 0) {
      return backendQuestions.map((bq) => {
        const primaryEvidence = bq.evidence[0];
        return {
          id: String(bq.id),
          category: 'Backend Architecture' as QuestionCategory,
          shortTitle: bq.text.slice(0, 40) + '...',
          question: bq.text,
          reason: primaryEvidence ? `${primaryEvidence.locator}: "${primaryEvidence.quote}"` : 'Identified during source analysis',
          roleTarget: 'Backend Developer',
          status: bq.status as QuestionStatus,
          evidenceStatus: (bq.risk >= 3 ? 'missing_conflicting' : bq.risk === 2 ? 'unverified' : 'verified') as EvidenceStatus,
        };
      });
    }
    return [];
  }, [backendQuestions]);

  const adaptedStatements: Statement[] = useMemo(() => {
    if (backendStatements.length > 0) {
      return backendStatements.map((bs) => ({
        id: String(bs.id),
        category: (bs.kind === 'decision' ? 'decision' : bs.kind === 'owner' ? 'ownership' : bs.kind === 'unfinished' ? 'unfinished' : 'risk') as any,
        title: bs.text.slice(0, 45) + '...',
        content: bs.text,
        evidenceStatus: (bs.label === 'conflicting' ? 'missing_conflicting' : bs.label) as EvidenceStatus,
        sourceLabel: bs.sources[0]?.source_name || bs.sources[0]?.locator,
        evidenceQuote: bs.sources[0]?.quote || undefined,
        departingAnswer: bs.kind === 'answer' ? bs.text : undefined,
      }));
    }
    return [];
  }, [backendStatements]);

  const adaptedGaps: Gap[] = useMemo(() => {
    return backendStatements
      .filter((bs) => bs.label === 'missing' || bs.label === 'conflicting')
      .map((bs) => ({
        id: String(bs.id),
        title: bs.text.slice(0, 50),
        description: bs.text,
        category: (bs.label === 'conflicting' ? 'conflicting' : 'missing') as 'missing' | 'conflicting',
        risk: bs.label === 'conflicting' ? 'High' : 'Medium',
        status: (bs.status === 'approved' || bs.status === 'accepted_gap' ? 'resolved' : 'open') as any,
        sourcesInConflict: bs.sources.map((s) => `${s.source_name} (${s.locator}): "${s.quote}"`),
      }));
  }, [backendStatements]);

  const currentProjectHandover: ProjectHandover = useMemo(() => {
    const isApproved = activeHandover?.status === 'approved';
    return {
      id: activeHandoverId ? String(activeHandoverId) : '1',
      name: activeHandover?.project_name || 'Campus Events App',
      description: activeHandover?.title || 'Campus event ticketing, live student registration portal, and ReportLab badge dispatch system.',
      objectives: 'Transition backend services to successor: SQLite WAL database, Render worker queues, ticket webhooks with exponential backoff, and resolve unowned tasks.',
      techStack: 'Python, FastAPI, SQLite (WAL), Render, Celery, ReportLab, Tailwind CSS',
      status: isApproved ? 'Approved' : 'Active Handover',
      departingMember: 'Asha',
      departingRole: 'Backend Developer',
      incomingMember: 'Kiran',
      githubRepo: 'https://github.com/campus-synthetic/events-app',
      documents: sources.map((s) => s.name),
      createdAt: activeHandover?.created_at || new Date().toISOString(),
      updatedAt: activeHandover?.approved_at || new Date().toISOString(),
      isApproved,
      approvedAt: activeHandover?.approved_at || undefined,
      approvedBy: isApproved ? 'Deepak' : undefined,
      receipt: {
        acknowledged: !!receipt,
        acknowledgedBy: receipt?.user_name,
        acknowledgedAt: receipt?.created_at,
        notes: receipt ? 'Confirmed receipt of project handover.' : undefined,
      },
      questions: adaptedQuestions,
      statements: adaptedStatements,
      evidencePieces: [],
      gaps: adaptedGaps,
    };
  }, [activeHandover, activeHandoverId, adaptedGaps, adaptedQuestions, adaptedStatements, receipt, sources]);

  const dashboardMetrics = useMemo(() => {
    return {
      totalProjects: handovers.length || 1,
      pendingHandovers: activeHandover?.status === 'draft' ? 1 : 0,
      awaitingApproval: activeHandover?.status === 'draft' && backendQuestions.some((q) => q.status === 'answered') ? 1 : 0,
      completedHandovers: receipt ? 1 : 0,
    };
  }, [activeHandover?.status, backendQuestions, handovers.length, receipt]);

  // Compatibility action handlers
  const saveAnswer = useCallback(
    async (questionId: string | number, answer: string) => {
      const numId = typeof questionId === 'number' ? questionId : parseInt(questionId, 10);
      if (!isNaN(numId)) {
        await answerQuestionApi(numId, 'answer', answer);
      }
    },
    [answerQuestionApi]
  );

  const saveFollowUpAnswer = useCallback((_qId: string | number, _ans: string) => {}, []);

  const markDontKnow = useCallback(
    async (questionId: string | number) => {
      const numId = typeof questionId === 'number' ? questionId : parseInt(questionId, 10);
      if (!isNaN(numId)) {
        await answerQuestionApi(numId, 'unknown');
      }
    },
    [answerQuestionApi]
  );

  const skipQuestion = useCallback(
    async (questionId: string | number) => {
      const numId = typeof questionId === 'number' ? questionId : parseInt(questionId, 10);
      if (!isNaN(numId)) {
        await answerQuestionApi(numId, 'skip');
      }
    },
    [answerQuestionApi]
  );

  const submitDepartingAnswers = useCallback(() => {}, []);

  const editStatement = useCallback(
    async (statementId: string | number, newContent: string) => {
      const numId = typeof statementId === 'number' ? statementId : parseInt(statementId, 10);
      if (!isNaN(numId)) {
        await editStatementApi(numId, newContent);
      }
    },
    [editStatementApi]
  );

  const rejectStatement = useCallback(
    async (statementId: string | number) => {
      const numId = typeof statementId === 'number' ? statementId : parseInt(statementId, 10);
      if (!isNaN(numId)) {
        await rejectStatementApi(numId, 'Rejected during lead verification');
      }
    },
    [rejectStatementApi]
  );

  const resolveGap = useCallback(
    async (gapId: string | number, reason: string, chosenPieceId?: number) => {
      const numId = typeof gapId === 'number' ? gapId : parseInt(gapId, 10);
      if (!isNaN(numId)) {
        if (chosenPieceId !== undefined) {
          await resolveStatementApi(numId, chosenPieceId, reason);
        } else {
          await acceptGapApi(numId, reason);
        }
      }
    },
    [acceptGapApi, resolveStatementApi]
  );

  const flagGap = useCallback((_gapId: string | number) => {}, []);

  const approveHandover = useCallback(async () => {
    await approveHandoverApi();
  }, [approveHandoverApi]);

  const acknowledgeReceipt = useCallback(async () => {
    await confirmReceiptApi();
  }, [confirmReceiptApi]);

  const createNewProject = useCallback(
    async (data: Partial<ProjectHandover>) => {
      const title = data.description ? data.description.slice(0, 100) : `${data.departingMember || 'Asha'} is leaving`;
      const projName = data.name || 'Campus Events App';
      await createHandover(title, projName);
    },
    [createHandover]
  );

  const resetDemoData = useCallback(async () => {
    clearMessages();
    setActiveScreen('role-select');
    await switchDemoRole('lead');
  }, [clearMessages, switchDemoRole]);

  const userProfile = useMemo(() => {
    const cred = DEMO_CREDENTIALS[activeRole];
    return {
      id: authUser ? String(authUser.id) : `user-${activeRole}`,
      name: authUser?.name || cred.name,
      email: authUser?.email || cred.email,
      role: activeRole,
      roleTitle: cred.roleTitle,
      avatar: cred.avatar,
    };
  }, [activeRole, authUser]);

  return (
    <HandoverContext.Provider
      value={{
        activeRole,
        setActiveRole,
        activeScreen,
        setActiveScreen,
        currentUser: userProfile,
        authUser,
        authLoading,
        login,
        register,
        logout,
        switchDemoRole,

        handovers,
        activeHandoverId,
        activeHandover,
        selectHandover,
        createHandover,
        members,
        addMember,
        refreshHandovers,

        sources,
        analysis,
        isAnalyzing,
        uploadSyntheticSources,
        uploadCustomSource,
        triggerAnalysis,
        refreshSources,

        questions: backendQuestions,
        questionsLoading,
        loadQuestions,
        answerQuestionApi,

        statements: backendStatements,
        statementsLoading,
        loadStatements,
        editStatementApi,
        rejectStatementApi,
        resolveStatementApi,
        acceptGapApi,
        getVersionsApi,
        approveHandoverApi,

        handoverView,
        handoverViewLoading,
        handoverViewError,
        receipt,
        loadHandoverView,
        confirmReceiptApi,
        getPiece,

        errorMessage,
        successMessage,
        clearMessages,

        project: currentProjectHandover,
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
