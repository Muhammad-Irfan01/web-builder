export const salonHtml = `
<main class="salon-template-root">
  <header class="luxury-salon-header">
    <div class="luxury-salon-logo">
      <span class="logo-accent">✦</span>
      <strong>AURA SALON & STUDIO</strong>
    </div>
    <nav class="luxury-salon-nav">
      <a href="#services">Services</a>
      <a href="#stylists">Stylists</a>
      <a href="#experience">Experience</a>
      <a href="#booking">Book Online</a>
    </nav>
    <a class="luxury-salon-cta" href="#booking">Reserve Seat</a>
  </header>

  <section class="luxury-salon-hero">
    <div class="hero-content">
      <span class="hero-eyebrow">HAUTE COIFFURE & ARTISTIC COLOR</span>
      <h1>Bespoke Haircraft & Luminous Beauty.</h1>
      <p class="hero-sub">Specializing in precision cutting, French balayage, couture styling, and transformative restorative treatments in an intimate sanctuary.</p>
      <div class="hero-actions">
        <a class="btn-gold" href="#booking">Book Appointment →</a>
        <a class="btn-outline" href="#services">View Lookbook</a>
      </div>
    </div>
  </section>

  <section class="luxury-salon-services" id="services">
    <div class="section-heading">
      <span class="kicker">OUR SIGNATURE MENU</span>
      <h2>Artistic Hair Services</h2>
      <p>Every service includes a personalized consultation, botanical wash, and custom blowout.</p>
    </div>
    <div class="salon-cards-grid">
      <article class="salon-service-card">
        <div class="card-num">01</div>
        <h3>Architectural Cut & Styling</h3>
        <p>Structural dry cutting tailored to your face shape, clarifying cleanse, and silk press finish.</p>
        <span class="card-price">From $95</span>
      </article>
      <article class="salon-service-card">
        <div class="card-num">02</div>
        <h3>French Balayage & Glaze</h3>
        <p>Hand-painted sun-kissed dimension paired with a custom high-gloss conditioning toner.</p>
        <span class="card-price">From $185</span>
      </article>
      <article class="salon-service-card">
        <div class="card-num">03</div>
        <h3>Molecular Keratin Repair</h3>
        <p>Bond-building deep fiber treatment restoring elasticity, softness, and vibrant sheen.</p>
        <span class="card-price">From $140</span>
      </article>
      <article class="salon-service-card">
        <div class="card-num">04</div>
        <h3>Couture Bridal & Event Hair</h3>
        <p>Sculptural updos, romantic textured waves, and veil styling for unforgettable moments.</p>
        <span class="card-price">From $160</span>
      </article>
    </div>
  </section>

  <section class="luxury-salon-booking" id="booking">
    <div class="booking-wrap">
      <h2>Experience Aura Firsthand</h2>
      <p>Select your stylist and reserve your dedicated consultation slot.</p>
      <form class="salon-booking-form">
        <input type="text" placeholder="Your Full Name" required />
        <input type="email" placeholder="Email Address" required />
        <select>
          <option>Architectural Cut & Styling ($95)</option>
          <option>French Balayage & Glaze ($185)</option>
          <option>Molecular Keratin Repair ($140)</option>
          <option>Couture Bridal Hair ($160)</option>
        </select>
        <button type="submit" class="btn-gold">Confirm Reservation</button>
      </form>
    </div>
  </section>

  <footer class="luxury-salon-footer">
    <p>© Aura Salon & Studio. Handcrafted with elegance.</p>
  </footer>
</main>
`;

export const salonCss = `
.salon-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #1a1a1a;
  background-color: #faf8f5;
  margin: 0;
  padding: 0;
}
.luxury-salon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  background: #ffffff;
  border-bottom: 1px solid #ede8e1;
}
.luxury-salon-logo {
  font-size: 1.1rem;
  letter-spacing: 2px;
  color: #222;
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-accent {
  color: #c59b27;
}
.luxury-salon-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #555;
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.luxury-salon-nav a:hover {
  color: #c59b27;
}
.luxury-salon-cta {
  background: #111;
  color: #fff;
  padding: 10px 22px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
}
.luxury-salon-hero {
  background: linear-gradient(rgba(18, 16, 14, 0.65), rgba(18, 16, 14, 0.75)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80') center/cover;
  color: #ffffff;
  padding: 140px 32px;
  text-align: center;
}
.hero-content {
  max-width: 820px;
  margin: 0 auto;
}
.hero-eyebrow {
  display: inline-block;
  font-size: 0.85rem;
  letter-spacing: 3px;
  color: #dfb746;
  margin-bottom: 16px;
  font-weight: 600;
}
.luxury-salon-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  line-height: 1.15;
  margin: 0 0 20px 0;
  font-weight: 500;
}
.hero-sub {
  font-size: 1.15rem;
  line-height: 1.6;
  color: #e4dfd7;
  margin-bottom: 36px;
}
.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.btn-gold {
  background: #c59b27;
  color: #ffffff;
  padding: 14px 32px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-outline {
  border: 1px solid #ffffff;
  color: #ffffff;
  padding: 14px 32px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
}
.luxury-salon-services {
  max-width: 1140px;
  margin: 90px auto;
  padding: 0 24px;
}
.section-heading {
  text-align: center;
  margin-bottom: 60px;
}
.section-heading .kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #c59b27;
  font-weight: 700;
}
.section-heading h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  margin: 8px 0 12px 0;
  color: #1a1a1a;
}
.section-heading p {
  color: #777;
  font-size: 1rem;
}
.salon-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 28px;
}
.salon-service-card {
  background: #ffffff;
  border: 1px solid #ebe4d8;
  padding: 32px 24px;
  border-radius: 8px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}
.salon-service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}
.card-num {
  font-size: 0.85rem;
  font-weight: 700;
  color: #c59b27;
  margin-bottom: 12px;
}
.salon-service-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.35rem;
  margin: 0 0 12px 0;
  color: #222;
}
.salon-service-card p {
  font-size: 0.92rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20px;
}
.card-price {
  font-weight: 700;
  color: #111;
  font-size: 1.05rem;
}
.luxury-salon-booking {
  background: #181512;
  color: #fff;
  padding: 80px 24px;
  text-align: center;
}
.booking-wrap {
  max-width: 600px;
  margin: 0 auto;
}
.booking-wrap h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.2rem;
  color: #f7eedf;
  margin-bottom: 8px;
}
.booking-wrap p {
  color: #b5aba0;
  margin-bottom: 32px;
}
.salon-booking-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.salon-booking-form input, .salon-booking-form select {
  padding: 14px 18px;
  border-radius: 4px;
  border: 1px solid #3d352b;
  background: #231f1a;
  color: #fff;
  font-size: 0.95rem;
}
.luxury-salon-footer {
  background: #110e0c;
  padding: 24px;
  text-align: center;
  color: #7a7065;
  font-size: 0.85rem;
}
`;
