export type Role = 'lead' | 'departing' | 'incoming';

export type EvidenceStatus = 'verified' | 'unverified' | 'missing_conflicting';

export type QuestionStatus = 'pending' | 'answered' | 'skipped' | 'unknown';

export type QuestionCategory =
  | 'Backend Architecture'
  | 'API Development'
  | 'Database & Migrations'
  | 'Technical Decisions'
  | 'Dependencies & Credentials'
  | 'Risks & Vulnerabilities'
  | 'Pending Tasks'
  | 'Code Ownership';

export interface FollowUpQuestion {
  id: string;
  question: string;
  reason?: string;
  answer?: string;
  status: 'pending' | 'answered' | 'skipped';
  answeredAt?: string;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  shortTitle: string;
  question: string;
  reason: string;
  roleTarget: string;
  status: QuestionStatus;
  answer?: string;
  followUp?: FollowUpQuestion;
  audioDurationSeconds?: number;
  hasVoiceRecording?: boolean;
  evidenceStatus: EvidenceStatus;
  updatedAt?: string;
}

export interface EvidencePiece {
  id: string;
  title: string;
  type: 'code' | 'commit' | 'doc' | 'chat' | 'task';
  sourceRef: string;
  quote: string;
  timestamp: string;
  author: string;
}

export interface Statement {
  id: string;
  category: 'decision' | 'ownership' | 'unfinished' | 'risk' | 'dependency';
  title: string;
  content: string;
  evidenceStatus: EvidenceStatus;
  evidenceId?: string;
  evidenceQuote?: string;
  sourceLabel?: string;
  sourceRef?: string;
  departingAnswer?: string;
}

export interface Gap {
  id: string;
  title: string;
  description: string;
  category: 'missing' | 'conflicting';
  risk: 'High' | 'Medium' | 'Low';
  sourcesInConflict?: string[];
  status: 'open' | 'resolved' | 'flagged';
  resolutionReason?: string;
}

export interface HandoverReceipt {
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  notes?: string;
}

export interface ProjectHandover {
  id: string;
  name: string;
  description: string;
  objectives: string;
  techStack: string;
  status: 'In Progress' | 'Pre-release' | 'Active Handover' | 'Approved' | 'Completed';
  departingMember: string;
  departingRole: string;
  incomingMember: string;
  githubRepo: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  receipt: HandoverReceipt;
  questions: Question[];
  statements: Statement[];
  evidencePieces: EvidencePiece[];
  gaps: Gap[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  roleTitle: string;
  avatar: string;
  email: string;
}
