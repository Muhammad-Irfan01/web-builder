/**
 * Standalone Published Checkout — /pub/:projectId/checkout
 */
import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { useCart, StorefrontLayout, useStorefrontTheme } from '../storefront/StorefrontLayout';
import { checkout as checkoutApi, payments as paymentsApi, orders as ordersApi, setClientStoreId } from '../lib/api';
import type { ShippingRate, Address } from '../lib/api';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';

export async function loader({ params, request }: { params: { projectId: string }; request: Request }) {
  const resolved = await resolveProject(request, params.projectId);
  if (!resolved) throw new Response('Not Found', { status: 404 });

  const { prisma } = await import('../lib/database.server');
  let whatsappPhone: string | null = null;
  if (resolved.storeId) {
    try {
      const records: any[] = await prisma.$queryRaw`
        SELECT "phone_number" FROM "whatsapp"."whatsapp_accounts" 
        WHERE "store_id" = ${resolved.storeId} AND "is_active" = true 
        LIMIT 1
      `;
      whatsappPhone = records[0]?.phone_number || null;
    } catch (err) {
      console.error('Failed to query WhatsApp account phone:', err);
    }
  }

  return { 
    storeName: resolved.storeName, 
    themeData: resolved.themeData, 
    apiKey: resolved.apiKey, 
    storeId: resolved.storeId,
    whatsappPhone,
  };
}

function PubCheckoutContent({ storeId, apiKey, whatsappPhone }: { storeId?: string; apiKey?: string; whatsappPhone?: string | null }) {
  const { theme } = useStorefrontTheme();
  if (storeId) {
    setClientStoreId(storeId);
  }
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp Existing Order state
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [urlOrderId, setUrlOrderId] = useState<string | null>(null);
  
  // Stripe dynamic credentials & mounting instances
  const [stripeConfig, setStripeConfig] = useState<{ publishableKey: string; currency: string } | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [cardElementInstance, setCardElementInstance] = useState<any>(null);

  // Gateway config and payment method selection
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pay_later'>('card');

  // Split phone states
  const [phoneCountryCode, setPhoneCountryCode] = useState('+92');
  const [phoneAreaCode, setPhoneAreaCode] = useState('');
  const [phoneSubscriber, setPhoneSubscriber] = useState('');

  const [address, setAddress] = useState<Address>({
    fullName: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
  });

  // Keep address.phone updated as user types split number
  useEffect(() => {
    const cleanArea = phoneAreaCode.replace(/\D/g, '').slice(0, 3);
    const cleanSub = phoneSubscriber.replace(/\D/g, '').slice(0, 7);
    setAddress(prev => ({
      ...prev,
      phone: `${phoneCountryCode}${cleanArea}${cleanSub}`
    }));
  }, [phoneCountryCode, phoneAreaCode, phoneSubscriber]);

  const items: any[] = existingOrder && existingOrder.orderItems
    ? existingOrder.orderItems.map((i: any) => ({
        id: i.id || i.productId,
        productId: i.productId,
        name: i.productName,
        price: (i.sellPrice || 0) / 100,
        quantity: i.quantity || 1,
        image: i.image || 'https://via.placeholder.com/150',
      }))
    : (cartItems || []);

  const subtotal = existingOrder ? ((existingOrder.subtotal || 0) / 100) : (cartSubtotal || 0);

  // Fetch active merchant gateway credentials on mount
  useEffect(() => {
    paymentsApi.getActiveConfig(apiKey)
      .then(res => {
        if (res.success && res.data) {
          setGatewayConfig(res.data);
          const hasCard = res.data.gatewayType === 'stripe' && res.data.publishableKey;
          const hasPayLater = res.data.enabledPaymentMethods?.includes('pay_later');

          if (hasCard) {
            setStripeConfig({
              publishableKey: res.data.publishableKey || '',
              currency: res.data.currency || 'USD',
            });
            setPaymentMethod('card');
          } else if (hasPayLater) {
            setPaymentMethod('pay_later');
          }
        }
      })
      .catch(err => {
        console.warn('[PubCheckout] Active merchant payment gateway could not be retrieved:', err);
      });
  }, [apiKey]);

  // Load existing order details if orderId is present in search parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oId = params.get('orderId');
      if (oId) {
        setUrlOrderId(oId);
        setIsLoadingExisting(true);
        ordersApi.get(oId)
          .then(res => {
            if (res) {
              setExistingOrder(res);
              // Pre-populate address if available
              if (res.shippingAddress) {
                const phoneVal = res.shippingAddress.phone || '';
                let cc = '+92';
                let area = '';
                let sub = '';

                if (phoneVal.startsWith('+')) {
                  if (phoneVal.startsWith('+92')) {
                    cc = '+92';
                    const rest = phoneVal.substring(3);
                    area = rest.substring(0, 3);
                    sub = rest.substring(3);
                  } else if (phoneVal.startsWith('+1')) {
                    cc = '+1';
                    const rest = phoneVal.substring(2);
                    area = rest.substring(0, 3);
                    sub = rest.substring(3);
                  } else {
                    cc = phoneVal.substring(0, 3);
                    const rest = phoneVal.substring(3);
                    area = rest.substring(0, 3);
                    sub = rest.substring(3);
                  }
                } else if (phoneVal.startsWith('0')) {
                  cc = '+92';
                  area = phoneVal.substring(1, 4);
                  sub = phoneVal.substring(4);
                } else {
                  area = phoneVal.substring(0, 3);
                  sub = phoneVal.substring(3);
                }

                setPhoneCountryCode(cc);
                setPhoneAreaCode(area.slice(0, 3));
                setPhoneSubscriber(sub.slice(0, 7));

                setAddress({
                  fullName: res.shippingAddress.fullName || '',
                  line1: res.shippingAddress.line1 || '',
                  city: res.shippingAddress.city || '',
                  state: res.shippingAddress.state || '',
                  postalCode: res.shippingAddress.postalCode || '',
                  country: res.shippingAddress.country || 'United States',
                  phone: phoneVal,
                });
              }
            }
          })
          .catch(err => {
            console.error('[PubCheckout] Error loading existing order:', err);
            setError('Failed to load order details. Please check the link or contact support.');
          })
          .finally(() => {
            setIsLoadingExisting(false);
          });
      }
    }
  }, []);

  // Dynamically load Stripe.js and mount Element
  useEffect(() => {
    if (step === 'payment' && stripeConfig?.publishableKey) {
      const mountStripe = () => {
        if (!(window as any).Stripe) {
          console.warn('[PubCheckout] Stripe.js library is not loaded on window yet');
          return;
        }

        try {
          const stripe = (window as any).Stripe(stripeConfig.publishableKey);
          setStripeInstance(stripe);

          const elements = stripe.elements();
          const card = elements.create('card', {
            style: {
              base: {
                color: theme?.colorText || '#ffffff',
                fontFamily: theme?.fontBody || 'Outfit, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                  color: theme?.colorTextMuted || 'rgba(255, 255, 255, 0.4)',
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
          console.error('[PubCheckout] Error initializing Stripe Elements:', err);
          setError('Failed to load secure credit card payment fields.');
        }
      };

      if (!(window as any).Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = mountStripe;
        document.head.appendChild(script);
      } else {
        // Let React finish painting the container, then initialize Card Elements
        const timeout = setTimeout(mountStripe, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [step, stripeConfig]);

  // Load shipping rates when cart is ready or existing order is loaded
  useEffect(() => {
    if (items.length > 0 || existingOrder) {
      checkoutApi.getRates(existingOrder ? existingOrder.id : 'current-cart')
        .then(r => {
          // Handle both raw array and { data: [] } response formats
          const ratesArray = Array.isArray(r) ? r : (r as any)?.data;
          if (Array.isArray(ratesArray) && ratesArray.length > 0 && typeof ratesArray[0].price === 'number') {
            setRates(ratesArray);
            setSelectedRate(ratesArray[0].id);
          } else {
            throw new Error('No shipping rates configured');
          }
        })
        .catch(() => {
          setRates([
            { id: 'std', name: 'Standard Shipping', price: 5.99, estimatedDays: '3-5 days' },
            { id: 'exp', name: 'Express Delivery', price: 15.00, estimatedDays: '1-2 days' },
          ]);
          setSelectedRate('std');
        });
    }
  }, [items, existingOrder]);

  const shippingPrice = Array.isArray(rates) ? (rates.find(r => r.id === selectedRate)?.price || 0) : 0;
  const total = (subtotal || 0) + (shippingPrice || 0);

  const handlePay = async () => {
    if (!selectedRate || !Array.isArray(rates)) return;
    setIsProcessing(true);
    setError(null);

    try {
      let paymentMethodId = 'pay_later';

      // Tokenize credit card details securely on Stripe's server if card is selected
      if (paymentMethod === 'card') {
        paymentMethodId = 'pm_card_visa'; // Fallback standard test token if no Stripe elements configured
        if (stripeInstance && cardElementInstance) {
          const { paymentMethod: stripeMethod, error: stripeErr } = await stripeInstance.createPaymentMethod({
            type: 'card',
            card: cardElementInstance,
            billing_details: {
              name: address.fullName,
              phone: address.phone,
            },
          });

          if (stripeErr) {
            throw new Error(stripeErr.message || 'Credit card authorization failed');
          }

          paymentMethodId = stripeMethod.id;
        }
      }

      let activeOrderId = urlOrderId;

      if (!activeOrderId) {
        // 1. Persist the Order in the POS Orders DB Schema (Status: pending)
        const orderData = {
          C_ID: 1, // Default walkthrough guest customer ID
          branchId: 'default-branch',
          total: Math.round(total * 100), // convert to cents for POS schema
          subtotal: Math.round(subtotal * 100),
          shipping: Math.round(shippingPrice * 100),
          orderItems: items.map((i: any) => ({
            productId: i.productId,
            quantity: i.quantity,
            basePrice: Math.round(i.price * 100),
            sellPrice: Math.round(i.price * 100),
            productName: i.name,
          })),
          source: 'WEB_STOREFRONT',
        };

        // Create the POS order directly
        const freshOrder = await ordersApi.create(orderData);
        activeOrderId = freshOrder?.id || freshOrder?.data?.id;

        if (!activeOrderId) {
          throw new Error('Failed to create storefront POS order.');
        }
      }

      // Process payment and correlate POS order with subscription payment
      const payResult = await ordersApi.pay(activeOrderId, {
        paymentMethod: paymentMethod === 'pay_later' ? 'pay_later' : 'stripe',
        paymentMethodId: paymentMethodId,
        returnUrl: window.location.href,
        customerPhone: address.phone,
      });

      if (!payResult.success) {
        throw new Error(payResult.message || 'Payment correlation failed.');
      }

      // Trigger WhatsApp checkout confirmation if this checkout originated from an existing WhatsApp order
      if (urlOrderId && paymentMethod !== 'pay_later') {
        try {
          await checkoutApi.confirmOrder({
            customerPhone: address.phone,
            orderDetails: {
              orderId: activeOrderId,
              total: total,
              currency: stripeConfig?.currency || 'PKR',
              items: items.map((i: any) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
              })),
            },
          });
          console.log('[PubCheckout] Sent confirmOrder callback to whatsapp service');
        } catch (confirmErr) {
          console.warn('[PubCheckout] Failed to trigger WhatsApp checkout confirmation:', confirmErr);
        }
      }

      const confirmedOrderId = payResult.order?.orderNumber || activeOrderId;

      setOrderId(confirmedOrderId);
      setStep('success');

      // Clear shopping cart upon transaction completion
      if (typeof clearCart === 'function') clearCart();
    } catch (err: any) {
      console.error('[PubCheckout] Error:', err);
      setError(err.message || 'An unexpected error occurred during payment processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingExisting) {
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

  if (step === 'success') {
    const isPayLater = paymentMethod === 'pay_later';
    const cleanPhone = whatsappPhone ? whatsappPhone.replace(/\+/g, '') : '';
    const whatsappLink = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(isPayLater ? `Complete Payment for Order ${orderId}` : `Track Order ${orderId}`)}`
      : null;

    return (
      <div className="sf-container" style={{ textAlign: 'center', padding: '100px 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>{isPayLater ? '⏳' : '🎉'}</div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          {isPayLater ? 'Order Received!' : 'Order Confirmed!'}
        </h1>
        <p style={{ color: 'var(--sf-text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
          {isPayLater ? (
            <>
              Your order has been received, but your payment is still pending.
              Please check your WhatsApp (<strong>{address.phone}</strong>) to make the payment and confirm your order at your ease.
            </>
          ) : (
            <>
              Thank you for your purchase. Your order <strong>#{orderId}</strong> is being processed.
            </>
          )}
        </p>

        {whatsappLink && (
          <div style={{ margin: '24px auto 32px auto', padding: '24px', maxWidth: '480px', borderRadius: '16px', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
            <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>{isPayLater ? 'Complete Payment via WhatsApp' : 'Check Order Status via WhatsApp'}</h4>
            <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
              {isPayLater ? 'Your order is pending. Click the button below to message us and complete your payment.' : 'You can track your order status at any time by messaging us on WhatsApp. Click the button below to message us.'}
            </p>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="sf-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff', border: 'none', padding: '12px 24px', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.016 14.062.99 11.436.99c-5.439 0-9.863 4.372-9.867 9.8.002 2.11.588 4.177 1.694 5.954l-1.005 3.676 3.776-.99.577.34c1.636.965 3.142 1.485 4.523 1.484zM17.476 14.3c-.326-.163-1.93-.953-2.229-1.062-.3-.11-.518-.163-.735.163-.217.327-.842 1.062-1.032 1.28-.19.218-.38.245-.706.082-.326-.163-1.378-.508-2.625-1.622-.97-.866-1.625-1.936-1.815-2.263-.19-.327-.02-.504.143-.666.147-.146.326-.38.489-.571.163-.19.217-.327.326-.54.109-.218.054-.409-.027-.572-.082-.163-.735-1.77-1.007-2.424-.265-.636-.53-.55-.735-.56-.19-.009-.408-.01-.625-.01-.218 0-.571.082-.87.408-.299.327-1.142 1.116-1.142 2.721 0 1.605 1.169 3.159 1.329 3.377.16.218 2.3 3.511 5.572 4.927.778.337 1.385.538 1.859.689.782.248 1.493.213 2.056.129.627-.094 1.93-.79 2.201-1.55.272-.759.272-1.409.19-1.55-.081-.141-.299-.222-.625-.385z"/></svg>
              {isPayLater ? 'Pay via WhatsApp' : 'Check Order Status'}
            </a>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <a href="../" className={whatsappLink ? "sf-btn-outline" : "sf-btn-primary"}>Return to Shop</a>
        </div>
      </div>
    );
  }


  return (
    <div className="sf-container" style={{ padding: '40px 24px' }}>
      <h1 className="sf-section-title">Checkout</h1>
      <div className="sf-checkout-layout-grid">
        <div className="sf-checkout-form-container">
          {step === 'info' && (
            <div className="glass" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '24px' }}>Shipping Information</h3>
              <form onSubmit={e => { e.preventDefault(); setStep('payment'); }}
                className="sf-checkout-shipping-grid">
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="sf-label">Full Name</label>
                  <input className="sf-input" required value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="sf-label">Street Address</label>
                  <input className="sf-input" required value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} />
                </div>
                <div><label className="sf-label">City</label><input className="sf-input" required value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} /></div>
                <div><label className="sf-label">State</label><input className="sf-input" required value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} /></div>
                <div><label className="sf-label">Postal Code</label><input className="sf-input" required value={address.postalCode} onChange={e => setAddress({ ...address, postalCode: e.target.value })} /></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="sf-label">Phone Number (WhatsApp)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 1fr', gap: '8px' }}>
                    <select
                      className="sf-input"
                      value={phoneCountryCode}
                      onChange={e => setPhoneCountryCode(e.target.value)}
                      style={{ height: '42px', padding: '0 8px', background: 'transparent', border: '1px solid color-mix(in srgb, var(--sf-text) 12%, transparent)', color: 'inherit' }}
                    >
                      <option value="+92">+92 (PK)</option>
                      <option value="+1">+1 (US/CA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (AE)</option>
                    </select>
                    <input
                      className="sf-input"
                      required
                      placeholder="333"
                      maxLength={3}
                      value={phoneAreaCode}
                      onChange={e => setPhoneAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    />
                    <input
                      className="sf-input"
                      required
                      placeholder="3883381"
                      maxLength={7}
                      value={phoneSubscriber}
                      onChange={e => setPhoneSubscriber(e.target.value.replace(/\D/g, '').slice(0, 7))}
                    />
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                  <h3 style={{ marginBottom: '12px' }}>Shipping Method</h3>
                  {Array.isArray(rates) && rates.map(r => (
                    <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', marginBottom: '8px',
                                                border: `1px solid ${selectedRate === r.id ? 'var(--sf-primary)' : 'color-mix(in srgb, var(--sf-text) 12%, transparent)'}`,
                                                background: selectedRate === r.id ? 'color-mix(in srgb, var(--sf-primary) 8%, transparent)' : 'transparent', cursor: 'pointer' }}>
                      <input type="radio" name="rate" checked={selectedRate === r.id} onChange={() => setSelectedRate(r.id)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)' }}>{r.estimatedDays}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>${r.price.toFixed(2)}</div>
                    </label>
                  ))}
                </div>
                <button type="submit" className="sf-btn-primary" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>Continue to Payment</button>
              </form>
            </div>
          )}
          {step === 'payment' && (
            <div className="glass" style={{ padding: '32px' }}>
              <h3 style={{ marginBottom: '24px' }}>Payment Method</h3>
              
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              {/* Payment Method Selector Tabs */}
              {gatewayConfig?.enabledPaymentMethods?.includes('pay_later') && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${paymentMethod === 'card' ? 'var(--sf-primary)' : 'color-mix(in srgb, var(--sf-text) 12%, transparent)'}`,
                      background: paymentMethod === 'card' ? 'color-mix(in srgb, var(--sf-primary) 8%, transparent)' : 'transparent',
                      color: 'var(--sf-text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    <span>💳</span> Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_later')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `2px solid ${paymentMethod === 'pay_later' ? 'var(--sf-primary)' : 'color-mix(in srgb, var(--sf-text) 12%, transparent)'}`,
                      background: paymentMethod === 'pay_later' ? 'color-mix(in srgb, var(--sf-primary) 8%, transparent)' : 'transparent',
                      color: 'var(--sf-text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    <span>💬</span> Pay Later
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {paymentMethod === 'card' ? (
                  stripeConfig?.publishableKey ? (
                    <div style={{ padding: '24px', borderRadius: '16px', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <span style={{ fontWeight: 600 }}>Credit / Debit Card (Secure)</span>
                        <span>💳</span>
                      </div>
                      {/* Stripe Card Elements mount node */}
                      <div id="stripe-card-element" style={{ padding: '12px', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)', borderRadius: '8px', background: 'color-mix(in srgb, var(--sf-text) 2%, transparent)' }}></div>
                    </div>
                  ) : (
                    <div style={{ padding: '24px', borderRadius: '16px', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <span style={{ fontWeight: 600 }}>Credit / Debit Card (Mock Mode)</span>
                        <span>💳</span>
                      </div>
                      <input className="sf-input" placeholder="Card Number" value="4242 4242 4242 4242" readOnly />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input className="sf-input" placeholder="MM/YY" value="12/26" readOnly />
                        <input className="sf-input" placeholder="CVC" value="123" readOnly />
                      </div>
                    </div>
                  )
                ) : (
                  <div style={{ padding: '24px', borderRadius: '16px', background: 'color-mix(in srgb, var(--sf-text) 3%, transparent)', border: '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</div>
                    <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>Pay Later via WhatsApp</h4>
                    <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                      Once you place your order, you'll receive a WhatsApp message on <strong>{address.phone}</strong> with our custom payment methods to complete your purchase.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="sf-btn-outline" style={{ flex: 1 }} onClick={() => setStep('info')}>Back</button>
                  <button className="sf-btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handlePay} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : paymentMethod === 'pay_later' ? 'Place Order (Pay Later)' : `Pay $${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="glass" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '24px' }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {items.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                  <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--sf-text-muted)' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid color-mix(in srgb, var(--sf-text) 8%, transparent)', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--sf-text-muted)' }}>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--sf-text-muted)' }}>Shipping</span><span>${shippingPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--sf-primary)' }}>
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PubCheckout({ loaderData }: Route.ComponentProps) {
  const { storeName, themeData, apiKey, storeId, whatsappPhone } = loaderData as any;

  return (
    <StorefrontLayout storeName={storeName} themeData={themeData} apiKey={apiKey}>
      <PubCheckoutContent storeId={storeId} apiKey={apiKey} whatsappPhone={whatsappPhone} />
    </StorefrontLayout>
  );
}
