import { describe, it, expect } from 'vitest';
import { loader } from '../../routes/catchall';

describe('Catchall Route Loader (Security Filter)', () => {
  it('should block suspicious .env requests with 403 status', async () => {
    const request = new Request('http://localhost:3000/.env');
    const response = await loader({ request, params: {}, context: {} } as any);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Access Forbidden');
  });

  it('should block suspicious wordpress requests with 403 status', async () => {
    const request = new Request('http://localhost:3000/wp-admin/index.php');
    const response = await loader({ request, params: {}, context: {} } as any);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Access Forbidden');
  });

  it('should block wlwmanifest request with 403 status', async () => {
    const request = new Request('http://localhost:3000/site/wp-includes/wlwmanifest.xml');
    const response = await loader({ request, params: {}, context: {} } as any);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Access Forbidden');
  });

  it('should return 404 status for normal missing routes', async () => {
    const request = new Request('http://localhost:3000/some-random-page');
    const response = await loader({ request, params: {}, context: {} } as any);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Page Not Found');
  });
});
