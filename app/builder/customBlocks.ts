import { starterHtml } from './starterTemplates';

export const customBlocks = [
  {
    id: 'salon-template-full',
    label: 'Salon Page',
    category: 'Templates',
    media: '<span class="block-thumb">SP</span>',
    content: starterHtml,
  },
  {
    id: 'salon-hero-block',
    label: 'Salon Hero',
    category: 'Beauty Salon',
    media: '<span class="block-thumb">BH</span>',
    content: `
      <section class="salon-hero">
        <nav class="salon-nav"><strong>GlowHaus</strong><div><a href="#services">Services</a><a href="#about">About</a><a href="#booking">Book</a></div></nav>
        <div class="salon-hero-grid">
          <div class="salon-copy"><p class="salon-kicker">Beauty salon and skin studio</p><h1>Reveal your most radiant skin.</h1><p>Luxury facials, hair styling, nails, and restorative beauty rituals in a calm studio designed around you.</p><div class="salon-actions"><a class="salon-button primary">Book appointment</a><a class="salon-button secondary">View services</a></div></div>
          <div class="salon-portrait"><div class="salon-portrait-card"><span>Beauty portrait</span></div><div class="salon-floating-card"><strong>4.9</strong><span>Client rating</span></div></div>
        </div>
      </section>
    `,
  },
  {
    id: 'salon-services-block',
    label: 'Salon Services',
    category: 'Beauty Salon',
    media: '<span class="block-thumb">BS</span>',
    content: `
      <section class="salon-services">
        <p class="salon-kicker">Our services</p><h2>Everything you need for a polished glow.</h2>
        <div class="salon-service-grid"><article><span>01</span><h3>Signature facial</h3><p>Deep cleanse, sculpting massage, and hydration tailored to your skin.</p></article><article><span>02</span><h3>Hair styling</h3><p>Soft waves, blowouts, color refreshes, and event-ready finishes.</p></article><article><span>03</span><h3>Manicure bar</h3><p>Clean shaping, long-wear polish, nail art, and nourishing hand care.</p></article></div>
      </section>
    `,
  },
  {
    id: 'salon-about-block',
    label: 'Salon About',
    category: 'Beauty Salon',
    media: '<span class="block-thumb">BA</span>',
    content: `
      <section class="salon-about">
        <div class="salon-image-block"><span>Studio interior</span></div>
        <div><p class="salon-kicker">Our approach</p><h2>Soft, modern care with expert hands.</h2><p>Every treatment begins with a consultation and ends with a simple home-care plan. The experience is serene, precise, and never rushed.</p><a class="salon-button primary">Meet the team</a></div>
      </section>
    `,
  },
  {
    id: 'salon-gallery-block',
    label: 'Salon Gallery',
    category: 'Beauty Salon',
    media: '<span class="block-thumb">BG</span>',
    content: `<section class="salon-gallery"><div><span>Facial room</span></div><div><span>Hair styling</span></div><div><span>Nails</span></div></section>`,
  },
  {
    id: 'salon-booking-block',
    label: 'Salon Booking',
    category: 'Beauty Salon',
    media: '<span class="block-thumb">BB</span>',
    content: `
      <section class="salon-booking">
        <div><p class="salon-kicker">Appointments</p><h2>Reserve your glow session.</h2><p>Choose a service and our concierge will confirm the best time for your visit.</p></div>
        <form><input placeholder="Full name"/><input placeholder="Email address"/><select><option>Signature facial</option><option>Hair styling</option><option>Manicure bar</option></select><button class="salon-button primary" type="submit">Request booking</button></form>
      </section>
    `,
  },
  {
    id: 'section-announcement',
    label: 'Announcement',
    category: 'Navigation',
    media: '<span class="block-thumb">!</span>',
    content: `
      <div class="announcement-bar">
        <span>New templates are live</span>
        <a href="#">See what changed</a>
      </div>
    `,
  },
  {
    id: 'section-navbar',
    label: 'Header Nav',
    category: 'Navigation',
    media: '<span class="block-thumb">N</span>',
    content: `
      <nav class="site-nav standalone-nav">
        <strong>Northline</strong>
        <div><a href="#">Work</a><a href="#">Services</a><a href="#">Pricing</a><a href="#">Contact</a></div>
      </nav>
    `,
  },
  {
    id: 'section-hero-split',
    label: 'Hero Split',
    category: 'Sections',
    media: '<span class="block-thumb">H</span>',
    content: `
      <section class="hero-section">
        <div class="hero-grid">
          <div>
            <p class="eyebrow">New collection</p>
            <h1>Build a memorable page in minutes.</h1>
            <p class="lead">Use this section for a strong offer, product story, or campaign intro.</p>
            <div class="hero-actions"><a class="button primary">Get started</a><a class="button secondary">Learn more</a></div>
          </div>
          <div class="showcase-panel"><div class="metric-card"><span>98%</span><p>Customer love</p></div><div class="mock-window"><div></div><div></div><div></div></div></div>
        </div>
      </section>
    `,
  },
  {
    id: 'section-hero-centered',
    label: 'Hero Centered',
    category: 'Sections',
    media: '<span class="block-thumb">HC</span>',
    content: `
      <section class="center-hero">
        <p class="eyebrow">Made for launches</p>
        <h1>One focused page for one strong offer.</h1>
        <p class="lead">A centered hero works well for SaaS, waitlists, products, agencies, and event pages.</p>
        <div class="hero-actions"><a class="button primary">Book demo</a><a class="button secondary">View examples</a></div>
      </section>
    `,
  },
  {
    id: 'section-logos',
    label: 'Logo Row',
    category: 'Trust',
    media: '<span class="block-thumb">L</span>',
    content: `
      <section class="logo-section">
        <p class="eyebrow">Trusted by growing teams</p>
        <div class="logo-row"><span>Atlas</span><span>Bright</span><span>Capsule</span><span>Delta</span><span>Evergreen</span></div>
      </section>
    `,
  },
  {
    id: 'section-stats',
    label: 'Stats',
    category: 'Trust',
    media: '<span class="block-thumb">%</span>',
    content: `
      <section class="stats-section">
        <article><strong>4.9/5</strong><p>Average customer rating</p></article>
        <article><strong>120k</strong><p>Pages published</p></article>
        <article><strong>38%</strong><p>Higher conversion lift</p></article>
      </section>
    `,
  },
  {
    id: 'section-feature-grid',
    label: 'Feature Grid',
    category: 'Sections',
    media: '<span class="block-thumb">3</span>',
    content: `
      <section class="feature-section">
        <p class="eyebrow">Capabilities</p>
        <h2>Everything your next page needs.</h2>
        <div class="feature-grid">
          <article><h3>Fast layouts</h3><p>Drop reusable patterns into the canvas and tune every detail.</p></article>
          <article><h3>Responsive</h3><p>Switch devices and adjust styles without losing the structure.</p></article>
          <article><h3>Exportable</h3><p>Save your project locally or export HTML and CSS.</p></article>
        </div>
      </section>
    `,
  },
  {
    id: 'section-media-text',
    label: 'Media Text',
    category: 'Content',
    media: '<span class="block-thumb">M</span>',
    content: `
      <section class="media-text-section">
        <div class="image-placeholder"><span>Image</span></div>
        <div><p class="eyebrow">Story section</p><h2>Pair strong copy with a visual moment.</h2><p class="lead">Use this section to explain a feature, showcase a location, or frame a product benefit.</p><a class="button primary">Learn more</a></div>
      </section>
    `,
  },
  {
    id: 'section-card-grid',
    label: 'Card Grid',
    category: 'Content',
    media: '<span class="block-thumb">C</span>',
    content: `
      <section class="card-grid-section">
        <p class="eyebrow">Use cases</p>
        <h2>Flexible cards for services, products, or resources.</h2>
        <div class="card-grid">
          <article><span>01</span><h3>Strategy</h3><p>Clarify the offer and shape a page that moves visitors forward.</p></article>
          <article><span>02</span><h3>Design</h3><p>Use balanced sections, strong hierarchy, and reusable visual patterns.</p></article>
          <article><span>03</span><h3>Publish</h3><p>Export the finished page and plug it into your existing stack.</p></article>
          <article><span>04</span><h3>Improve</h3><p>Iterate on copy, layout, and conversion paths as the campaign grows.</p></article>
        </div>
      </section>
    `,
  },
  {
    id: 'section-gallery',
    label: 'Gallery',
    category: 'Media',
    media: '<span class="block-thumb">G</span>',
    content: `
      <section class="gallery-section">
        <div class="gallery-tall"><span>Featured image</span></div>
        <div><span>Detail</span></div>
        <div><span>Detail</span></div>
      </section>
    `,
  },
  {
    id: 'section-pricing',
    label: 'Pricing',
    category: 'Commerce',
    media: '<span class="block-thumb">$</span>',
    content: `
      <section class="pricing-section">
        <p class="eyebrow">Plans</p>
        <h2>Simple pricing for serious teams.</h2>
        <div class="pricing-grid">
          <article><h3>Starter</h3><strong>$19</strong><p>For lean landing pages.</p><a class="button secondary">Choose Starter</a></article>
          <article class="featured"><h3>Studio</h3><strong>$49</strong><p>For teams shipping campaigns.</p><a class="button primary">Choose Studio</a></article>
          <article><h3>Scale</h3><strong>$99</strong><p>For growing site systems.</p><a class="button secondary">Choose Scale</a></article>
        </div>
      </section>
    `,
  },
  {
    id: 'section-product',
    label: 'Product',
    category: 'Commerce',
    media: '<span class="block-thumb">P</span>',
    content: `
      <section class="product-section">
        <div class="product-image"><span>Product image</span></div>
        <div><p class="eyebrow">Featured item</p><h2>Premium workspace kit.</h2><p class="lead">Describe the product, bundle, or offer with enough detail to help visitors act.</p><strong>$149</strong><a class="button primary">Add to cart</a></div>
      </section>
    `,
  },
  {
    id: 'section-testimonial',
    label: 'Testimonial',
    category: 'Trust',
    media: '<span class="block-thumb">“</span>',
    content: `
      <section class="quote-section">
        <blockquote>“The builder gives our team enough structure to move quickly and enough freedom to make each page feel intentional.”</blockquote>
        <p>Amara Lee, Product Lead</p>
      </section>
    `,
  },
  {
    id: 'section-team',
    label: 'Team',
    category: 'Trust',
    media: '<span class="block-thumb">T</span>',
    content: `
      <section class="team-section">
        <p class="eyebrow">Team</p>
        <h2>People behind the work.</h2>
        <div class="team-grid">
          <article><div></div><h3>Mira Stone</h3><p>Creative Director</p></article>
          <article><div></div><h3>Jon Bell</h3><p>Growth Lead</p></article>
          <article><div></div><h3>Ava Quinn</h3><p>Product Designer</p></article>
        </div>
      </section>
    `,
  },
  {
    id: 'section-timeline',
    label: 'Timeline',
    category: 'Content',
    media: '<span class="block-thumb">→</span>',
    content: `
      <section class="timeline-section">
        <p class="eyebrow">Process</p>
        <h2>From brief to published page.</h2>
        <ol><li><strong>Plan</strong><p>Choose the page goal and section flow.</p></li><li><strong>Build</strong><p>Drag blocks, edit copy, and style each component.</p></li><li><strong>Ship</strong><p>Export the page and connect it to your publishing workflow.</p></li></ol>
      </section>
    `,
  },
  {
    id: 'section-faq',
    label: 'FAQ',
    category: 'Content',
    media: '<span class="block-thumb">?</span>',
    content: `
      <section class="faq-section">
        <p class="eyebrow">Questions</p>
        <h2>Helpful answers before visitors ask.</h2>
        <details open><summary>Can I customize every section?</summary><p>Yes. Text, spacing, color, layout, and CSS are editable in the inspector.</p></details>
        <details><summary>Can I export the result?</summary><p>Use the export control to download generated HTML and CSS.</p></details>
      </section>
    `,
  },
  {
    id: 'section-newsletter',
    label: 'Newsletter',
    category: 'Forms',
    media: '<span class="block-thumb">✉</span>',
    content: `
      <section class="newsletter-section">
        <div><p class="eyebrow">Newsletter</p><h2>Get the next launch note.</h2></div>
        <form><input type="email" placeholder="Email address"/><button class="button primary" type="submit">Subscribe</button></form>
      </section>
    `,
  },
  {
    id: 'section-contact',
    label: 'Contact',
    category: 'Forms',
    media: '<span class="block-thumb">@</span>',
    content: `
      <section class="contact-section" id="contact">
        <div><p class="eyebrow">Contact</p><h2>Tell us what you want to build.</h2><p class="lead">Use this form block for lead capture, onboarding, or support flows.</p></div>
        <form><input placeholder="Name"/><input placeholder="Email"/><textarea placeholder="Project notes"></textarea><button class="button primary" type="submit">Send message</button></form>
      </section>
    `,
  },
  {
    id: 'section-cta',
    label: 'CTA Band',
    category: 'Sections',
    media: '<span class="block-thumb">Go</span>',
    content: `
      <section class="cta-section">
        <h2>Ready to turn the next idea into a finished page?</h2>
        <a class="button primary">Start building</a>
      </section>
    `,
  },
  {
    id: 'section-footer',
    label: 'Footer',
    category: 'Navigation',
    media: '<span class="block-thumb">F</span>',
    content: `
      <footer class="footer-section">
        <strong>Northline</strong>
        <div><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></div>
        <p>© 2026 Northline. All rights reserved.</p>
      </footer>
    `,
  },
]

const customCss = `
  .salon-page { font-family: "Inter", ui-sans-serif, system-ui, sans-serif; color: #34251f; background: #fff8f3; }
  .salon-hero { min-height: 760px; padding: 28px 56px 82px; background: radial-gradient(circle at 78% 18%, #f4cfc6 0 16%, transparent 34%), linear-gradient(135deg, #fff7f1 0%, #f6dfd6 54%, #e8c2b5 100%); }
  .salon-nav { height: 68px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(93,62,51,.16); }
  .salon-nav strong { font-family: Georgia, serif; font-size: 26px; letter-spacing: 0; }
  .salon-nav div { display: flex; gap: 26px; font-size: 14px; font-weight: 700; }
  .salon-nav a { color: #4c342c; text-decoration: none; }
  .salon-hero-grid { max-width: 1180px; margin: 78px auto 0; display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 70px; align-items: center; }
  .salon-kicker { margin: 0 0 18px; color: #9f6654; text-transform: uppercase; letter-spacing: .16em; font-size: 12px; font-weight: 800; }
  .salon-copy h1, .salon-hero h1 { margin: 0 0 24px; max-width: 710px; font-family: Georgia, serif; font-size: clamp(48px, 7vw, 88px); line-height: .94; letter-spacing: 0; color: #2b1d18; }
  .salon-copy p, .salon-about p, .salon-booking p { color: #73574e; font-size: 19px; line-height: 1.65; }
  .salon-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 32px; }
  .salon-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; padding: 0 22px; border-radius: 999px; text-decoration: none; font-weight: 800; border: 1px solid rgba(78,46,36,.18); }
  .salon-button.primary { background: #3b241d; color: white; }
  .salon-button.secondary { background: rgba(255,255,255,.54); color: #3b241d; }
  .salon-portrait { position: relative; min-height: 520px; }
  .salon-portrait-card, .salon-image-block, .salon-gallery div { display: grid; place-items: center; border-radius: 220px 220px 10px 10px; background: linear-gradient(160deg, #d9a595, #f1d8cf); color: #6b4b42; font-weight: 800; box-shadow: 0 28px 80px rgba(92,55,43,.18); }
  .salon-portrait-card { min-height: 520px; }
  .salon-floating-card { position: absolute; left: -38px; bottom: 48px; width: 156px; padding: 22px; border-radius: 18px; background: #fffaf6; box-shadow: 0 20px 60px rgba(92,55,43,.18); }
  .salon-floating-card strong { display: block; font-size: 42px; line-height: 1; font-family: Georgia, serif; }
  .salon-floating-card span { color: #8b6a60; font-size: 13px; font-weight: 800; }
  .salon-services, .salon-about, .salon-gallery, .salon-testimonial, .salon-booking, .salon-footer { padding: 92px 56px; }
  .salon-services { background: #fffaf6; }
  .salon-services > *, .salon-testimonial > * { max-width: 1180px; margin-left: auto; margin-right: auto; }
  .salon-services h2, .salon-about h2, .salon-booking h2 { margin: 0 0 34px; max-width: 760px; font-family: Georgia, serif; font-size: clamp(38px, 5vw, 66px); line-height: 1; letter-spacing: 0; color: #2b1d18; }
  .salon-service-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
  .salon-service-grid article { min-height: 260px; padding: 28px; border: 1px solid #edd8d0; border-radius: 20px; background: #ffffff; }
  .salon-service-grid span { display: block; margin-bottom: 46px; color: #b27a68; font-weight: 900; }
  .salon-service-grid h3 { margin: 0 0 12px; font-size: 24px; }
  .salon-service-grid p { margin: 0; color: #775b52; line-height: 1.58; }
  .salon-about { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1fr); gap: 68px; align-items: center; background: #f8e9e1; }
  .salon-image-block { min-height: 540px; border-radius: 10px 220px 220px 10px; }
  .salon-gallery { display: grid; grid-template-columns: 1.1fr .9fr .9fr; gap: 18px; background: #fffaf6; }
  .salon-gallery div { min-height: 420px; border-radius: 26px; }
  .salon-gallery div:first-child { min-height: 560px; border-radius: 220px 220px 26px 26px; }
  .salon-testimonial { text-align: center; background: #3b241d; color: white; }
  .salon-testimonial blockquote { max-width: 920px; margin: 0 auto 24px; font-family: Georgia, serif; font-size: clamp(34px, 5vw, 68px); line-height: 1.04; }
  .salon-testimonial p { margin: 0; color: #ead1c8; }
  .salon-booking { display: grid; grid-template-columns: minmax(0, .9fr) minmax(320px, .75fr); gap: 56px; background: #fff8f3; }
  .salon-booking form { display: grid; gap: 14px; padding: 28px; border-radius: 24px; background: white; border: 1px solid #edd8d0; box-shadow: 0 18px 50px rgba(92,55,43,.1); }
  .salon-booking input, .salon-booking select { min-height: 48px; border: 1px solid #e4ccc3; border-radius: 999px; padding: 0 16px; font: inherit; color: #3b241d; background: #fffaf6; }
  .salon-footer { display: grid; grid-template-columns: 1fr auto; gap: 18px; background: #2b1d18; color: white; }
  .salon-footer strong { font-family: Georgia, serif; font-size: 28px; }
  .salon-footer div { display: flex; gap: 20px; }
  .salon-footer a { color: white; text-decoration: none; }
  .salon-footer p { grid-column: 1 / -1; margin: 0; color: #d9beb5; }
  @media (max-width: 860px) {
    .salon-hero, .salon-services, .salon-about, .salon-gallery, .salon-testimonial, .salon-booking, .salon-footer { padding-left: 24px; padding-right: 24px; }
    .salon-hero-grid, .salon-service-grid, .salon-about, .salon-gallery, .salon-booking, .salon-footer { grid-template-columns: 1fr; }
    .salon-nav div { display: none; }
    .salon-floating-card { left: 18px; }
  }
  .announcement-bar { min-height: 44px; display: flex; justify-content: center; align-items: center; gap: 14px; padding: 8px 22px; background: #17202a; color: white; font-size: 14px; }
  .announcement-bar a { color: #f6c453; font-weight: 800; text-decoration: none; }
  .standalone-nav { padding: 0 52px; background: white; }
  .center-hero { min-height: 620px; display: grid; place-items: center; justify-items: center; text-align: center; padding: 92px 32px; background: #f7f8f6; }
  .center-hero h1, .center-hero .lead { margin-left: auto; margin-right: auto; }
  .logo-section, .stats-section, .pricing-section, .quote-section, .faq-section, .contact-section, .media-text-section, .card-grid-section, .gallery-section, .product-section, .team-section, .timeline-section, .newsletter-section, .cta-section, .footer-section { padding: 88px 52px; background: #fff; }
  .pricing-section > *, .faq-section > *, .logo-section > *, .card-grid-section > *, .team-section > *, .timeline-section > * { max-width: 1180px; margin-left: auto; margin-right: auto; }
  .logo-row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  .logo-row span { display: grid; place-items: center; min-height: 84px; border: 1px solid #e2e4de; border-radius: 8px; color: #647069; font-weight: 800; }
  .stats-section { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; background: #17202a; color: white; }
  .stats-section article { border: 1px solid rgba(255,255,255,.18); border-radius: 8px; padding: 28px; }
  .stats-section strong { display: block; font-size: 54px; line-height: 1; margin-bottom: 12px; }
  .media-text-section, .product-section { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1fr); gap: 52px; align-items: center; background: #f7f8f6; }
  .image-placeholder, .product-image, .gallery-section > div, .team-grid article div { display: grid; place-items: center; min-height: 360px; border-radius: 8px; background: #dbe7e1; color: #56645d; font-weight: 800; }
  .card-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
  .card-grid article { border: 1px solid #e2e4de; border-radius: 8px; padding: 24px; background: #fbfbf8; }
  .card-grid span { display: block; margin-bottom: 28px; color: #7b8b83; font-weight: 800; }
  .gallery-section { display: grid; grid-template-columns: 1.2fr .8fr; gap: 18px; background: #f7f8f6; }
  .gallery-section .gallery-tall { grid-row: span 2; min-height: 520px; }
  .product-section strong { display: block; margin: 0 0 22px; font-size: 44px; }
  .pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; max-width: 1180px; margin: 0 auto; }
  .pricing-grid article { border: 1px solid #e2e4de; border-radius: 8px; padding: 28px; background: #fbfbf8; display: grid; gap: 18px; }
  .pricing-grid .featured { background: #17202a; color: white; }
  .pricing-grid strong { font-size: 46px; }
  .quote-section { background: #e9f0ec; text-align: center; }
  .quote-section blockquote { max-width: 880px; margin: 0 auto 24px; font-size: clamp(32px, 5vw, 62px); line-height: 1.05; font-weight: 800; }
  .quote-section p { margin: 0; color: #53605d; }
  .team-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
  .team-grid article { border: 1px solid #e2e4de; border-radius: 8px; padding: 18px; background: #fbfbf8; }
  .team-grid article div { min-height: 260px; margin-bottom: 18px; background: #e1e8e4; }
  .timeline-section ol { list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; padding: 0; margin: 0; }
  .timeline-section li { border-top: 4px solid #17202a; padding-top: 20px; }
  .faq-section details { max-width: 880px; border-top: 1px solid #d9ddd5; padding: 22px 0; }
  .faq-section summary { cursor: pointer; font-size: 21px; font-weight: 800; }
  .faq-section details p { color: #58635f; line-height: 1.55; }
  .newsletter-section { display: flex; align-items: center; justify-content: space-between; gap: 24px; background: #e9f0ec; }
  .newsletter-section form { display: flex; gap: 10px; min-width: min(100%, 480px); }
  .newsletter-section input { flex: 1; min-height: 46px; border: 1px solid #d8dcd4; border-radius: 6px; padding: 10px 12px; font: inherit; }
  .contact-section { display: grid; grid-template-columns: minmax(0, .8fr) minmax(320px, .7fr); gap: 48px; align-items: start; background: #f7f8f6; }
  .contact-section form { display: grid; gap: 12px; padding: 24px; border-radius: 8px; background: white; border: 1px solid #e2e4de; }
  .contact-section input, .contact-section textarea { min-height: 44px; border: 1px solid #d8dcd4; border-radius: 6px; padding: 10px 12px; font: inherit; }
  .contact-section textarea { min-height: 120px; resize: vertical; }
  .cta-section { display: flex; align-items: center; justify-content: space-between; gap: 24px; background: #f6c453; }
  .cta-section h2 { margin: 0; }
  .footer-section { display: grid; grid-template-columns: 1fr auto; gap: 18px; background: #17202a; color: white; }
  .footer-section div { display: flex; gap: 18px; }
  .footer-section a { color: white; text-decoration: none; }
  .footer-section p { grid-column: 1 / -1; margin: 0; color: rgba(255,255,255,.68); }
  @media (max-width: 860px) { .logo-section, .stats-section, .pricing-section, .quote-section, .faq-section, .contact-section, .media-text-section, .card-grid-section, .gallery-section, .product-section, .team-section, .timeline-section, .newsletter-section, .cta-section, .footer-section { padding: 64px 22px; } .logo-row, .stats-section, .pricing-grid, .contact-section, .media-text-section, .card-grid, .gallery-section, .product-section, .team-grid, .timeline-section ol, .newsletter-section, .cta-section, .footer-section { grid-template-columns: 1fr; } .newsletter-section, .cta-section { display: grid; } .newsletter-section form { min-width: 0; flex-direction: column; } }
`
