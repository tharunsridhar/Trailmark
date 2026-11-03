import { describe, it, expect, vi, afterEach } from 'vitest';
import { HandoverApiService } from '@/services/api';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('API client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the login cookie on every request', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, []));
    await HandoverApiService.listHandovers();
    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0][1] as RequestInit).credentials).toBe('include');
  });

  it('turns 401 into a visible message and returns no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(401, {}));
    const res = await HandoverApiService.listHandovers();
    expect(res.data).toBeNull();
    expect(res.status).toBe(401);
    expect(res.error).toMatch(/not signed in/i);
  });

  it('turns 403 into a visible message and returns no data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(403, {}));
    const res = await HandoverApiService.listHandovers();
    expect(res.data).toBeNull();
    expect(res.error).toMatch(/role is not allowed/i);
  });

  it('shows the server text when the server gives one', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(409, { detail: 'This handover is already approved' }));
    const res = await HandoverApiService.listHandovers();
    expect(res.error).toBe('This handover is already approved');
  });

  it('says the server cannot be reached when the network fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const res = await HandoverApiService.listHandovers();
    expect(res.data).toBeNull();
    expect(res.status).toBe(0);
    expect(res.error).toMatch(/cannot reach the trailmark server/i);
  });
});
