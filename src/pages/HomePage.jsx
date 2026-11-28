import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [pageContent, setPageContent] = useState({});
  const [openFaq, setOpenFaq] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadAllContent() {
      try {
        const [coursesData, highlightsData, faqsData, contentData] = await Promise.all([
          wixClient.getCourses(),
          wixClient.getHomeHighlights(),
          wixClient.getFAQs(),
          wixClient.getPageContent('home')
        ]);
        if (isMounted) {
          setCourses(coursesData && coursesData.length ? coursesData : wixClient.getDefaultCourses());
          setHighlights(highlightsData && highlightsData.length ? highlightsData : wixClient.getDefaultHomeHighlights());
          setFaqs(faqsData && faqsData.length ? faqsData : wixClient.getDefaultFAQs());
          setPageContent(contentData || wixClient.getDefaultPageContent('home'));
        }
      } catch (err) {
        if (isMounted) {
          setCourses(wixClient.getDefaultCourses());
          setHighlights(wixClient.getDefaultHomeHighlights());
          setFaqs(wixClient.getDefaultFAQs());
          setPageContent(wixClient.getDefaultPageContent('home'));
        }
      }
    }
    loadAllContent();
    return () => { isMounted = false; };
  }, []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    try {
      const subs = JSON.parse(localStorage.getItem('wix_subscribers') || '[]');
      if (!subs.includes(newsletterEmail.trim())) {
        subs.push(newsletterEmail.trim());
        localStorage.setItem('wix_subscribers', JSON.stringify(subs));
      }
    } catch (err) { }
    setNewsletterMsg('🎉 Thank you for subscribing! You will receive our latest course updates and offers.');
    setNewsletterEmail('');
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const defaultContent = wixClient.getDefaultPageContent('home');
  const hero = pageContent.hero || defaultContent.hero;
  const about = pageContent.about || defaultContent.about;
  const corporate = pageContent.corporate || defaultContent.corporate;
  const newsletter = pageContent.newsletter || defaultContent.newsletter;

  const displayedList = courses.length ? courses : wixClient.getDefaultCourses();
  const displayedHighlights = highlights.length ? highlights : wixClient.getDefaultHomeHighlights();
  const displayedFaqs = faqs.length ? faqs : wixClient.getDefaultFAQs();
  const categories = wixClient.getCategories(displayedList);

  const filteredCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory);

  const aboutPoints = (about.points || "✓ WSIB-compliant workplace first aid training\n✓ Interactive, hands-on classroom practice with manikins & AED trainers\n✓ Serving Thunder Bay, Nipigon, Terrace Bay and surrounding areas")
    .split(/\r?\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="home" />
      <div style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="hero">
          <img
            src={hero.imageUrl || "https://static.wixstatic.com/media/0ec70773d1ca4891a636a4623e110cc9.jpg"}
            alt="First Aid Training"
            className="hero-bg-img"
          />
          <div className="hero-gradient"></div>
          <div className="container">
            <div className="hero-content">
              <div className="pill-badge">
                <span>🛡️</span> {hero.badge || "Canadian Red Cross Training Partner"}
              </div>
              <h1 className="hero-title">
                {hero.title || "WSIB Approved First Aid Training in Thunder Bay"}
              </h1>
              <p className="hero-sub">
                {hero.subtitle || "As a Canadian Red Cross Training Partner, our first aid courses are WSIB approved in Ontario, so your certification meets workplace safety requirements with confidence."}
              </p>
              <div className="hero-btns">
                <a href={hero.buttonLink || "/courses"} className="btn btn-primary btn-lg">
                  {hero.buttonText || "Book a Course →"}
                </a>
                <a href="/locations" className="btn btn-outline btn-lg">View Locations</a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Stats Floating Bar */}
        <div className="trust-bar">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">🏅</div>
              <div>
                <div className="trust-label">Red Cross Certified</div>
                <div className="trust-sub">Valid for 3 years</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🛡️</div>
              <div>
                <div className="trust-label">WSIB Approved</div>
                <div className="trust-sub">Meets Ontario requirements</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">📍</div>
              <div>
                <div className="trust-label">3 Communities</div>
                <div className="trust-sub">Thunder Bay &amp; region</div>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">📅</div>
              <div>
                <div className="trust-label">Easy Online Booking</div>
                <div className="trust-sub">Pick your date &amp; time</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <section className="section" style={{ background: '#fff', paddingTop: '20px' }}>
          <div className="container about-grid">
            <div>
              <p className="section-eyebrow">{about.eyebrow || "ABOUT KANOVA LIFE"}</p>
              <h2 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '20px' }}>
                {about.title || "Canadian Red Cross Training Partner in Thunder Bay"}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '24px' }}>
                {about.description || "Kanova Life provides Canadian Red Cross First Aid, CPR/AED and Basic Life Support training across Northern Ontario. Whether you need certification for your workplace, school program, or personal confidence, our experienced instructors deliver practical, hands-on courses in an engaging and supportive environment."}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {aboutPoints.map((point, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> {point.replace(/^[✓•\-\*]\s*/, '')}
                  </div>
                ))}
              </div>
              <a href={about.buttonLink || "/courses"} className="btn btn-primary">
                {about.buttonText || "Browse Upcoming Sessions →"}
              </a>
            </div>
            <div>
              <img
                src={about.imageUrl || "https://static.wixstatic.com/media/2c3d7b_39839bc5388e4600b74859f9a2c7f3a1~mv2.jpg"}
                alt="First Aid CPR Training"
                style={{ width: '100%', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}
              />
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="section" id="courses">
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">OUR COURSES &amp; PROGRAMS</p>
              <h2 className="section-title">Master Life-Saving Skills</h2>
              <p className="section-desc">Explore our 7 specialized training categories certified by the Canadian Red Cross.</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="category-nav-wrapper">
              <div className="category-nav">
                <button
                  type="button"
                  className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.shortName || cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div id="home-courses-container">
              {filteredCategories.map(cat => {
                const catCourses = displayedList.filter(c => {
                  let courseCatId = (c.categoryId || '').trim().toLowerCase();
                  if (!courseCatId && c.category) {
                    let clean = c.category.replace(/\s*\(\s*coming\s*soon\s*\)/i, '').trim();
                    courseCatId = 'cat-' + clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  }
                  return courseCatId === cat.id.toLowerCase();
                });
                if (!catCourses.length) return null;

                return (
                  <div key={cat.id} className="category-group" data-category={cat.id}>
                    <div className="category-header">
                      <div className="category-title-row">
                        <h3 className="category-title">
                          <span>{cat.isComingSoon ? '⏳' : '📋'}</span> {cat.name}
                          {cat.isComingSoon && <span className="badge-soon">Coming Soon</span>}
                        </h3>
                      </div>
                    </div>
                    <div className="course-grid">
                      {catCourses.map(course => {
                        const title = course.title || course.name;
                        const price = Number(course.price) || 0;
                        const badge = course.badge || (course.isComingSoon ? 'Coming Soon' : 'Certified');
                        const img = wixClient.resolveImageUrl(course.image || course.imageUrl, '/images/course-1.jpg');
                        const linkId = course.id || course.slug;

                        return (
                          <a
                            key={course.id || title}
                            href={`#/course-detail?course=${linkId}`}
                            className="course-card"
                          >
                            <div className="course-img-wrapper">
                              <img src={img} alt={title} className="course-img" loading="lazy" />
                            </div>
                            <div className="course-body">
                              <span className={course.isComingSoon ? 'badge-soon' : 'badge-pill'}>{badge}</span>
                              <h4 className="course-name">{title}</h4>
                              <div className="course-footer">
                                <span className="course-price" style={course.isComingSoon ? { color: '#64748b' } : {}}>
                                  ${price.toFixed(2)}
                                </span>
                                <span className="course-link">
                                  Learn More &rarr;
                                </span>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '48px' }}>
              <a href="/courses" className="btn btn-primary btn-lg">
                View All 7 Categories &amp; Detailed Schedules &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* Course Highlights - CMS Powered */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">QUALITY TRAINING</p>
              <h2 className="section-title">Course Highlights</h2>
              <p className="section-desc">Why thousands of Northern Ontario professionals trust our programs.</p>
            </div>
            <div className="highlights-grid home-highlights-grid">
              {displayedHighlights.map((hl, idx) => (
                <div key={hl.id || idx} className="highlight-card home-highlight-card">
                  <div className="home-highlight-img-wrap">
                    <img
                      src={hl.imageUrl || "https://static.wixstatic.com/media/2c3d7b_39839bc5388e4600b74859f9a2c7f3a1~mv2.jpg"}
                      alt={hl.title}
                      className="home-highlight-img"
                    />
                  </div>
                  <div className="highlight-body">
                    <h3 className="highlight-title">{hl.title}</h3>
                    <p className="highlight-desc">{hl.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Subscribe - CMS Powered */}
        <section className="section newsletter-section">
          <div className="container">
            <div className="newsletter-card">
              <div className="newsletter-content">
                <p className="section-eyebrow" style={{ color: 'var(--primary)' }}>
                  {newsletter.eyebrow || "STAY INFORMED & SAVE"}
                </p>
                <h2 className="newsletter-title">
                  {newsletter.title || "Subscribe to Our Newsletter"}
                </h2>
                <p className="newsletter-desc">
                  {newsletter.description || "Stay up to date with upcoming First Aid & CPR course schedules in Thunder Bay, safety tips, workplace compliance updates, and exclusive discount codes directly to your inbox."}
                </p>
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <div className="newsletter-input-group">
                    <input
                      type="email"
                      className="newsletter-input"
                      placeholder="Enter your email address..."
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-lg newsletter-btn">
                      <span>Subscribe</span> &rarr;
                    </button>
                  </div>
                  {newsletterMsg && (
                    <p className="newsletter-msg" style={{ display: 'block', color: '#16a34a', fontWeight: 600, marginTop: '14px' }}>
                      {newsletterMsg}
                    </p>
                  )}
                </form>
                <p className="newsletter-privacy">
                  <span>🔒</span> We respect your privacy. Unsubscribe anytime with one click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Private Bookings Banner - CMS Powered */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="corporate-cta-card">
              <p className="section-eyebrow" style={{ color: '#f87171' }}>
                {corporate.eyebrow || "PRIVATE & CORPORATE TRAINING"}
              </p>
              <h2 className="corporate-cta-title">
                {corporate.title || "Custom Group Training for Your Team"}
              </h2>
              <p className="corporate-cta-desc">
                {corporate.description || "We bring Canadian Red Cross certified training directly to your workplace, facility or community center in Northern Ontario. Flexible scheduling for groups of all sizes."}
              </p>
              <a href={corporate.buttonLink || "/locations"} className="btn btn-primary btn-lg">
                {corporate.buttonText || "Inquire for Group Training →"}
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Section - CMS Powered */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">COMMON QUESTIONS</p>
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>
            <div className="faq-list">
              {displayedFaqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.id || i} className="faq-item">
                    <button type="button" className="faq-btn" onClick={() => toggleFaq(i)}>
                      {faq.q}
                      <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-content" style={{ display: 'block' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
