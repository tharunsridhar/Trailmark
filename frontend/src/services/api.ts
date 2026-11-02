/**
 * Trailmark Backend API Client
 * Base URL: http://localhost:8000 (FastAPI)
 * Implements endpoints defined in docs/api.md.
 * Sends session cookies with credentials: "include" on every request.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserOut {
  id: number;
  email: string;
  name: string;
}

export interface HandoverOut {
  id: number;
  title: string;
  project_name: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  my_role: 'lead' | 'departing' | 'incoming';
}

export interface MemberOut {
  user_id: number;
  name: string;
  email: string;
  role: 'lead' | 'departing' | 'incoming';
}

export interface SourceOut {
  id: number;
  type: string;
  name: string;
  allowed_roles: string[];
  status: string;
  note: string | null;
  piece_count: number;
}

export interface PieceOut {
  id: number;
  source_id: number;
  source_name: string;
  locator: string;
  content: string;
}

export interface AnalysisOut {
  status: 'not_started' | 'running' | 'done' | 'failed';
  mode?: string | null;
  notice?: string | null;
  counts?: Record<string, number> | null;
  dropped?: number;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface QuestionEvidence {
  piece_id: number;
  locator: string;
  quote: string | null;
}

export interface ApiQuestion {
  id: number;
  text: string;
  risk: number;
  status: 'open' | 'answered' | 'skipped' | 'unknown';
  evidence: QuestionEvidence[];
  answer?: string | null;
}

export interface StatementSource {
  piece_id: number;
  locator: string;
  source_name: string;
  quote: string | null;
  chosen: boolean | null;
}

export interface ApiStatement {
  id: number;
  kind: string;
  text: string;
  label: 'verified' | 'unverified' | 'missing' | 'conflicting';
  status: 'draft' | 'approved' | 'rejected' | 'accepted_gap' | 'answered';
  current_version: number;
  sources: StatementSource[];
}

export interface StatementVersion {
  version: number;
  action: string;
  text: string;
  label: string;
  editor: string | null;
  reason: string | null;
  created_at: string;
}

export interface HandoverReceipt {
  handover_id: number;
  user_id: number;
  user_name: string;
  created_at: string;
}

export interface HandoverView {
  handover: {
    id: number;
    title: string;
    project_name: string;
    approved_at: string | null;
  };
  decisions: ApiStatement[];
  owns: ApiStatement[];
  unfinished: ApiStatement[];
  risks: ApiStatement[];
  dependencies: ApiStatement[];
  contacts: ApiStatement[];
  from_departing_member: ApiStatement[];
  open_questions: ApiStatement[];
  next_actions: Array<{
    order: number;
    text: string;
    statement_id: number;
    label: string;
    sources: StatementSource[];
  }>;
  receipt: HandoverReceipt | null;
}

function formatErrorDetail(detail: any): string {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.msg || item.message || JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || detail.error || JSON.stringify(detail);
  }
  return String(detail);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; status: number; error?: string }> {
  const url = `${API_BASE_URL}${path}`;
  const defaultHeaders: Record<string, string> = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include', // Mandate: Send session cookie on every request
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    });

    if (res.status === 204) {
      return { data: null, status: res.status };
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const formattedError = formatErrorDetail(data?.detail) || `HTTP ${res.status}`;
      return { data: null, status: res.status, error: formattedError };
    }

    return { data, status: res.status };
  } catch (err: any) {
    return { data: null, status: 0, error: err?.message || 'Network error' };
  }
}

export const HandoverApiService = {
  // ─── AUTH (docs/api.md) ──────────────────────────────────────────────────
  async register(email: string, name: string, password = 'password123') {
    return request<UserOut>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), name, password }),
    });
  },

  async login(email: string, password = 'password123') {
    return request<UserOut>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), password }),
    });
  },

  async logout() {
    return request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },

  async me() {
    return request<UserOut>('/auth/me');
  },

  /**
   * Helper to ensure the active persona has a live session cookie on localhost:8000.
   * Tries login first; if user does not exist, registers them.
   */
  async ensureDemoAuth(email: string, name: string, password = 'password123') {
    const loginRes = await this.login(email, password);
    if (loginRes.data) return loginRes.data;

    // If login failed (e.g. 401/404), auto-register to establish the cookie
    const regRes = await this.register(email, name, password);
    return regRes.data;
  },

  // ─── HANDOVERS (docs/api.md) ─────────────────────────────────────────────
  async createHandover(title: string, projectName: string) {
    return request<HandoverOut>('/handovers', {
      method: 'POST',
      body: JSON.stringify({ title, project_name: projectName }),
    });
  },

  async listHandovers() {
    return request<HandoverOut[]>('/handovers');
  },

  async getHandover(handoverId: number | string) {
    return request<HandoverOut>(`/handovers/${handoverId}`);
  },

  async listMembers(handoverId: number | string) {
    return request<MemberOut[]>(`/handovers/${handoverId}/members`);
  },

  async addMember(handoverId: number | string, email: string, role: 'lead' | 'departing' | 'incoming') {
    return request<MemberOut>(`/handovers/${handoverId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), role }),
    });
  },

  // ─── SOURCES (docs/api.md) ───────────────────────────────────────────────
  async uploadSource(
    handoverId: number | string,
    file: File,
    type: 'repo' | 'doc' | 'chat' | 'tasks',
    name: string,
    allowedRoles: string[] = ['lead', 'departing', 'incoming']
  ) {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    form.append('name', name);
    form.append('allowed_roles', JSON.stringify(allowedRoles));

    return request<SourceOut>(`/handovers/${handoverId}/sources`, {
      method: 'POST',
      body: form,
    });
  },

  async listSources(handoverId: number | string) {
    return request<SourceOut[]>(`/handovers/${handoverId}/sources`);
  },

  /**
   * Helper that reads all synthetic sources from manifest and uploads each to the backend.
   */
  async uploadSyntheticManifestSources(handoverId: number | string): Promise<{ success: number; failed: number; errors: string[] }> {
    // Read from Vercel public static route /synthetic/manifest.json first, fallback to API
    let manifest: any = null;
    try {
      const staticRes = await fetch('/synthetic/manifest.json');
      if (staticRes.ok) {
        manifest = await staticRes.json();
      }
    } catch {
      // ignore
    }

    if (!manifest) {
      const manifestRes = await fetch('/api/synthetic/manifest');
      if (!manifestRes.ok) throw new Error('Could not read synthetic manifest');
      manifest = await manifestRes.json();
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const src of manifest.sources) {
      try {
        let fileRes: Response | null = null;
        try {
          fileRes = await fetch(`/synthetic/${src.file}`);
        } catch {
          fileRes = null;
        }

        if (!fileRes || !fileRes.ok) {
          fileRes = await fetch(`/api/synthetic/file?path=${encodeURIComponent(src.file)}`);
        }

        if (!fileRes.ok) {
          failed++;
          errors.push(`Could not read ${src.file}`);
          continue;
        }
        const blob = await fileRes.blob();
        const filename = src.file.split('/').pop() || src.file;
        const file = new File([blob], filename);
        const uploadRes = await this.uploadSource(handoverId, file, src.type, src.name, src.allowed_roles);
        if (uploadRes.error) {
          failed++;
          errors.push(`${src.name}: ${uploadRes.error}`);
        } else {
          success++;
        }
      } catch (err: any) {
        failed++;
        errors.push(`${src.name}: ${err.message}`);
      }
    }
    return { success, failed, errors };
  },

  async getPiece(pieceId: number | string) {
    return request<PieceOut>(`/pieces/${pieceId}`);
  },

  // ─── ANALYSIS (docs/api.md) ──────────────────────────────────────────────
  async triggerAnalysis(handoverId: number | string) {
    return request<{ status: string }>(`/handovers/${handoverId}/analyze`, {
      method: 'POST',
    });
  },

  async getAnalysis(handoverId: number | string) {
    return request<AnalysisOut>(`/handovers/${handoverId}/analysis`);
  },

  // ─── QUESTIONS (docs/api.md) ─────────────────────────────────────────────
  async listQuestions(handoverId: number | string) {
    return request<ApiQuestion[]>(`/handovers/${handoverId}/questions`);
  },

  async answerQuestion(
    questionId: number | string,
    action: 'answer' | 'skip' | 'unknown',
    text?: string
  ) {
    return request<ApiQuestion>(`/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        ...(action === 'answer' ? { text: text || '' } : {}),
      }),
    });
  },

  // ─── REVIEW (docs/api.md) ────────────────────────────────────────────────
  async listStatements(
    handoverId: number | string,
    filters?: { kind?: string; label?: string; status?: string }
  ) {
    const params = new URLSearchParams();
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.label) params.set('label', filters.label);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString() ? `?${params.toString()}` : '';

    return request<ApiStatement[]>(`/handovers/${handoverId}/statements${qs}`);
  },

  async getStatement(statementId: number | string) {
    return request<ApiStatement>(`/statements/${statementId}`);
  },

  async editStatement(statementId: number | string, text: string, reason?: string) {
    return request<ApiStatement>(`/statements/${statementId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text, reason: reason || 'Lead edit' }),
    });
  },

  async rejectStatement(statementId: number | string, reason: string) {
    return request<ApiStatement>(`/statements/${statementId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async resolveStatement(
    statementId: number | string,
    chosenPieceId: number,
    reason: string,
    text?: string
  ) {
    return request<ApiStatement>(`/statements/${statementId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        chosen_piece_id: chosenPieceId,
        reason,
        ...(text ? { text } : {}),
      }),
    });
  },

  async acceptGap(statementId: number | string, reason: string) {
    return request<ApiStatement>(`/statements/${statementId}/accept-gap`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getStatementVersions(statementId: number | string) {
    return request<StatementVersion[]>(`/statements/${statementId}/versions`);
  },

  async approveHandover(handoverId: number | string) {
    return request<HandoverOut>(`/handovers/${handoverId}/approve`, {
      method: 'POST',
    });
  },

  // ─── INCOMING MEMBER (docs/api.md) ───────────────────────────────────────
  async getHandoverView(handoverId: number | string) {
    return request<HandoverView>(`/handovers/${handoverId}/handover-view`);
  },

  async confirmReceipt(handoverId: number | string) {
    return request<HandoverReceipt>(`/handovers/${handoverId}/receipt`, {
      method: 'POST',
    });
  },

  async getReceipt(handoverId: number | string) {
    return request<HandoverReceipt>(`/handovers/${handoverId}/receipt`);
  },
};
