export const spaHtml = `
<main class="spa-template-root">
  <header class="botanical-spa-header">
    <div class="spa-logo">
      <span class="leaf-icon">🌿</span>
      <span>SOLACE BOTANICAL SPA</span>
    </div>
    <nav class="spa-nav">
      <a href="#rituals">Rituals</a>
      <a href="#wellness">Hydrotherapy</a>
      <a href="#philosophy">Philosophy</a>
      <a href="#booking">Book Sanctuary</a>
    </nav>
    <a class="spa-btn-primary" href="#booking">Book Appointment</a>
  </header>

  <section class="spa-hero">
    <div class="spa-hero-content">
      <span class="spa-pill">ORGANIC WELLNESS & HOLISTIC HEALING</span>
      <h1>Restore Balance to Mind, Body & Spirit.</h1>
      <p>Immerse yourself in therapeutic aromatherapy, deep herbal hydrotherapy, and custom botanical facials curated by certified master holistic practitioners.</p>
      <div class="spa-hero-actions">
        <a class="spa-btn-primary" href="#booking">Explore Rituals →</a>
        <a class="spa-btn-subtle" href="#wellness">View Amenities</a>
      </div>
    </div>
  </section>

  <section class="spa-rituals" id="rituals">
    <div class="spa-section-title">
      <span class="spa-kicker">CURATED RESTORATIVE THERAPIES</span>
      <h2>Signature Spa Treatments</h2>
      <p>Hand-blended organic botanical elixirs, hot stone alignment, and calming sensory treatments.</p>
    </div>
    <div class="spa-grid">
      <div class="spa-card">
        <div class="spa-card-icon">🪷</div>
        <h3>Organic Eucalyptus Glow Facial</h3>
        <p>Deep clarifying double cleanse, warm botanical compress, jade rolling, and organic squalane moisture infusion.</p>
        <span class="spa-duration">75 Mins • $135</span>
      </div>
      <div class="spa-card">
        <div class="spa-card-icon">🕯️</div>
        <h3>Heated Himalayan Salt Massage</h3>
        <p>Full-body deep pressure massage using 84-mineral warm salt stones to melt muscle tension and restore circulation.</p>
        <span class="spa-duration">90 Mins • $165</span>
      </div>
      <div class="spa-card">
        <div class="spa-card-icon">🌊</div>
        <h3>Cedar Steam & Hydro Detox</h3>
        <p>Private cedar wood herbal infusion sauna followed by sensory rainfall rinse and botanical hydration body wrap.</p>
        <span class="spa-duration">60 Mins • $110</span>
      </div>
      <div class="spa-card">
        <div class="spa-card-icon">✨</div>
        <h3>Couples Sound & Scent Sanctuary</h3>
        <p>Tibetan singing bowl sound therapy, lavender essential oil massage, and private tea lounge experience for two.</p>
        <span class="spa-duration">120 Mins • $290</span>
      </div>
    </div>
  </section>

  <section class="spa-booking-section" id="booking">
    <div class="spa-booking-inner">
      <h2>Reserve Your Quiet Space</h2>
      <p>Appointments are kept limited to ensure unhurried, serene privacy throughout your visit.</p>
      <form class="spa-form">
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email Address" required />
        <select>
          <option>Organic Eucalyptus Glow Facial (75 mins - $135)</option>
          <option>Heated Himalayan Salt Massage (90 mins - $165)</option>
          <option>Cedar Steam & Hydro Detox (60 mins - $110)</option>
          <option>Couples Sound & Scent Sanctuary (120 mins - $290)</option>
        </select>
        <button type="submit" class="spa-btn-primary">Request Treatment Time</button>
      </form>
    </div>
  </section>

  <footer class="spa-footer">
    <p>© Solace Botanical Wellness & Holistic Spa Sanctuary.</p>
  </footer>
</main>
`;

export const spaCss = `
.spa-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #2b332b;
  background-color: #f7f9f6;
  margin: 0;
  padding: 0;
}
.botanical-spa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: #ffffff;
  border-bottom: 1px solid #e3e8e1;
}
.spa-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #2d4533;
  font-size: 1.05rem;
}
.spa-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #556358;
  font-size: 0.92rem;
  font-weight: 500;
}
.spa-nav a:hover {
  color: #386641;
}
.spa-btn-primary {
  background: #386641;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
  border: none;
  cursor: pointer;
}
.spa-hero {
  background: linear-gradient(rgba(30, 43, 33, 0.65), rgba(30, 43, 33, 0.75)), url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80') center/cover;
  color: #ffffff;
  padding: 130px 24px;
  text-align: center;
}
.spa-hero-content {
  max-width: 800px;
  margin: 0 auto;
}
.spa-pill {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(4px);
  border-radius: 99px;
  font-size: 0.78rem;
  letter-spacing: 1.5px;
  color: #c9e4ca;
  margin-bottom: 20px;
}
.spa-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3.4rem;
  line-height: 1.18;
  margin: 0 0 20px 0;
  font-weight: 500;
}
.spa-hero p {
  font-size: 1.15rem;
  color: #e2ede2;
  line-height: 1.6;
  margin-bottom: 32px;
}
.spa-hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.spa-btn-subtle {
  border: 1px solid rgba(255,255,255,0.6);
  color: #ffffff;
  padding: 12px 26px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 500;
}
.spa-rituals {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.spa-section-title {
  text-align: center;
  margin-bottom: 50px;
}
.spa-kicker {
  font-size: 0.78rem;
  letter-spacing: 2px;
  color: #386641;
  font-weight: 700;
}
.spa-section-title h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.4rem;
  color: #1f3123;
  margin: 8px 0;
}
.spa-section-title p {
  color: #647366;
}
.spa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 28px;
}
.spa-card {
  background: #ffffff;
  border: 1px solid #e1e8df;
  border-radius: 12px;
  padding: 32px 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.spa-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(56, 102, 65, 0.08);
}
.spa-card-icon {
  font-size: 2rem;
  margin-bottom: 16px;
}
.spa-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  margin: 0 0 10px 0;
  color: #1c2e20;
}
.spa-card p {
  font-size: 0.9rem;
  color: #5c695e;
  line-height: 1.5;
  margin-bottom: 20px;
}
.spa-duration {
  display: block;
  font-weight: 700;
  color: #386641;
  font-size: 0.92rem;
}
.spa-booking-section {
  background: #233326;
  color: #ffffff;
  padding: 80px 24px;
  text-align: center;
}
.spa-booking-inner {
  max-width: 600px;
  margin: 0 auto;
}
.spa-booking-inner h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.3rem;
  color: #ebf5ec;
  margin-bottom: 12px;
}
.spa-booking-inner p {
  color: #a7baa9;
  margin-bottom: 30px;
}
.spa-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.spa-form input, .spa-form select {
  padding: 14px 18px;
  border-radius: 8px;
  border: 1px solid #3d5442;
  background: #18241b;
  color: #fff;
  font-size: 0.95rem;
}
.spa-footer {
  background: #18241b;
  padding: 24px;
  text-align: center;
  color: #889e8b;
  font-size: 0.85rem;
}
`;
