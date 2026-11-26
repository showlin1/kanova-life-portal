import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

export default function CourseDetailPage() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCourse() {
      try {
        const hashSearch = window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '';
        const urlParams = new URLSearchParams(window.location.search || hashSearch);
        const id = urlParams.get('course') || urlParams.get('courseId') || urlParams.get('id') || '';
        const list = await wixClient.getCourses();
        const all = (list && list.length) ? list : wixClient.getDefaultCourses();
        const cleanId = (id || '').toLowerCase();
        const found = all.find(c =>
          (c.id && c.id.toLowerCase() === cleanId) ||
          (c.slug && c.slug.toLowerCase() === cleanId) ||
          (c.aliasId && c.aliasId.toLowerCase() === cleanId)
        ) || all[0];
        if (isMounted) setCourse(found);
      } catch (err) {
        const all = wixClient.getDefaultCourses();
        if (isMounted) setCourse(all[0]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCourse();
    return () => { isMounted = false; };
  }, []);

  if (loading || !course) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar activePage="courses" />
        <div className="container" style={{ flex: 1, padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading course details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const title = course.title || course.name;
  const price = Number(course.price) || 0;
  const img = course.imageUrl || '/images/course-1.jpg';
  const badge = course.badge || (course.isComingSoon ? 'Coming Soon' : 'Certified');
  const duration = course.duration || 'Full Day';
  const format = course.format || 'In-Person Classroom';
  const bookingCourseId = course.id || course.slug || 'c-ifa-blended';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="courses" />
      <div style={{ flex: 1 }}>
        {/* Top Detail Hero */}
        <section className="detail-hero">
          <div className="container">
            <div style={{ marginBottom: '20px' }}>
              <a href="/courses" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                &larr; Back to all courses
              </a>
            </div>

            <div className="detail-grid">
              <div className="detail-img-box">
                <img src={img} alt={title} className="detail-img" />
              </div>
              <div>
                <span className="course-badge" style={{ marginBottom: '12px', display: 'inline-block' }}>
                  {badge}
                </span>
                {course.categoryNote && (
                  <div className="category-note" style={{ marginBottom: '14px' }}>
                    <strong>Notice:</strong> {course.categoryNote}
                  </div>
                )}
                <h1 className="detail-title" style={{ fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.25, marginBottom: '16px' }}>
                  {title}
                </h1>

                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Training Locations:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="serving-badge">📍 Thunder Bay</span>
                    <span className="serving-badge">📍 Nipigon</span>
                    <span className="serving-badge">📍 Terrace Bay</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  {course.description || 'Comprehensive Canadian Red Cross First Aid & CPR training meets all Ontario WSIB workplace regulations.'}
                </p>

                <div style={{ display: 'flex', gap: '24px', marginBottom: '28px', fontSize: '0.92rem', color: '#475569', flexWrap: 'wrap' }}>
                  <div>⏱️ <strong>{duration}</strong></div>
                  <div>📋 <strong>{format}</strong></div>
                  <div>🛡️ <strong>WSIB Recognized</strong></div>
                </div>

                <div className="course-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>COURSE FEE</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ${price.toFixed(2)} CAD
                    </div>
                  </div>
                  <a href={`/book?courseId=${bookingCourseId}`} className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}>
                    Book This Course &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Highlights */}
        <section className="section" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div className="section-header" style={{ marginBottom: '40px' }}>
              <p className="section-eyebrow">COURSE HIGHLIGHTS</p>
              <h2 className="section-title">Why Complete This Certification?</h2>
            </div>
            <div className="highlights-grid">
              <div className="highlight-card">
                <img src="https://static.wixstatic.com/media/2c3d7b_82a57891a9bf4c1f938f772967e22bbc~mv2.jpg" alt="" className="highlight-img" />
                <div className="highlight-body">
                  <h3 className="highlight-title">Canadian Red Cross Certified</h3>
                  <p className="highlight-desc">Earn a certified credential accepted across Canada. Gain genuine hands-on confidence to step up during unexpected emergencies.</p>
                </div>
              </div>
              <div className="highlight-card">
                <img src="https://static.wixstatic.com/media/2c3d7b_8f2f7652e1834fa7a5174bdcb9aec024~mv2.jpg" alt="" className="highlight-img" />
                <div className="highlight-body">
                  <h3 className="highlight-title">WSIB Regulation 1101 Compliant</h3>
                  <p className="highlight-desc">Meets mandatory Ontario workplace safety requirements for workplace first aid attendants in commercial and industrial settings.</p>
                </div>
              </div>
              <div className="highlight-card">
                <img src="https://static.wixstatic.com/media/2c3d7b_da911de336714a9cb0e32d5b2cec49b3~mv2.jpg" alt="" className="highlight-img" />
                <div className="highlight-body">
                  <h3 className="highlight-title">Valid For 3 Full Years</h3>
                  <p className="highlight-desc">Digital Red Cross certificate issued directly to your inbox within 24-48 business hours, valid nationwide for 3 full years.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum & Sticky Register Box */}
        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="info-layout">
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '16px' }}>
                  Course Curriculum &amp; Covered Topics
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Participants gain hands-on practice using certified manikins, training AEDs, bandages, and barrier devices:
                </p>
                <ul className="curriculum-list">
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> The Red Cross &amp; Emergency Scene Management
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Adult, Child &amp; Infant CPR and AED Protocols
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Choking Procedures (Conscious &amp; Unconscious)
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Cardiovascular Emergencies (Heart Attack, Stroke, Shock)
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Severe Bleeding, Wound Care &amp; Tourniquet Use
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Bone, Joint &amp; Muscle Injuries / Splinting
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Head, Neck &amp; Spinal Injury Stabilization
                  </li>
                  <li className="curriculum-item">
                    <span className="curriculum-check">✓</span> Sudden Medical Emergencies &amp; Anaphylaxis (EpiPen)
                  </li>
                </ul>
              </div>

              <div>
                <div className="sticky-box">
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>Ready to Certify?</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Select your preferred training date, time and venue in Thunder Bay, Nipigon or Terrace Bay.
                  </p>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
                    ${price.toFixed(2)} CAD
                  </div>
                  <a href={`/book?courseId=${bookingCourseId}`} className="btn btn-primary btn-block">
                    Select Date &amp; Register &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
