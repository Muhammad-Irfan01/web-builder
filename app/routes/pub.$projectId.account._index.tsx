/**
 * Standalone Published Account — /pub/:projectId/account
 */
import type { Route } from '../+types/root';
import { useAuth, StorefrontLayout } from '../storefront/StorefrontLayout';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';

export async function loader({ params, request }: { params: { projectId: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) throw new Response('Not Found', { status: 404 });
  return { storeName: resolved.storeName, themeData: resolved.themeData, apiKey: resolved.apiKey };
}

function AccountContent() {
  const { customer, logout, isLoading } = useAuth();

  if (isLoading) return <div className="sf-skeleton" style={{ height: '200px', margin: '40px' }} />;

  if (!customer) return (
    <div className="sf-container" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '24px' }}>👤</div>
      <h2>Please Sign In</h2>
      <p style={{ color: 'var(--sf-text-muted)', marginBottom: '32px' }}>You need to be logged in to view your account.</p>
      <a href="../" className="sf-btn-primary">Return Home</a>
    </div>
  );

  return (
    <div className="sf-container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '48px' }}>
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href="." className="sf-btn-primary" style={{ justifyContent: 'flex-start' }}>Profile</a>
          <a href="orders" className="sf-btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>My Orders</a>
          <button onClick={logout} className="sf-btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: '#f87171' }}>Sign Out</button>
        </div>
        <div style={{ flex: 1 }}>
          <div className="glass" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{customer.firstName} {customer.lastName}</h1>
                <p style={{ color: 'var(--sf-text-muted)' }}>{customer.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PubAccount({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey } = loaderData as any;
  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <AccountContent />
    </StorefrontLayout>
  );
}
