import { describe, it, expect, vi } from 'vitest';
import { action } from '../../routes/builder';

// Mock server-only modules since they aren't needed for the action handler's redirection logic
vi.mock('../../lib/database.server', () => ({
  prisma: {}
}));

vi.mock('../../lib/auth.server', () => ({
  requireAuth: vi.fn()
}));

describe('Builder Route Action Handler', () => {
  it('should redirect POST requests with URL query parameters', async () => {
    const request = new Request('http://localhost:3000/?token=test-token&projectId=test-project', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/?projectId=test-project&token=test-token');
  });

  it('should extract parameters from JSON body and redirect', async () => {
    const request = new Request('http://localhost:3000/', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        token: 'json-token',
        projectId: 'json-project'
      })
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/?projectId=json-project&token=json-token');
  });

  it('should extract parameters from url-encoded body and redirect', async () => {
    const formData = new URLSearchParams();
    formData.append('token', 'form-token');
    formData.append('projectId', 'form-project');

    const request = new Request('http://localhost:3000/', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/?projectId=form-project&token=form-token');
  });
});
