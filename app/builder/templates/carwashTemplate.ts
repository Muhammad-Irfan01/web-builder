export const carwashHtml = `
<main class="carwash-template-root">
  <header class="carwash-header">
    <div class="carwash-brand">
      <span class="brand-badge">⚡</span>
      <span>APEX AUTO SPA & CERAMICS</span>
    </div>
    <nav class="carwash-nav">
      <a href="#packages">Detailing Packages</a>
      <a href="#coatings">Ceramic Coatings</a>
      <a href="#facility">Studio Studio</a>
      <a href="#booking">Book Bay</a>
    </nav>
    <a class="carwash-cta-button" href="#booking">Book Detailing</a>
  </header>

  <section class="carwash-hero">
    <div class="carwash-hero-content">
      <span class="carwash-pill">PRECISION RESTORATION • PAINT CORRECTION • XPEL PPF</span>
      <h1>Showroom Perfection & Ceramic Shield Protection.</h1>
      <p>Master multi-stage paint decontamination, multi-step swirl correction, and 9H nanoceramic quartz protection for supercars, luxury sedans, and daily drivers.</p>
      <div class="carwash-hero-buttons">
        <a class="carwash-btn-primary" href="#packages">Explore Packages →</a>
        <a class="carwash-btn-outline" href="#booking">Reserve Wash Bay</a>
      </div>
    </div>
  </section>

  <section class="carwash-packages" id="packages">
    <div class="carwash-heading">
      <span class="carwash-kicker">PRECISION DETAILING TIERS</span>
      <h2>Bespoke Care For Your Vehicle</h2>
      <p>Touchless deionized water filtration, pH-neutral citrus foam baths, and Swissvax protection.</p>
    </div>
    <div class="carwash-grid">
      <div class="carwash-card">
        <span class="tier-label">Express Maintenance</span>
        <h3>Executive Hand Wash</h3>
        <p>Snow foam pre-soak, two-bucket hand wash, wheel barrel iron detox, towel dry, and interior vacuum & wipe.</p>
        <div class="package-meta">
          <span class="package-price">$65</span>
          <span class="package-time">60 Mins</span>
        </div>
      </div>
      <div class="carwash-card featured">
        <span class="tier-label popular">Most Popular</span>
        <h3>Stage 1 Correction & Interior Deep Clean</h3>
        <p>Clay bar decontamination, single-stage gloss enhancement machine polish, steam extraction interior sanitization.</p>
        <div class="package-meta">
          <span class="package-price">$240</span>
          <span class="package-time">3.5 Hours</span>
        </div>
      </div>
      <div class="carwash-card">
        <span class="tier-label">Flagship Protection</span>
        <h3>5-Year 9H Ceramic Coating</h3>
        <p>Two-stage 90%+ swirl removal, infrared-cured 9H quartz ceramic coating on all painted surfaces, glass, and wheels.</p>
        <div class="package-meta">
          <span class="package-price">$790</span>
          <span class="package-time">Full Day</span>
        </div>
      </div>
      <div class="carwash-card">
        <span class="tier-label">Specialist Service</span>
        <h3>Interior Leather Restoration & Steam</h3>
        <p>Full leather conditioning, high-temp steam bacteria elimination, fabric hydrophobic guard, and ozone odor removal.</p>
        <div class="package-meta">
          <span class="package-price">$180</span>
          <span class="package-time">2.5 Hours</span>
        </div>
      </div>
    </div>
  </section>

  <section class="carwash-booking" id="booking">
    <div class="booking-card-inner">
      <h2>Reserve Your Detail Bay</h2>
      <p>Select your vehicle size and service package. We confirm within 15 minutes.</p>
      <form class="carwash-booking-form">
        <input type="text" placeholder="Full Name" required />
        <input type="text" placeholder="Vehicle Make, Model & Year (e.g. 2024 Porsche 911)" required />
        <input type="tel" placeholder="Mobile Phone Number" required />
        <select>
          <option>Executive Hand Wash ($65)</option>
          <option>Stage 1 Correction & Interior Deep Clean ($240)</option>
          <option>5-Year 9H Ceramic Coating ($790)</option>
          <option>Interior Leather Restoration & Steam ($180)</option>
        </select>
        <button type="submit" class="carwash-btn-primary">Confirm Bay Reservation</button>
      </form>
    </div>
  </section>

  <footer class="carwash-footer">
    <p>© Apex Auto Spa & Precision Detailing Studio. Certified Ceramic Pro & XPEL Installers.</p>
  </footer>
</main>
`;

export const carwashCss = `
.carwash-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #d1d5db;
  background-color: #0b0f19;
  margin: 0;
  padding: 0;
}
.carwash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
}
.carwash-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #38bdf8;
  font-size: 1.05rem;
}
.brand-badge {
  font-size: 1.2rem;
}
.carwash-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.92rem;
  font-weight: 500;
}
.carwash-nav a:hover {
  color: #38bdf8;
}
.carwash-cta-button {
  background: #0284c7;
  color: #ffffff;
  padding: 10px 22px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
}
.carwash-hero {
  background: linear-gradient(rgba(11, 15, 25, 0.75), rgba(11, 15, 25, 0.85)), url('https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1600&q=80') center/cover;
  color: #ffffff;
  padding: 130px 24px;
  text-align: center;
}
.carwash-hero-content {
  max-width: 840px;
  margin: 0 auto;
}
.carwash-pill {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 99px;
  font-size: 0.78rem;
  letter-spacing: 2px;
  color: #38bdf8;
  margin-bottom: 20px;
  font-weight: 700;
}
.carwash-hero h1 {
  font-size: 3.4rem;
  line-height: 1.15;
  margin: 0 0 20px 0;
  font-weight: 800;
  color: #ffffff;
}
.carwash-hero p {
  font-size: 1.15rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 34px;
}
.carwash-hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.carwash-btn-primary {
  background: #0284c7;
  color: #ffffff;
  padding: 14px 30px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 700;
  border: none;
  cursor: pointer;
}
.carwash-btn-outline {
  border: 1px solid rgba(255,255,255,0.4);
  color: #ffffff;
  padding: 14px 28px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}
.carwash-packages {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.carwash-heading {
  text-align: center;
  margin-bottom: 50px;
}
.carwash-kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #38bdf8;
  font-weight: 700;
}
.carwash-heading h2 {
  font-size: 2.4rem;
  color: #ffffff;
  margin: 8px 0;
  font-weight: 800;
}
.carwash-heading p {
  color: #64748b;
}
.carwash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 26px;
}
.carwash-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 30px 22px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s, border-color 0.2s;
}
.carwash-card:hover {
  transform: translateY(-4px);
  border-color: #0284c7;
}
.carwash-card.featured {
  border-color: #0284c7;
  background: #0f1d32;
}
.tier-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin-bottom: 10px;
}
.tier-label.popular {
  color: #38bdf8;
}
.carwash-card h3 {
  font-size: 1.25rem;
  margin: 0 0 10px 0;
  color: #ffffff;
}
.carwash-card p {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 24px;
}
.package-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #1f2937;
  padding-top: 16px;
}
.package-price {
  font-weight: 800;
  color: #38bdf8;
  font-size: 1.3rem;
}
.package-time {
  font-size: 0.85rem;
  color: #64748b;
}
.carwash-booking {
  background: #0f172a;
  border-top: 1px solid #1e293b;
  padding: 80px 24px;
  text-align: center;
}
.booking-card-inner {
  max-width: 600px;
  margin: 0 auto;
}
.booking-card-inner h2 {
  font-size: 2.2rem;
  color: #ffffff;
  margin-bottom: 10px;
}
.booking-card-inner p {
  color: #94a3b8;
  margin-bottom: 30px;
}
.carwash-booking-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.carwash-booking-form input, .carwash-booking-form select {
  padding: 14px 18px;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #020617;
  color: #fff;
  font-size: 0.95rem;
}
.carwash-footer {
  background: #020617;
  padding: 24px;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
}
`;
