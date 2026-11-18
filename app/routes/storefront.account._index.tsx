import { useAuth, StorefrontLayout } from '../storefront/StorefrontLayout';
import '../storefront/storefront.css';

export default function AccountProfile() {
  const { customer, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <StorefrontLayout storeName="Account">
        <div className="sf-container" style={{ padding: '80px 24px' }}>
          <div className="sf-skeleton" style={{ height: '200px', borderRadius: '24px' }} />
        </div>
      </StorefrontLayout>
    );
  }

  if (!customer) {
    return (
      <StorefrontLayout storeName="Account">
        <div className="sf-container" style={{ padding: '100px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '24px' }}>👤</div>
          <h2>Please Sign In</h2>
          <p style={{ color: 'var(--sf-text-muted)', marginBottom: '32px' }}>
            You need to be logged in to view your account details.
          </p>
          <a href="/storefront" className="sf-btn-primary">Return Home</a>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout storeName="Account">
      <div className="sf-container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: '48px' }}>
          
          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/storefront/account" className="sf-btn-primary" style={{ justifyContent: 'flex-start' }}>Profile</a>
            <a href="/storefront/account/orders" className="sf-btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>My Orders</a>
            <button onClick={logout} className="sf-btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: '#f87171' }}>Sign Out</button>
          </div>

          {/* ── Content ───────────────────────────────────────────────── */}
          <div style={{ flex: 1 }}>
            <div className="glass" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '40px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  {customer.firstName[0]}{customer.lastName[0]}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{customer.firstName} {customer.lastName}</h1>
                  <p style={{ color: 'var(--sf-text-muted)' }}>Customer since {new Date().getFullYear()}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <label className="sf-label">Email Address</label>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)' }}>
                    {customer.email}
                  </div>
                </div>
                <div>
                  <label className="sf-label">Phone Number</label>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)' }}>
                    {customer.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <button className="sf-btn-outline" style={{ marginTop: '40px' }}>Edit Profile</button>
            </div>
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
}
