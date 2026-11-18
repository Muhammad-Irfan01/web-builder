export const christmasHtml = `
<main class="xmas-template-root">
  <div class="xmas-topbar">
    <span>🎄 HOLIDAY FLASH SALE: UP TO 50% OFF WITH CODE <strong>MERRY25</strong></span>
  </div>
  <header class="xmas-header">
    <div class="xmas-logo">
      <span>🎁 THE HOLIDAY BOUTIQUE</span>
    </div>
    <nav class="xmas-nav">
      <a href="#deals">Gift Bundles</a>
      <a href="#treats">Holiday Specials</a>
      <a href="#countdown">Sale Countdown</a>
    </nav>
    <a class="xmas-cta" href="#deals">Shop Deals</a>
  </header>

  <section class="xmas-hero">
    <div class="xmas-hero-inner">
      <span class="xmas-badge">LIMITED WINTER EDITION</span>
      <h1>Unwrap Magical Holiday Savings &amp; Gifts.</h1>
      <p>Delight your loved ones with festive curated gift bundles, bespoke advent specials, and priority holiday express shipping.</p>
      <div class="xmas-buttons">
        <a class="btn-xmas-red" href="#deals">Shop Holiday Gifts ✦</a>
        <a class="btn-xmas-gold" href="#deals">Claim Promo Code</a>
      </div>
    </div>
  </section>

  <section class="xmas-deals" id="deals">
    <div class="xmas-title-wrap">
      <span class="xmas-kicker">SEASONAL FAVORITES</span>
      <h2>Curated Holiday Gift Sets</h2>
      <p>Hand-wrapped with crimson satin ribbon and personalized calligraphy gift card.</p>
    </div>
    <div class="xmas-grid">
      <div class="xmas-card">
        <span class="tag-red">-40% OFF</span>
        <h3>Winter Wonderland Deluxe Box</h3>
        <p>Premium holiday collection featuring luxury scented candle, festive treats, and silk sleep mask.</p>
        <span class="xmas-price">$68.00 <del>$115.00</del></span>
      </div>
      <div class="xmas-card">
        <span class="tag-red">-30% OFF</span>
        <h3>Warm Cocoa &amp; Cashmere Bundle</h3>
        <p>Artisan dark drinking chocolate, hand-poured ceramic mugs, and plush fireside throw blanket.</p>
        <span class="xmas-price">$48.00 <del>$70.00</del></span>
      </div>
      <div class="xmas-card">
        <span class="tag-red">-50% OFF</span>
        <h3>Holiday Glow Spa Collection</h3>
        <p>Frankincense &amp; myrrh body scrub, botanical bath soak, and rich peptide moisture elixir.</p>
        <span class="xmas-price">$55.00 <del>$110.00</del></span>
      </div>
    </div>
  </section>

  <footer class="xmas-footer">
    <p>© The Holiday Boutique. Seasonal Pop-Up Storefront.</p>
  </footer>
</main>
`;

export const christmasCss = `
.xmas-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  background-color: #0b1610;
  margin: 0;
  padding: 0;
}
.xmas-topbar {
  background: #c41e3a;
  color: #ffffff;
  text-align: center;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
}
.xmas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: #12261a;
  border-bottom: 1px solid #1a3826;
}
.xmas-logo {
  font-weight: 800;
  letter-spacing: 2px;
  color: #f8b229;
  font-size: 1.05rem;
}
.xmas-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #a3c2b0;
  font-size: 0.92rem;
  font-weight: 500;
}
.xmas-nav a:hover {
  color: #f8b229;
}
.xmas-cta {
  background: #c41e3a;
  color: #ffffff;
  padding: 10px 22px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.88rem;
}
.xmas-hero {
  background: linear-gradient(rgba(11, 22, 16, 0.7), rgba(11, 22, 16, 0.8)), url('https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1600&q=80') center/cover;
  padding: 140px 24px;
  text-align: center;
}
.xmas-hero-inner {
  max-width: 820px;
  margin: 0 auto;
}
.xmas-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(248, 178, 41, 0.15);
  border: 1px solid #f8b229;
  border-radius: 99px;
  font-size: 0.78rem;
  letter-spacing: 2px;
  color: #f8b229;
  margin-bottom: 20px;
  font-weight: 700;
}
.xmas-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  line-height: 1.15;
  margin: 0 0 20px 0;
  color: #ffffff;
}
.xmas-hero p {
  font-size: 1.15rem;
  color: #d1e3d7;
  line-height: 1.6;
  margin-bottom: 34px;
}
.xmas-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.btn-xmas-red {
  background: #c41e3a;
  color: #ffffff;
  padding: 14px 30px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 700;
}
.btn-xmas-gold {
  border: 1px solid #f8b229;
  color: #f8b229;
  padding: 14px 28px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 600;
}
.xmas-deals {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.xmas-title-wrap {
  text-align: center;
  margin-bottom: 50px;
}
.xmas-kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #f8b229;
  font-weight: 700;
}
.xmas-title-wrap h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.4rem;
  color: #ffffff;
  margin: 8px 0;
}
.xmas-title-wrap p {
  color: #8da696;
}
.xmas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 26px;
}
.xmas-card {
  background: #142a1d;
  border: 1px solid #20452f;
  border-radius: 12px;
  padding: 30px 24px;
  position: relative;
  transition: transform 0.2s;
}
.xmas-card:hover {
  transform: translateY(-4px);
}
.tag-red {
  display: inline-block;
  background: #c41e3a;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 4px;
  margin-bottom: 12px;
}
.xmas-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  margin: 0 0 10px 0;
  color: #f8b229;
}
.xmas-card p {
  font-size: 0.9rem;
  color: #a3c2b0;
  line-height: 1.5;
  margin-bottom: 20px;
}
.xmas-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
}
.xmas-price del {
  font-size: 0.95rem;
  color: #5d7566;
  margin-left: 8px;
  font-weight: normal;
}
.xmas-footer {
  background: #08100b;
  padding: 24px;
  text-align: center;
  color: #5d7566;
  font-size: 0.85rem;
}
`;

export const newyearHtml = `
<main class="ny-template-root">
  <div class="ny-topbar">
    <span>✨ 2026 COUNTDOWN SALE: CELEBRATE WITH 30% OFF SITEWIDE ✨</span>
  </div>
  <header class="ny-header">
    <div class="ny-logo">
      <span>MIDNIGHT SPARKLE STUDIO</span>
    </div>
    <nav class="ny-nav">
      <a href="#drops">Exclusive Drops</a>
      <a href="#resolutions">Resolution Packs</a>
    </nav>
    <a class="ny-btn-gold" href="#drops">Shop Countdown</a>
  </header>

  <section class="ny-hero">
    <div class="ny-hero-box">
      <span class="ny-pill">NEW YEAR, FRESH HORIZONS</span>
      <h1>Ring in the New Season With Bold Style.</h1>
      <p>Celebrate fresh beginnings with exclusive limited-run drops, celebratory discounts, and curated packages designed to elevate your lifestyle.</p>
      <div class="ny-hero-btns">
        <a class="ny-btn-gold" href="#drops">Explore New Year Drops →</a>
      </div>
    </div>
  </section>

  <section class="ny-drops" id="drops">
    <div class="ny-heading">
      <span class="ny-kicker">COUNTDOWN DROPS</span>
      <h2>Celebratory Specials</h2>
    </div>
    <div class="ny-grid">
      <div class="ny-card">
        <h3>Midnight Obsidian Watch Edition</h3>
        <p>Matte black titanium casing, sapphire crystal, and champagne gold index markers.</p>
        <span class="ny-price">$180 <del>$260</del></span>
      </div>
      <div class="ny-card">
        <h3>Champagne Glow Skincare Vault</h3>
        <p>Lactic acid peel, peptide revitalizing ampoules, and 24K gold firming sheet masks.</p>
        <span class="ny-price">$95 <del>$140</del></span>
      </div>
      <div class="ny-card">
        <h3>Resolution Lifestyle Journal &amp; Pen</h3>
        <p>Hand-bound vegan leather daily goal system with refillable brass ballpoint.</p>
        <span class="ny-price">$45 <del>$65</del></span>
      </div>
    </div>
  </section>

  <footer class="ny-footer">
    <p>© Midnight Sparkle New Year Pop-Up Boutique.</p>
  </footer>
</main>
`;

export const newyearCss = `
.ny-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  background-color: #0a0a0f;
  margin: 0;
  padding: 0;
}
.ny-topbar {
  background: linear-gradient(90deg, #ff3366, #ffd700);
  color: #0a0a0f;
  text-align: center;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 1.5px;
}
.ny-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: #14141e;
  border-bottom: 1px solid #232335;
}
.ny-logo {
  font-weight: 800;
  letter-spacing: 2px;
  color: #ffd700;
  font-size: 1.05rem;
}
.ny-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #9e9eb0;
  font-size: 0.92rem;
  font-weight: 500;
}
.ny-nav a:hover {
  color: #ffd700;
}
.ny-btn-gold {
  background: #ffd700;
  color: #0a0a0f;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.88rem;
}
.ny-hero {
  background: linear-gradient(rgba(10, 10, 15, 0.7), rgba(10, 10, 15, 0.85)), url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80') center/cover;
  padding: 130px 24px;
  text-align: center;
}
.ny-hero-box {
  max-width: 820px;
  margin: 0 auto;
}
.ny-pill {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid #ffd700;
  border-radius: 99px;
  font-size: 0.78rem;
  letter-spacing: 2px;
  color: #ffd700;
  margin-bottom: 20px;
  font-weight: 700;
}
.ny-hero h1 {
  font-size: 3.5rem;
  line-height: 1.15;
  margin: 0 0 20px 0;
  color: #ffffff;
  font-weight: 800;
}
.ny-hero p {
  font-size: 1.15rem;
  color: #b0b0c5;
  line-height: 1.6;
  margin-bottom: 34px;
}
.ny-hero-btns {
  display: flex;
  justify-content: center;
}
.ny-drops {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.ny-heading {
  text-align: center;
  margin-bottom: 50px;
}
.ny-kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #ffd700;
  font-weight: 700;
}
.ny-heading h2 {
  font-size: 2.4rem;
  color: #ffffff;
  margin: 8px 0;
  font-weight: 800;
}
.ny-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 26px;
}
.ny-card {
  background: #151522;
  border: 1px solid #28283d;
  border-radius: 10px;
  padding: 30px 24px;
  transition: transform 0.2s, border-color 0.2s;
}
.ny-card:hover {
  transform: translateY(-4px);
  border-color: #ffd700;
}
.ny-card h3 {
  font-size: 1.25rem;
  margin: 0 0 10px 0;
  color: #ffffff;
}
.ny-card p {
  font-size: 0.9rem;
  color: #9e9eb0;
  line-height: 1.5;
  margin-bottom: 20px;
}
.ny-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffd700;
}
.ny-price del {
  font-size: 0.95rem;
  color: #65657a;
  margin-left: 8px;
  font-weight: normal;
}
.ny-footer {
  background: #08080d;
  padding: 24px;
  text-align: center;
  color: #65657a;
  font-size: 0.85rem;
}
`;

export const eidHtml = `
<main class="eid-template-root">
  <div class="eid-topbar">
    <span>🌙 EID MUBARAK! CELEBRATE WITH OUR FESTIVE FAMILY COLLECTION 🌙</span>
  </div>
  <header class="eid-header">
    <div class="eid-logo">
      <span>AL-BARAKAH FESTIVE BAZAAR</span>
    </div>
    <nav class="eid-nav">
      <a href="#hampers">Eid Hampers</a>
      <a href="#attire">Festive Attire</a>
      <a href="#perfumes">Attars &amp; Oud</a>
    </nav>
    <a class="eid-cta" href="#hampers">Explore Bazaar</a>
  </header>

  <section class="eid-hero">
    <div class="eid-hero-box">
      <span class="eid-pill">FESTIVE BLESSINGS &amp; FAMILY JOY</span>
      <h1>Celebrate Eid With Elegance, Joy &amp; Traditions.</h1>
      <p>Handcrafted sweets, artisanal Medjool date gift boxes, pure natural oud elixirs, and bespoke festive apparel for you and your family.</p>
      <div class="eid-hero-buttons">
        <a class="eid-btn-gold" href="#hampers">Browse Eid Hampers ✦</a>
      </div>
    </div>
  </section>

  <section class="eid-bazaar" id="hampers">
    <div class="eid-title-wrap">
      <span class="eid-kicker">FESTIVE GIFTING</span>
      <h2>Curated Eid Hampers</h2>
    </div>
    <div class="eid-grid">
      <div class="eid-card">
        <h3>Royal Medjool &amp; Pistachio Box</h3>
        <p>Stuffed organic Palestinian Medjool dates with roasted almond paste and candied orange peel.</p>
        <span class="eid-price">$48.00</span>
      </div>
      <div class="eid-card">
        <h3>Cambodian Pure Agarwood Oud</h3>
        <p>Single-origin distilled aged oud oil with warm honey and leather notes in a crystal vial.</p>
        <span class="eid-price">$120.00</span>
      </div>
      <div class="eid-card">
        <h3>Artisan Baklava &amp; Turkish Delight</h3>
        <p>Crisp 40-sheet phyllo pastries soaked in blossom honey, walnut crumble, and pomegranate delight.</p>
        <span class="eid-price">$42.00</span>
      </div>
    </div>
  </section>

  <footer class="eid-footer">
    <p>© Al-Barakah Festive Bazaar. Eid Mubarak to all.</p>
  </footer>
</main>
`;

export const eidCss = `
.eid-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #ffffff;
  background-color: #041d08;
  margin: 0;
  padding: 0;
}
.eid-topbar {
  background: #046307;
  color: #ffffff;
  text-align: center;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.eid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: #08320e;
  border-bottom: 1px solid #0f4d17;
}
.eid-logo {
  font-weight: 800;
  letter-spacing: 2px;
  color: #e8c547;
  font-size: 1.05rem;
}
.eid-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #97c79a;
  font-size: 0.92rem;
  font-weight: 500;
}
.eid-nav a:hover {
  color: #e8c547;
}
.eid-cta {
  background: #c8963e;
  color: #041d08;
  padding: 10px 22px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.88rem;
}
.eid-hero {
  background: linear-gradient(rgba(4, 29, 8, 0.7), rgba(4, 29, 8, 0.85)), url('https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1600&q=80') center/cover;
  padding: 130px 24px;
  text-align: center;
}
.eid-hero-box {
  max-width: 820px;
  margin: 0 auto;
}
.eid-pill {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(232, 197, 71, 0.15);
  border: 1px solid #e8c547;
  border-radius: 99px;
  font-size: 0.78rem;
  letter-spacing: 2px;
  color: #e8c547;
  margin-bottom: 20px;
  font-weight: 700;
}
.eid-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3.4rem;
  line-height: 1.15;
  margin: 0 0 20px 0;
  color: #ffffff;
}
.eid-hero p {
  font-size: 1.15rem;
  color: #cae3cb;
  line-height: 1.6;
  margin-bottom: 34px;
}
.eid-hero-buttons {
  display: flex;
  justify-content: center;
}
.eid-btn-gold {
  background: #c8963e;
  color: #041d08;
  padding: 14px 30px;
  border-radius: 99px;
  text-decoration: none;
  font-weight: 800;
}
.eid-bazaar {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.eid-title-wrap {
  text-align: center;
  margin-bottom: 50px;
}
.eid-kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #e8c547;
  font-weight: 700;
}
.eid-title-wrap h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.4rem;
  color: #ffffff;
  margin: 8px 0;
}
.eid-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 26px;
}
.eid-card {
  background: #093c12;
  border: 1px solid #145e1f;
  border-radius: 12px;
  padding: 30px 24px;
  transition: transform 0.2s;
}
.eid-card:hover {
  transform: translateY(-4px);
}
.eid-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  margin: 0 0 10px 0;
  color: #e8c547;
}
.eid-card p {
  font-size: 0.9rem;
  color: #a1c9a4;
  line-height: 1.5;
  margin-bottom: 20px;
}
.eid-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
}
.eid-footer {
  background: #020f04;
  padding: 24px;
  text-align: center;
  color: #557e58;
  font-size: 0.85rem;
}
`;

export const ramadanHtml = `
<main class="ramadan-template-root">
  <div class="ramadan-topbar">
    <span>🌙 RAMADAN KAREEM: BLESSINGS &amp; SERENE SPIRITUAL ESSENTIALS 🌙</span>
  </div>
  <header class="ramadan-header">
    <div class="ramadan-logo">
      <span>NOOR AL-HIDAYAH</span>
    </div>
    <nav class="ramadan-nav">
      <a href="#iftar">Iftar Boxes</a>
      <a href="#essentials">Prayer Essentials</a>
    </nav>
    <a class="ramadan-cta" href="#iftar">Order Essentials</a>
  </header>

  <section class="ramadan-hero">
    <div class="ramadan-hero-box">
      <span class="ramadan-pill">THE BLESSED MONTH OF SERENITY</span>
      <h1>Welcoming the Holy Month of Ramadan.</h1>
      <p>Nourish your family with premium iftar packages, organic dates, hand-woven prayer rugs, and artisan incense to embrace tranquility.</p>
      <div class="ramadan-hero-actions">
        <a class="ramadan-btn-amber" href="#iftar">Shop Ramadan Essentials ✦</a>
      </div>
    </div>
  </section>

  <section class="ramadan-section" id="iftar">
    <div class="ramadan-heading">
      <span class="ramadan-kicker">COMMUNITY &amp; DEVOTION</span>
      <h2>Iftar &amp; Home Essentials</h2>
    </div>
    <div class="ramadan-grid">
      <div class="ramadan-card">
        <h3>Deluxe Family Iftar Hamper</h3>
        <p>Premium Ajwa dates, cold-pressed black seed oil, blossom honey, and spiced tea blends.</p>
        <span class="ramadan-price">$58.00</span>
      </div>
      <div class="ramadan-card">
        <h3>Artisan Hand-Carved Brass Lantern</h3>
        <p>Traditional Moroccan geometric cutwork lantern with amber glass panels for peaceful ambiance.</p>
        <span class="ramadan-price">$65.00</span>
      </div>
      <div class="ramadan-card">
        <h3>Memory Foam Plush Prayer Mat</h3>
        <p>Ergonomic velvet prayer rug with joint relief support and gold embroidered border.</p>
        <span class="ramadan-price">$45.00</span>
      </div>
    </div>
  </section>

  <footer class="ramadan-footer">
    <p>© Noor Al-Hidayah Ramadan Kareem Pop-Up.</p>
  </footer>
</main>
`;

export const ramadanCss = `
.ramadan-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #f5f0e1;
  background-color: #0c141f;
  margin: 0;
  padding: 0;
}
.ramadan-topbar {
  background: #1e3d59;
  color: #f5f0e1;
  text-align: center;
  padding: 8px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.ramadan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 48px;
  background: #152232;
  border-bottom: 1px solid #223750;
}
.ramadan-logo {
  font-weight: 800;
  letter-spacing: 2px;
  color: #d4af37;
  font-size: 1.05rem;
}
.ramadan-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #94a7bd;
  font-size: 0.92rem;
  font-weight: 500;
}
.ramadan-nav a:hover {
  color: #d4af37;
}
.ramadan-cta {
  background: #d4af37;
  color: #0c141f;
  padding: 10px 22px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 800;
  font-size: 0.88rem;
}
.ramadan-hero {
  background: linear-gradient(rgba(12, 20, 31, 0.7), rgba(12, 20, 31, 0.85)), url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1600&q=80') center/cover;
  padding: 130px 24px;
  text-align: center;
}
.ramadan-hero-box {
  max-width: 820px;
  margin: 0 auto;
}
.ramadan-pill {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid #d4af37;
  border-radius: 99px;
  font-size: 0.78rem;
  letter-spacing: 2px;
  color: #d4af37;
  margin-bottom: 20px;
  font-weight: 700;
}
.ramadan-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3.4rem;
  line-height: 1.15;
  margin: 0 0 20px 0;
  color: #f5f0e1;
}
.ramadan-hero p {
  font-size: 1.15rem;
  color: #bdcddc;
  line-height: 1.6;
  margin-bottom: 34px;
}
.ramadan-hero-actions {
  display: flex;
  justify-content: center;
}
.ramadan-btn-amber {
  background: #d4af37;
  color: #0c141f;
  padding: 14px 30px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 800;
}
.ramadan-section {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.ramadan-heading {
  text-align: center;
  margin-bottom: 50px;
}
.ramadan-kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #d4af37;
  font-weight: 700;
}
.ramadan-heading h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.4rem;
  color: #f5f0e1;
  margin: 8px 0;
}
.ramadan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 26px;
}
.ramadan-card {
  background: #172639;
  border: 1px solid #284160;
  border-radius: 12px;
  padding: 30px 24px;
  transition: transform 0.2s;
}
.ramadan-card:hover {
  transform: translateY(-4px);
}
.ramadan-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  margin: 0 0 10px 0;
  color: #d4af37;
}
.ramadan-card p {
  font-size: 0.9rem;
  color: #94a7bd;
  line-height: 1.5;
  margin-bottom: 20px;
}
.ramadan-price {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f5f0e1;
}
.ramadan-footer {
  background: #070c13;
  padding: 24px;
  text-align: center;
  color: #556c84;
  font-size: 0.85rem;
}
`;
