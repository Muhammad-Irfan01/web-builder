import { useState, useEffect } from 'react';
import { useAuth, StorefrontLayout } from '../storefront/StorefrontLayout';
import { orders as ordersApi } from '../lib/api';
import type { Order } from '../lib/api';
import '../storefront/storefront.css';

export default function OrderHistory() {
  const { customer, logout, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      ordersApi.list()
        .then(data => setOrders(data))
        .catch(err => {
          console.error('[Orders] Fetch error:', err);
          // Mock data for demo
          setOrders([
            { id: 'ORD-12345', status: 'Delivered', total: 125.50, createdAt: new Date().toISOString(), items: [], shippingAddress: {} as any },
            { id: 'ORD-67890', status: 'Processing', total: 89.00, createdAt: new Date().toISOString(), items: [], shippingAddress: {} as any },
          ]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [customer]);

  if (authLoading) return <StorefrontLayout storeName="Orders"><div className="sf-container p-6"><div className="sf-skeleton" style={{ height: '300px' }} /></div></StorefrontLayout>;
  if (!customer) return <StorefrontLayout storeName="Orders"><div className="sf-container p-6">Please sign in to view orders.</div></StorefrontLayout>;

  return (
    <StorefrontLayout storeName="Account">
      <div className="sf-container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: '48px' }}>
          
          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/storefront/account" className="sf-btn-outline" style={{ justifyContent: 'flex-start', border: 'none' }}>Profile</a>
            <a href="/storefront/account/orders" className="sf-btn-primary" style={{ justifyContent: 'flex-start' }}>My Orders</a>
            <button onClick={logout} className="sf-btn-outline" style={{ justifyContent: 'flex-start', border: 'none', color: '#f87171' }}>Sign Out</button>
          </div>

          {/* ── Content ───────────────────────────────────────────────── */}
          <div style={{ flex: 1 }}>
            <div className="glass" style={{ padding: '40px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px' }}>Order History</h1>

              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div className="sf-skeleton" style={{ height: '80px' }} />
                   <div className="sf-skeleton" style={{ height: '80px' }} />
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sf-text-muted)' }}>
                  <p>You haven't placed any orders yet.</p>
                  <a href="/storefront/products" className="sf-btn-primary" style={{ marginTop: '20px' }}>Start Shopping</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '20px', borderRadius: '12px', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)' 
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>Order #{order.id}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--sf-primary)', marginBottom: '4px' }}>${order.total.toFixed(2)}</div>
                        <div style={{ 
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', 
                          padding: '3px 10px', borderRadius: '99px', background: 'rgba(52,211,153,0.1)', color: '#34d399', display: 'inline-block' 
                        }}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
}
