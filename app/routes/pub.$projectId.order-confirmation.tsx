import { useState, useEffect } from 'react';
import { useNavigate, useLoaderData } from 'react-router';
import type { Route } from '../+types/root';
import { StorefrontLayout } from '../storefront/StorefrontLayout';
import { orders as ordersApi, payments as paymentsApi } from '../lib/api';
import '../storefront/storefront.css';
import { resolveProject } from '../lib/project.server';

export async function loader({ params, request }: { params: { projectId: string; orderId: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) throw new Response('Not Found', { status: 404 });
  return {
    projectId: params.projectId,
    orderId: params.orderId,
    storeName: resolved.storeName,
    themeData: resolved.themeData,
    apiKey: resolved.apiKey,
  };
}

function OrderConfirmationContent() {
  const { orderId, projectId, apiKey } = useLoaderData() as any;
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Stripe dynamic credentials & mounting instances
  const [stripeConfig, setStripeConfig] = useState<{ publishableKey: string; currency: string } | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [cardElementInstance, setCardElementInstance] = useState<any>(null);
  const [cardholderName, setCardholderName] = useState('');

  // Load order details on mount
  useEffect(() => {
    ordersApi.get(orderId)
      .then(res => {
        setOrder(res);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('[OrderConfirmation] Error loading order details:', err);
        setError('Failed to load order details. Please check the order ID or try again.');
        setIsLoading(false);
      });
  }, [orderId]);

  // Fetch active merchant gateway credentials on mount
  useEffect(() => {
    paymentsApi.getActiveConfig(apiKey)
      .then(res => {
        if (res.success && res.data && res.data.publishableKey) {
          setStripeConfig({
            publishableKey: res.data.publishableKey,
            currency: res.data.currency || 'USD',
          });
        }
      })
      .catch(err => console.warn('[OrderConfirmation] Could not fetch gateway config:', err));
  }, [apiKey]);

  const isPaid = order?.paymentStatus === 'completed' || order?.paymentStatus === 'paid' || order?.status === 'paid';

  // Dynamically load Stripe.js and mount Element
  useEffect(() => {
    if (!isPaid && stripeConfig?.publishableKey) {
      const mountStripe = () => {
        if (!(window as any).Stripe) {
          console.warn('[OrderConfirmation] Stripe.js library is not loaded on window yet');
          return;
        }

        try {
          const stripe = (window as any).Stripe(stripeConfig.publishableKey);
          setStripeInstance(stripe);

          const elements = stripe.elements();
          const card = elements.create('card', {
            style: {
              base: {
                color: '#ffffff',
                fontFamily: 'Outfit, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                  color: 'rgba(255, 255, 255, 0.4)',
                },
              },
              invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
              },
            },
          });

          card.mount('#stripe-card-element');
          setCardElementInstance(card);
        } catch (err) {
          console.error('[OrderConfirmation] Error initializing Stripe Elements:', err);
        }
      };

      if (!(window as any).Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = mountStripe;
        document.head.appendChild(script);
      } else {
        const timeout = setTimeout(mountStripe, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [isPaid, stripeConfig]);

  const handleRetryPayment = async () => {
    setIsProcessing(true);
    setError(null);
    setStatusMessage(null);

    try {
      let paymentMethodId = 'pm_card_visa'; // fallback test card

      if (stripeInstance && cardElementInstance) {
        const { paymentMethod: stripeMethod, error: stripeErr } = await stripeInstance.createPaymentMethod({
          type: 'card',
          card: cardElementInstance,
          billing_details: {
            name: cardholderName || order?.shippingAddress?.fullName || 'Customer',
          },
        });

        if (stripeErr) {
          throw new Error(stripeErr.message || 'Credit card authorization failed');
        }
        paymentMethodId = stripeMethod.id;
      }

      // Re-trigger the payment on order-service
      const payResult = await ordersApi.pay(orderId, {
        paymentMethod: 'stripe',
        paymentMethodId: paymentMethodId,
        customerPhone: order?.customerPhone || order?.shippingAddress?.phone,
      });

      if (!payResult.success) {
        throw new Error(payResult.message || 'Payment processing failed.');
      }

      // Reload fresh order details to reflect DB updates
      const updatedOrder = await ordersApi.get(orderId);
      setOrder(updatedOrder);
      setStatusMessage('🎉 Payment completed and confirmed successfully!');

      // Trigger 2nd Meta Flow (Order Status Flow) on WhatsApp
      try {
        const customerPhone = updatedOrder?.customerPhone || updatedOrder?.shippingAddress?.phone || order?.customerPhone || order?.shippingAddress?.phone;
        const targetStoreId = updatedOrder?.storeId || order?.storeId;
        if (customerPhone && targetStoreId) {
          const apiBaseUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost')
            ? 'http://localhost:3000'
            : 'https://orcayo.wattlesol.com';
          await fetch(`${apiBaseUrl}/api/whatsapp/checkout/order-status-flow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storeId: targetStoreId,
              customerPhone: customerPhone,
              orderDetails: {
                orderId: updatedOrder?.id || orderId,
                orderNumber: updatedOrder?.orderNumber || orderId,
                total: updatedOrder?.total || 0,
                currency: updatedOrder?.currency || 'USD',
                items: updatedOrder?.orderItems || [],
              },
            }),
          });
        }
      } catch (flowErr) {
        console.warn('[OrderConfirmation] Could not trigger 2nd WhatsApp Flow:', flowErr);
      }
    } catch (err: any) {
      console.error('[OrderConfirmation] Error during payment retry:', err);
      setError(err.message || 'Failed to complete payment. Please check your card and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="sf-container" style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div className="spinner" style={{ margin: '0 auto 24px auto', width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--sf-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h3 style={{ color: 'var(--sf-text-muted)' }}>Retrieving your order details...</h3>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="sf-container" style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>⚠️</div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#ef4444' }}>Order Not Found</h1>
        <p style={{ color: 'var(--sf-text-muted)', marginBottom: '32px' }}>{error}</p>
        <button onClick={() => navigate(projectId ? `/pub/${projectId}` : '/storefront')} className="sf-btn-primary">Return to Shop</button>
      </div>
    );
  }

  const displayTotal = (order.total || 0) / 100;
  const displaySubtotal = (order.subtotal || 0) / 100;
  const displayShipping = (order.shipping || 0) / 100;
  const displayDiscount = (order.discount || 0) / 100;

  return (
    <div className="sf-container" style={{ padding: '60px 24px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* ── Status Header ─────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '5rem', marginBottom: '16px', animation: 'bounce 2s infinite' }}>
          {isPaid ? '🎉' : '💳'}
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px' }}>
          {isPaid ? 'Order Confirmed & Paid!' : 'Complete Your Card Payment'}
        </h1>
        <p style={{ color: 'var(--sf-text-muted)', fontSize: '1.1rem' }}>
          {isPaid 
            ? `Thank you for your purchase! Your payment has been confirmed and order is being prepared.`
            : `Your order #${order.orderNumber || order.id} is registered. Enter your card details below to complete secure payment via Stripe:`
          }
        </p>
      </div>

      {statusMessage && (
        <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', color: '#4ade80', fontSize: '1rem', fontWeight: 600, marginBottom: '32px', textAlign: 'center' }}>
          {statusMessage}
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#f87171', fontSize: '1rem', marginBottom: '32px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* ── Main Order Details Card ──────────────────────────────── */}
      <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10, 10, 15, 0.6)', backdropFilter: 'blur(20px)', marginBottom: '32px' }}>
        
        <div className="sf-order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--sf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Number</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>#{order.orderNumber || order.id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              display: 'inline-block', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 700,
              background: isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
              color: isPaid ? '#4ade80' : '#fbbf24',
              border: `1px solid ${isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`
            }}>
              {isPaid ? 'Paid' : 'Payment Pending'}
            </span>
          </div>
        </div>

        {/* ── Purchased Items ──────────────────────────────────────── */}
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Items Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {order.orderItems?.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.productName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)' }}>Qty: {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                ${((item.sellPrice / 100) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Order Summary Calculations ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--sf-text-muted)' }}>Subtotal</span>
            <span>${displaySubtotal.toFixed(2)}</span>
          </div>
          {displayShipping > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--sf-text-muted)' }}>Shipping</span>
              <span>${displayShipping.toFixed(2)}</span>
            </div>
          )}
          {displayDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4ade80' }}>
              <span style={{ color: 'var(--sf-text-muted)' }}>Discount</span>
              <span>-${displayDiscount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800, marginTop: '8px', color: 'var(--sf-primary)' }}>
            <span>Total Amount</span>
            <span>${displayTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Stripe Credit Card Payment Form for Unpaid Orders ────────────── */}
      {!isPaid && (
        <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15, 15, 25, 0.8)', backdropFilter: 'blur(20px)', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💳 Credit / Debit Card (Secure)
          </h3>
          <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
            Transactions are encrypted with 256-bit SSL security.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--sf-text-muted)', marginBottom: '6px' }}>Cardholder Name</label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Full Name on Card"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', fontSize: '1rem', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--sf-text-muted)', marginBottom: '6px' }}>Card Details</label>
              <div id="stripe-card-element" style={{ padding: '14px 16px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}></div>
            </div>

            <button 
              onClick={handleRetryPayment} 
              disabled={isProcessing}
              className="sf-btn-primary" 
              style={{ width: '100%', marginTop: '12px', padding: '18px 32px', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}
            >
              {isProcessing ? '⚡ Authorizing Card & Processing...' : `💳 Pay $${displayTotal.toFixed(2)} Now`}
            </button>
          </div>
        </div>
      )}

      {/* ── Interactive Actions ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button 
          onClick={() => navigate(projectId ? `/pub/${projectId}` : '/storefront')} 
          className={isPaid ? "sf-btn-primary" : "sf-btn-outline"} 
          style={{ minWidth: '240px', padding: '16px 32px', borderRadius: '14px', fontWeight: 700, justifyContent: 'center' }}
        >
          🛒 Continue Shopping
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

    </div>
  );
}

export default function OrderConfirmationPage({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey } = loaderData as any;
  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <OrderConfirmationContent />
    </StorefrontLayout>
  );
}
