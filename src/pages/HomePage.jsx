import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

const FAQS = [
  {
    q: "What is your booking policy?",
    a: "Registrations for our courses may be placed at any time, based on availability shown on our website. Course registrations and purchases are strictly non-refundable, but we understand that plans can change, so we offer flexible options for rescheduling or transferring your booking. If you need to change your booking, we're happy to reschedule you to another convenient date or provide a course credit, provided you give us at least 48 hours' notice before your scheduled training. Course credits do not expire and may be transferred to another individual or course. 48 hours' notice or more — No fee to reschedule, or you may choose to receive a course credit. Less than 48 hours' notice — A rescheduling fee of 50% of your course fee applies. Same-day cancellation or missed course — Your seat is forfeited and the course must be rebooked at the regular course fee."
  },
  {
    q: "Are your courses WSIB approved?",
    a: "Yes, all our courses are WSIB-approved and meet the requirements for workplace safety standards in Ontario."
  },
  {
    q: "Which course should I take?",
    a: "For workplace requirements, we recommend Standard First Aid with CPR/AED Level C. If you only need foundational life-saving skills, Emergency First Aid is a great 1-day option. For healthcare providers, Basic Life Support (BLS) is required."
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept online payments through our website using major credit cards such as Visa, MasterCard, and American Express. Payments are processed securely to ensure your information is protected."
  },
  {
    q: "I'm running late for my class. Can I still attend?",
    a: "If you're running late, please contact us as soon as possible. We will do our best to accommodate you, but arriving on time ensures you don't miss important parts of the training."
  },
  {
    q: "Can I take a Recertification course?",
    a: "Yes, we offer Recertification courses for those who need to renew their certification. Please ensure your current certification is still valid before enrolling."
  },
  {
    q: "Are these courses recognized nationwide?",
    a: "Yes, our courses are recognized across Canada and meet national standards for first aid training. This ensures that your certification is valid wherever you go."
  },
  {
    q: "Are all of your classes confirmed?",
    a: "Classes are confirmed once the minimum number of participants is met. You will receive a confirmation email once your class is confirmed."
  },
  {
    q: "How do I book a group training?",
    a: "To book a group training, please contact us directly. We offer flexible options for corporate and group bookings, including on-site training at your location."
  },
  {
    q: "I've completed my training, when will I get my certificate?",
    a: "Certificates are typically issued within 48 hours of completing your training. You will receive an email with a digital copy, and a printed version can be requested if needed."
  },
  {
    q: "Can I bring someone else with me to class?",
    a: "Yes, you can bring someone else with me to class, but they must also register for the course in advance to ensure a spot is reserved for them."
  },
  {
    q: "Should I confirm with my employer or school before registering?",
    a: "Yes. We are happy to suggest a level based on your role, but the final requirement is set by your employer, regulatory college, or school program coordinator. Confirm with them before you register so you take the right course the first time."
  }
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchCourses() {
      try {
        const data = await wixClient.getCourses();
        if (isMounted && data && data.length) {
          setCourses(data);
        } else if (isMounted) {
          setCourses(wixClient.getDefaultCourses());
        }
      } catch (err) {
        if (isMounted) setCourses(wixClient.getDefaultCourses());
      }
    }
    fetchCourses();
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

  const displayedList = courses.length ? courses : wixClient.getDefaultCourses();
  const categories = wixClient.getCategories(displayedList);

  // Group courses by category
  const filteredCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="home" />
      <div style={{ flex: 1 }}>
        {/* Hero Section */}
        <section className="hero">
          <img
            src="https://static.wixstatic.com/media/0ec70773d1ca4891a636a4623e110cc9.jpg"
            alt="First Aid Training"
            className="hero-bg-img"
          />
          <div className="hero-gradient"></div>
          <div className="container">
            <div className="hero-content">
              <div className="pill-badge">
                <span>🛡️</span> Canadian Red Cross Training Partner
              </div>
              <h1 className="hero-title">
                WSIB Approved First Aid Training in <span>Thunder Bay</span>
              </h1>
              <p className="hero-sub">
                As a Canadian Red Cross Training Partner, our first aid courses are WSIB approved in Ontario, so your
                certification meets workplace safety requirements with confidence.
              </p>
              <div className="hero-btns">
                <a href="/courses" className="btn btn-primary btn-lg">Book a Course &rarr;</a>
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
              <p className="section-eyebrow">ABOUT KANOVA LIFE</p>
              <h2 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '20px' }}>
                Canadian Red Cross Training Partner in Thunder Bay
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '24px' }}>
                Kanova Life provides Canadian Red Cross First Aid, CPR/AED and Basic Life Support training across Northern
                Ontario. Whether you need certification for your workplace, school program, or personal confidence, our
                experienced instructors deliver practical, hands-on courses in an engaging and supportive environment.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> WSIB-compliant workplace first aid training
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> Interactive, hands-on classroom practice with manikins &amp; AED trainers
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span> Serving Thunder Bay, Nipigon, Terrace Bay and surrounding areas
                </div>
              </div>
              <a href="/courses" className="btn btn-primary">Browse Upcoming Sessions &rarr;</a>
            </div>
            <div>
              <img
                src="https://static.wixstatic.com/media/2c3d7b_39839bc5388e4600b74859f9a2c7f3a1~mv2.jpg"
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
                          <div key={course.id || title} className="course-card">
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
                                <a href={`/course-detail?course=${linkId}`} className="course-link">
                                  Learn More &rarr;
                                </a>
                              </div>
                            </div>
                          </div>
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

        {/* Course Highlights */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">QUALITY TRAINING</p>
              <h2 className="section-title">Course Highlights</h2>
              <p className="section-desc">Why thousands of Northern Ontario professionals trust our programs.</p>
            </div>
            <div className="highlights-grid home-highlights-grid">
              <div className="highlight-card home-highlight-card">
                <div className="home-highlight-img-wrap">
                  <img src="https://static.wixstatic.com/media/2c3d7b_39839bc5388e4600b74859f9a2c7f3a1~mv2.jpg" alt="Canadian Red Cross Certified" className="home-highlight-img" />
                </div>
                <div className="highlight-body">
                  <h3 className="highlight-title">Canadian Red Cross Certified</h3>
                  <p className="highlight-desc">Earn an Intermediate First Aid certification recognized across Canada by employers and colleges.</p>
                </div>
              </div>
              <div className="highlight-card home-highlight-card">
                <div className="home-highlight-img-wrap">
                  <img src="https://static.wixstatic.com/media/2c3d7b_82a57891a9bf4c1f938f772967e22bbc~mv2.jpg" alt="WSIB-Compliant Training" className="home-highlight-img" />
                </div>
                <div className="highlight-body">
                  <h3 className="highlight-title">WSIB-Compliant Training</h3>
                  <p className="highlight-desc">Meet Ontario workplace health and safety legislative training requirements with confidence.</p>
                </div>
              </div>
              <div className="highlight-card home-highlight-card">
                <div className="home-highlight-img-wrap">
                  <img src="https://static.wixstatic.com/media/2c3d7b_8f2f7652e1834fa7a5174bdcb9aec024~mv2.jpg" alt="Flexible Learning Options" className="home-highlight-img" />
                </div>
                <div className="highlight-body">
                  <h3 className="highlight-title">Flexible Learning Options</h3>
                  <p className="highlight-desc">Choose in-class or blended learning options to fit demanding work and personal schedules.</p>
                </div>
              </div>
              <div className="highlight-card home-highlight-card">
                <div className="home-highlight-img-wrap">
                  <img src="https://static.wixstatic.com/media/2c3d7b_da911de336714a9cb0e32d5b2cec49b3~mv2.jpg" alt="3-Year Certification Validity" className="home-highlight-img" />
                </div>
                <div className="highlight-body">
                  <h3 className="highlight-title">3-Year Certification Validity</h3>
                  <p className="highlight-desc">Intermediate First Aid and CPR Level C certifications remain valid for up to three years.</p>
                </div>
              </div>
              <div className="highlight-card home-highlight-card">
                <div className="home-highlight-img-wrap">
                  <img src="https://static.wixstatic.com/media/2c3d7b_f0327b6872624c5bbb9b7e00a185e1c4~mv2.jpg" alt="Recertification Available" className="home-highlight-img" />
                </div>
                <div className="highlight-body">
                  <h3 className="highlight-title">Recertification Available</h3>
                  <p className="highlight-desc">Keep your certification active with a one-day recertification course at a discounted rate.</p>
                </div>
              </div>
              <div className="highlight-card home-highlight-card">
                <div className="home-highlight-img-wrap">
                  <img src="https://static.wixstatic.com/media/2c3d7b_fa9106025dc2418188e9f01cf93c78c4~mv2.jpg" alt="Experienced Instructors" className="home-highlight-img" />
                </div>
                <div className="highlight-body">
                  <h3 className="highlight-title">Experienced Instructors</h3>
                  <p className="highlight-desc">Learn from certified instructors who keep training interactive, practical, and supportive.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Subscribe */}
        <section className="section newsletter-section">
          <div className="container">
            <div className="newsletter-card">
              <div className="newsletter-content">
                <p className="section-eyebrow" style={{ color: 'var(--primary)' }}>STAY INFORMED &amp; SAVE</p>
                <h2 className="newsletter-title">Subscribe to Our Newsletter</h2>
                <p className="newsletter-desc">
                  Stay up to date with upcoming First Aid &amp; CPR course schedules in Thunder Bay, safety tips, workplace
                  compliance updates, and exclusive discount codes directly to your inbox.
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

        {/* Private Bookings Banner */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="corporate-cta-card">
              <p className="section-eyebrow" style={{ color: '#f87171' }}>PRIVATE &amp; CORPORATE TRAINING</p>
              <h2 className="corporate-cta-title">Custom Group Training for Your Team</h2>
              <p className="corporate-cta-desc">
                We bring Canadian Red Cross certified training directly to your workplace, facility or community center in
                Northern Ontario. Flexible scheduling for groups of all sizes.
              </p>
              <a href="/locations" className="btn btn-primary btn-lg">Inquire for Group Training &rarr;</a>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="section-header">
              <p className="section-eyebrow">COMMON QUESTIONS</p>
              <h2 className="section-title">Frequently Asked Questions</h2>
            </div>
            <div className="faq-list">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className="faq-item">
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
