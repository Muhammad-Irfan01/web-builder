import { useState, useEffect } from 'react';
import type { Route } from '../+types/root';
import { StorefrontLayout, useStorefrontTheme } from '../storefront/StorefrontLayout';
import { products as productsApi, bookings as bookingsApi, teams as teamsApi, getProductName, getProductPrice, getProductImage } from '../lib/api';
import type { Product, BookingSlot } from '../lib/api';
import { resolveProject } from '../lib/project.server';
import '../storefront/storefront.css';

// ── Server Loader (SSR) ──────────────────────────────────────────────────
export async function loader({ request, params }: { request: Request; params: any }): Promise<{
  products: Product[];
  initialSlots: BookingSlot[];
  staff: any[];
  storeName: string;
  theme: any | null;
  apiKey: string | null;
  projectId: string;
}> {
  const { projectId } = params;
  const resolved = await resolveProject(request, projectId);
  
  let theme: any = null;
  let apiKey: string | null = null;
  let storeId: string | null = null;

  if (resolved) {
    theme = resolved.themeData;
    apiKey = resolved.apiKey;
    storeId = resolved.storeId;
  }

  // Fetch all products (some are services), slots and staff members
  let productsList: Product[] = [];
  let slotsList: BookingSlot[] = [];
  let staffList: any[] = [];

  try {
    const prodRes = await productsApi.list({ limit: 100 }, apiKey, storeId);
    productsList = prodRes.data || [];
  } catch {}

  try {
    const slotRes = await bookingsApi.listSlots(storeId, apiKey) as any;
    slotsList = slotRes?.data || (Array.isArray(slotRes) ? slotRes : []);
  } catch {}

  try {
    const staffRes = await teamsApi.listStaff(storeId, apiKey) as any;
    staffList = staffRes?.data || (Array.isArray(staffRes) ? staffRes : []);
  } catch {}

  return {
    products: productsList,
    initialSlots: slotsList,
    staff: staffList,
    storeName: resolved?.storeName ?? (theme?.storeName || 'My Orcayo Store'),
    theme,
    apiKey,
    projectId,
  };
}

function PublicBookingsContent({ products, initialSlots, staff, storeName, apiKey, projectId }: { products: any[]; initialSlots: any[]; staff: any[]; storeName: string; apiKey: string | null; projectId: string }) {
  const { theme } = useStorefrontTheme();

  // Selected state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [isLoadingAvailabilities, setIsLoadingAvailabilities] = useState(false);

  // Load staff availability from DB dynamically
  useEffect(() => {
    let active = true;
    const fetchAvailabilities = async () => {
      setIsLoadingAvailabilities(true);
      try {
        const res = await bookingsApi.getAvailabilities(selectedStaffId || '');
        if (active && res && res.success && Array.isArray(res.data)) {
          setAvailabilities(res.data);
        } else if (active) {
          setAvailabilities([]);
        }
      } catch (err) {
        console.error("Failed to load staff availability in bookings checkout:", err);
        if (active) {
          setAvailabilities([]);
        }
      } finally {
        if (active) setIsLoadingAvailabilities(false);
      }
    };

    fetchAvailabilities();

    return () => {
      active = false;
    };
  }, [selectedStaffId]);

  // Form details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  // Status and messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-select first product if any and parse URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('productId');
    const dateParam = params.get('date');
    const timeParam = params.get('time');
    const staffIdParam = params.get('staffId');

    if (prodId && products.length > 0) {
      const found = products.find((p: any) => p.id === prodId);
      if (found) {
        setSelectedProduct(found);
      }
    } else if (products.length > 0 && !selectedProduct) {
      const service = products.find((p: any) => p.categoryId === 'services' || p.name?.toLowerCase().includes('booking') || p.title?.toLowerCase().includes('service')) || products[0];
      setSelectedProduct(service);
    }

    if (dateParam) {
      setSelectedDate(dateParam);
    }
    if (timeParam) {
      setSelectedSlot(timeParam);
    }
    if (staffIdParam) {
      setSelectedStaffId(staffIdParam === 'null' || staffIdParam === '' ? null : staffIdParam);
    }
  }, [products]);

  // Generate dynamic staff list with premium fallbacks if empty
  const getStaffMembers = (): { id: string; name: string; role: string; avatar: string }[] => {
    if (staff && staff.length > 0) {
      return staff.map((s: any) => ({
        id: s.id,
        name: s.name || s.fullName || 'Staff Member',
        role: s.role || s.title || 'Specialist',
        avatar: s.avatar || s.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id || s.name}`,
      }));
    }
    return [
      { id: 'staff-1', name: 'Alex Rivera', role: 'Senior Stylist & Consultant', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { id: 'staff-2', name: 'Jordan Chen', role: 'Therapy & Wellness Specialist', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
      { id: 'staff-3', name: 'Taylor Swift', role: 'Senior Care Coordinator', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor' }
    ];
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    let cleaned = timeStr.trim().toUpperCase();
    let isPM = false;
    if (cleaned.endsWith('PM')) {
      isPM = true;
      cleaned = cleaned.replace('PM', '').trim();
    } else if (cleaned.endsWith('AM')) {
      cleaned = cleaned.replace('AM', '').trim();
    }
    const parts = cleaned.split(':');
    if (parts.length >= 1) {
      let hour = parseInt(parts[0], 10) || 0;
      const min = parts.length >= 2 ? parseInt(parts[1], 10) || 0 : 0;
      if (isPM && hour < 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
      return hour * 60 + min;
    }
    return 0;
  };

  // Generate dynamic slots list with fallbacks if initialSlots is empty
  const getAvailableSlots = (): { id: string; time: string; display: string }[] => {
    let activeSlot = initialSlots && initialSlots.length > 0 ? initialSlots[0] : null;
    if (initialSlots && initialSlots.length > 0 && selectedProduct) {
      const prodName = (getProductName(selectedProduct) || '').toLowerCase();
      const matchingSlot = initialSlots.find((s: any) => {
        const slotName = (s.name || '').toLowerCase();
        return slotName && (prodName.includes(slotName) || slotName.includes(prodName));
      });
      if (matchingSlot) activeSlot = matchingSlot;
    }

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0-6

    // Filter staff availabilities
    const staffAvails = selectedStaffId 
      ? availabilities.filter((a: any) => a.staffId === selectedStaffId)
      : availabilities;

    let useDbSlots = false;
    let startTimeStr = '09:00';
    let endTimeStr = '17:00';
    let duration = activeSlot?.duration || 30;

    if (staffAvails.length > 0) {
      const dayAvail = staffAvails.find((a: any) => a.dayOfWeek === dayOfWeek);
      if (!dayAvail || !dayAvail.isAvailable) {
        // Closed/Unavailable on this day of the week
        return [];
      }
      startTimeStr = dayAvail.startTime;
      endTimeStr = dayAvail.endTime;
      useDbSlots = true;
    } else if (activeSlot) {
      startTimeStr = activeSlot.startTime;
      endTimeStr = activeSlot.endTime;
      useDbSlots = true;
    }

    if (useDbSlots) {
      const startMin = parseTimeToMinutes(startTimeStr);
      const endMin = parseTimeToMinutes(endTimeStr);
      
      if (endMin > startMin && duration > 0) {
        const list = [];
        let index = 0;
        for (let current = startMin; current < endMin; current += duration) {
          const hh = Math.floor(current / 60);
          const mm = current % 60;
          const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
          
          // Formatted display
          const ampm = hh >= 12 ? 'PM' : 'AM';
          const displayHour = hh % 12 === 0 ? 12 : hh % 12;
          const displayStr = `${displayHour}:${String(mm).padStart(2, '0')} ${ampm}`;
          
          list.push({
            id: activeSlot ? `${activeSlot.id}-${index++}` : `slot-${index++}`,
            time: timeStr,
            display: displayStr,
          });
        }
        return list;
      }
    }

    // Default premium slots fallback
    return [
      { id: 'slot-1', time: '09:00', display: '09:00 AM' },
      { id: 'slot-2', time: '10:30', display: '10:30 AM' },
      { id: 'slot-3', time: '12:00', display: '12:00 PM' },
      { id: 'slot-4', time: '13:30', display: '01:30 PM' },
      { id: 'slot-5', time: '15:00', display: '03:00 PM' },
      { id: 'slot-6', time: '16:30', display: '04:30 PM' },
    ];
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedSlot) {
      setMessage({ type: 'error', text: 'Please select a service and booking slot.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const activeStoreId = theme?.storeId || 'default-store';
      
      // Find matching slot by product name to get its actual duration
      let activeSlot = initialSlots && initialSlots.length > 0 ? initialSlots[0] : null;
      if (selectedProduct && initialSlots && initialSlots.length > 0) {
        const prodName = (getProductName(selectedProduct) || '').toLowerCase();
        const matchingSlot = initialSlots.find((s: any) => {
          const slotName = (s.name || '').toLowerCase();
          return slotName && (prodName.includes(slotName) || slotName.includes(prodName));
        });
        if (matchingSlot) activeSlot = matchingSlot;
      }

      const durationMin = activeSlot?.duration || 60;
      
      const startMin = parseTimeToMinutes(selectedSlot);
      const endMin = startMin + durationMin;
      
      const startHh = String(Math.floor(startMin / 60)).padStart(2, '0');
      const startMm = String(startMin % 60).padStart(2, '0');
      const endHh = String(Math.floor(endMin / 60)).padStart(2, '0');
      const endMm = String(endMin % 60).padStart(2, '0');
      
      const startIso = `${selectedDate}T${startHh}:${startMm}:00.000Z`;
      const endIso = `${selectedDate}T${endHh}:${endMm}:00.000Z`;

      await bookingsApi.create({
        storeId: activeStoreId,
        customerId: email,
        productId: selectedProduct.id,
        name,
        email,
        phone,
        notes,
        status: 'PENDING',
        startAt: startIso,
        endAt: endIso,
        totalAmount: getProductPrice(selectedProduct),
        staffId: selectedStaffId || undefined,
      }, theme?.storeId, apiKey);

      setMessage({ type: 'success', text: 'Booking successfully scheduled! We will contact you soon.' });
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setSelectedSlot(null);
      setSelectedStaffId(null);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to submit booking. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sf-container" style={{ padding: '60px 24px', maxWidth: '1000px' }}>
        
        {/* Header Section */}
        <div className="sf-section-header centered">
          <span className="sf-hero-eyebrow" style={{ display: 'inline-block', marginBottom: '12px' }}>📅 Online Reservations</span>
          <h1 className="sf-section-title">Book an Appointment</h1>
          <p className="sf-section-sub">Select your desired service, date, and time slot to reserve your spot instantly.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', marginTop: '40px' }} className="bookings-layout-grid">
          
          {/* Left Column: Service & Date Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Service Selection Cards */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>✨</span> 1. Select Service
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                {products.length === 0 ? (
                  <p style={{ color: 'var(--sf-text-muted)', fontSize: '0.95rem' }}>No services available at this time.</p>
                ) : (
                  products.map((p: Product) => {
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <div 
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)',
                          background: isSelected ? 'color-mix(in srgb, var(--sf-primary) 12%, transparent)' : 'color-mix(in srgb, var(--sf-text) 3%, transparent)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {getProductImage(p) ? (
                          <img 
                            src={getProductImage(p)} 
                            alt={getProductName(p)} 
                            style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'color-mix(in srgb, var(--sf-text) 8%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛍️</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sf-text)', marginBottom: '4px' }}>
                            {getProductName(p)}
                          </h3>
                          <span style={{ fontSize: '0.9rem', color: 'var(--sf-accent)', fontWeight: 600 }}>
                            ${getProductPrice(p).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Date Selection Box */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📅</span> 2. Choose Date
              </h2>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="sf-input"
                style={{ margin: 0 }}
              />
            </div>

          </div>

          {/* Right Column: Time Slot & Booking Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Staff Selection Grid */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>👥</span> 3. Select Specialist
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div 
                  onClick={() => setSelectedStaffId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: selectedStaffId === null ? '2px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)',
                    background: selectedStaffId === null ? 'color-mix(in srgb, var(--sf-primary) 15%, transparent)' : 'color-mix(in srgb, var(--sf-text) 3%, transparent)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: selectedStaffId === null ? 'scale(1.02)' : 'none',
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px color-mix(in srgb, var(--sf-primary) 30%, transparent)' }}>⭐️</div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sf-text)' }}>No Preference</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)' }}>Best Available Staff</span>
                  </div>
                </div>
                
                {getStaffMembers().map((s) => {
                  const isSelected = selectedStaffId === s.id;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setSelectedStaffId(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 10%, transparent)',
                        background: isSelected ? 'color-mix(in srgb, var(--sf-primary) 15%, transparent)' : 'color-mix(in srgb, var(--sf-text) 3%, transparent)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.02)' : 'none',
                      }}
                    >
                      <img 
                        src={s.avatar} 
                        alt={s.name} 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: isSelected ? '2px solid var(--sf-accent)' : '2px solid color-mix(in srgb, var(--sf-text) 12%, transparent)',
                          boxShadow: isSelected ? '0 0 10px color-mix(in srgb, var(--sf-primary) 30%, transparent)' : 'none',
                        }}
                      />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sf-text)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.role}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⏰</span> 3. Select Time Slot
              </h2>
              
              <div style={{ display: getAvailableSlots().length > 0 ? 'grid' : 'block', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {getAvailableSlots().length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: 'var(--sf-text-muted)',
                    fontSize: '0.9rem',
                    background: 'color-mix(in srgb, var(--sf-text) 2%, transparent)',
                    borderRadius: '8px',
                    border: '1px dashed color-mix(in srgb, var(--sf-text) 8%, transparent)',
                  }}>
                    {isLoadingAvailabilities ? '🔄 Loading available slots...' : '❌ No slots available on this date.'}
                  </div>
                ) : (
                  getAvailableSlots().map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot.time)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--sf-accent)' : '1px solid color-mix(in srgb, var(--sf-text) 12%, transparent)',
                          background: isSelected ? 'color-mix(in srgb, var(--sf-primary) 20%, transparent)' : 'transparent',
                          color: isSelected ? 'var(--sf-accent)' : 'var(--sf-text)',
                          fontWeight: isSelected ? '700' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center',
                        }}
                      >
                        {slot.display}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Booking Submission Form */}
            <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📝</span> 4. Personal Information
              </h2>
              
              {message && (
                <div style={{
                  padding: '14px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: message.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                  color: message.type === 'success' ? '#34d399' : '#f87171',
                  fontSize: '0.95rem',
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="sf-label">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="sf-input"
                    style={{ margin: 0 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-row-2">
                  <div>
                    <label className="sf-label">Email</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="sf-input"
                      style={{ margin: 0 }}
                    />
                  </div>
                  <div>
                    <label className="sf-label">Phone</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="sf-input"
                      style={{ margin: 0 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="sf-label">Special Requests / Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Any specific requests or requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="sf-input"
                    style={{ margin: 0, resize: 'vertical' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !selectedProduct || !selectedSlot}
                  className="sf-btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '700',
                  }}
                >
                  {loading ? 'Scheduling Reservation...' : `Confirm Booking for $${(selectedProduct ? getProductPrice(selectedProduct) : 0).toFixed(2)}`}
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
  );
}

export default function PublicBookings({ loaderData }: Route.ComponentProps) {
  const { products, initialSlots, staff, storeName, theme: loadedTheme, apiKey, projectId } = loaderData as any;

  return (
    <StorefrontLayout storeName={loadedTheme?.storeName || storeName} themeData={loadedTheme} apiKey={apiKey}>
      <PublicBookingsContent 
        products={products}
        initialSlots={initialSlots}
        staff={staff}
        storeName={storeName}
        apiKey={apiKey}
        projectId={projectId}
      />
    </StorefrontLayout>
  );
}
