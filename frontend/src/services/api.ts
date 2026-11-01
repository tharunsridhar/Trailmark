import { ProjectHandover, Role } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Service client for Trailmark Backend API
 * Supports seamless fallback to local state if backend is offline.
 */
export const HandoverApiService = {
  /**
   * Fetch current project handover details
   */
  async getProject(projectId: string): Promise<ProjectHandover | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/handovers/${projectId}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Create a new project handover
   */
  async createProject(data: Partial<ProjectHandover>): Promise<ProjectHandover | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/handovers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Submit an answer to an AI question
   */
  async submitAnswer(questionId: string, answer: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Team Lead approval of handover
   */
  async approveHandover(projectId: string, approvedBy: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/handovers/${projectId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Incoming member acknowledgement
   */
  async acknowledgeReceipt(projectId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/handovers/${projectId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedBy }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
