export const bakeryHtml = `
<main class="bakery-template-root">
  <header class="artisan-bakery-header">
    <div class="bakery-brand">
      <span class="brand-symbol">🥖</span>
      <span>LA CROISSANTERIE & BAKERY</span>
    </div>
    <nav class="bakery-nav">
      <a href="#menu">Daily Bakes</a>
      <a href="#story">Craft & Sourdough</a>
      <a href="#preorder">Pre-Order Now</a>
    </nav>
    <a class="bakery-cta-btn" href="#preorder">Order for Pickup</a>
  </header>

  <section class="bakery-hero">
    <div class="bakery-hero-box">
      <span class="bakery-tag">STONE-GROUND ORGANIC GRAINS • WILD FERMENTATION</span>
      <h1>Golden Flaky Pastries & Slow-Fermented Breads.</h1>
      <p>Baked fresh every morning at 4:30 AM using French Normandy butter, heritage wild starter, and natural stone-milled flours.</p>
      <div class="bakery-hero-actions">
        <a class="bakery-btn-warm" href="#menu">Browse Daily Oven →</a>
        <a class="bakery-btn-clear" href="#preorder">Order Weekend Box</a>
      </div>
    </div>
  </section>

  <section class="bakery-bakes" id="menu">
    <div class="bakery-title-wrap">
      <span class="bakery-kicker">HOT FROM OUR WOOD-FIRED DECK</span>
      <h2>Morning Pastries & Artisan Loaves</h2>
      <p>Hand-laminated croissants, sourdough baguettes, and sweet brioche made with devotion.</p>
    </div>
    <div class="bakery-grid">
      <div class="bakery-item-card">
        <div class="card-badge">Bestseller</div>
        <h3>Isigny Butter Croissant</h3>
        <p>72 delicate micro-layers of French butter, crisp shattering crust, and airy honeycomb interior.</p>
        <span class="item-price">$4.75</span>
      </div>
      <div class="bakery-item-card">
        <div class="card-badge">Wild Starter</div>
        <h3>Country Sourdough Boule</h3>
        <p>36-hour cold ferment using dark rye and whole wheat. Deep blistered crust with custard-like crumb.</p>
        <span class="item-price">$9.50</span>
      </div>
      <div class="bakery-item-card">
        <div class="card-badge">Pain au Chocolat</div>
        <h3>Valrhona Double Chocolate</h3>
        <p>Golden laminated viennoiserie pastry folded with two batons of 66% Valrhona dark chocolate.</p>
        <span class="item-price">$5.25</span>
      </div>
      <div class="bakery-item-card">
        <div class="card-badge">Seasonal Fruit</div>
        <h3>Cardamom Pistachio Morning Bun</h3>
        <p>Caramelized brown butter pastry tossed in crushed green cardamom sugar and toasted Sicilian pistachios.</p>
        <span class="item-price">$5.50</span>
      </div>
    </div>
  </section>

  <section class="bakery-preorder" id="preorder">
    <div class="preorder-container">
      <h2>Skip the Morning Line — Pre-Order Online</h2>
      <p>Reserve your weekend pastries, celebration cakes, and fresh loaves 24 hours in advance.</p>
      <form class="bakery-order-form">
        <input type="text" placeholder="Customer Name" required />
        <input type="tel" placeholder="Mobile Phone for SMS Confirmation" required />
        <select>
          <option>Weekend Pastry Sampler Box (6 items - $28)</option>
          <option>Baker's Choice Sourdough & Baguette Pack ($18)</option>
          <option>Dozen Butter & Chocolate Croissant Pack ($52)</option>
          <option>Celebration Pistachio Tart ($42)</option>
        </select>
        <button type="submit" class="bakery-btn-warm">Place Pre-Order</button>
      </form>
    </div>
  </section>

  <footer class="bakery-footer">
    <p>© La Croissanterie Artisan French Bakery. Open Daily 7:00 AM - 3:00 PM.</p>
  </footer>
</main>
`;

export const bakeryCss = `
.bakery-template-root {
  font-family: 'DM Sans', sans-serif;
  color: #382923;
  background-color: #faf5f0;
  margin: 0;
  padding: 0;
}
.artisan-bakery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 48px;
  background: #ffffff;
  border-bottom: 1px solid #ebd9cc;
}
.bakery-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #5c3826;
  font-size: 1.05rem;
}
.brand-symbol {
  font-size: 1.3rem;
}
.bakery-nav a {
  margin: 0 16px;
  text-decoration: none;
  color: #6e5447;
  font-size: 0.92rem;
  font-weight: 500;
}
.bakery-nav a:hover {
  color: #c4622d;
}
.bakery-cta-btn {
  background: #c4622d;
  color: #ffffff;
  padding: 10px 22px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
}
.bakery-hero {
  background: linear-gradient(rgba(35, 20, 14, 0.65), rgba(35, 20, 14, 0.75)), url('https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80') center/cover;
  color: #ffffff;
  padding: 130px 24px;
  text-align: center;
}
.bakery-hero-box {
  max-width: 820px;
  margin: 0 auto;
}
.bakery-tag {
  display: inline-block;
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #f7ba8b;
  margin-bottom: 16px;
  font-weight: 600;
}
.bakery-hero h1 {
  font-family: 'Playfair Display', serif;
  font-size: 3.4rem;
  line-height: 1.16;
  margin: 0 0 18px 0;
  font-weight: 500;
}
.bakery-hero p {
  font-size: 1.15rem;
  color: #fae8dc;
  line-height: 1.6;
  margin-bottom: 34px;
}
.bakery-hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.bakery-btn-warm {
  background: #c4622d;
  color: #ffffff;
  padding: 14px 30px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.bakery-btn-clear {
  border: 1px solid rgba(255,255,255,0.7);
  color: #ffffff;
  padding: 14px 28px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
}
.bakery-bakes {
  max-width: 1140px;
  margin: 80px auto;
  padding: 0 24px;
}
.bakery-title-wrap {
  text-align: center;
  margin-bottom: 50px;
}
.bakery-kicker {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #c4622d;
  font-weight: 700;
}
.bakery-title-wrap h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.4rem;
  color: #3b2217;
  margin: 8px 0;
}
.bakery-title-wrap p {
  color: #7d6154;
}
.bakery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 26px;
}
.bakery-item-card {
  background: #ffffff;
  border: 1px solid #ebd9cc;
  border-radius: 10px;
  padding: 30px 22px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}
.bakery-item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(80, 40, 20, 0.08);
}
.card-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #c4622d;
  margin-bottom: 10px;
}
.bakery-item-card h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.28rem;
  margin: 0 0 10px 0;
  color: #331f16;
}
.bakery-item-card p {
  font-size: 0.9rem;
  color: #634f45;
  line-height: 1.5;
  margin-bottom: 18px;
}
.item-price {
  font-weight: 700;
  color: #943d0e;
  font-size: 1.1rem;
}
.bakery-preorder {
  background: #2b1810;
  color: #ffffff;
  padding: 80px 24px;
  text-align: center;
}
.preorder-container {
  max-width: 600px;
  margin: 0 auto;
}
.preorder-container h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.3rem;
  color: #f7e1d2;
  margin-bottom: 10px;
}
.preorder-container p {
  color: #c7a797;
  margin-bottom: 30px;
}
.bakery-order-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.bakery-order-form input, .bakery-order-form select {
  padding: 14px 18px;
  border-radius: 6px;
  border: 1px solid #4d3327;
  background: #1c0e08;
  color: #fff;
  font-size: 0.95rem;
}
.bakery-footer {
  background: #1a0d08;
  padding: 24px;
  text-align: center;
  color: #9c7f71;
  font-size: 0.85rem;
}
`;
