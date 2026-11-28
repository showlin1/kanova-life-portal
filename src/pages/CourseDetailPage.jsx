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
  const img = wixClient.resolveImageUrl(course.image || course.imageUrl, '/images/course-1.jpg');
  const badge = course.badge || (course.isComingSoon ? 'Coming Soon' : 'Certified');
  const duration = course.duration || 'Full Day';
  const format = course.format || 'In-Person Classroom';
  const certification = course.certification || 'WSIB Recognized';
  const bookingCourseId = course.id || course.slug || 'c-ifa-blended';

  const locationsList = (course.locations && typeof course.locations === 'string')
    ? course.locations.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : ['Thunder Bay', 'Nipigon', 'Terrace Bay'];

  const curriculumList = (course.curriculum && typeof course.curriculum === 'string')
    ? course.curriculum.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    : (Array.isArray(course.curriculum) && course.curriculum.length ? course.curriculum : [
        'The Red Cross & Emergency Scene Management',
        'Adult, Child & Infant CPR and AED Protocols',
        'Choking Procedures (Conscious & Unconscious)',
        'Cardiovascular Emergencies (Heart Attack, Stroke, Shock)',
        'Severe Bleeding, Wound Care & Tourniquet Use',
        'Bone, Joint & Muscle Injuries / Splinting',
        'Head, Neck & Spinal Injury Stabilization',
        'Sudden Medical Emergencies & Anaphylaxis (EpiPen)'
      ]);

  const highlightsList = (() => {
    if (course.highlights && typeof course.highlights === 'string') {
      const lines = course.highlights.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (lines.length > 0) {
        const defaultImgs = [
          'https://static.wixstatic.com/media/2c3d7b_82a57891a9bf4c1f938f772967e22bbc~mv2.jpg',
          'https://static.wixstatic.com/media/2c3d7b_8f2f7652e1834fa7a5174bdcb9aec024~mv2.jpg',
          'https://static.wixstatic.com/media/2c3d7b_da911de336714a9cb0e32d5b2cec49b3~mv2.jpg'
        ];
        return lines.map((l, i) => {
          const parts = l.split('|');
          return {
            title: parts[0]?.trim() || `Course Highlight ${i + 1}`,
            desc: parts[1]?.trim() || parts[0]?.trim(),
            img: defaultImgs[i % defaultImgs.length]
          };
        });
      }
    }
    return [
      {
        title: 'Canadian Red Cross Certified',
        desc: 'Earn a certified credential accepted across Canada. Gain genuine hands-on confidence to step up during unexpected emergencies.',
        img: 'https://static.wixstatic.com/media/2c3d7b_82a57891a9bf4c1f938f772967e22bbc~mv2.jpg'
      },
      {
        title: 'WSIB Regulation 1101 Compliant',
        desc: 'Meets mandatory Ontario workplace safety requirements for workplace first aid attendants in commercial and industrial settings.',
        img: 'https://static.wixstatic.com/media/2c3d7b_8f2f7652e1834fa7a5174bdcb9aec024~mv2.jpg'
      },
      {
        title: 'Valid For 3 Full Years',
        desc: 'Digital Red Cross certificate issued directly to your inbox within 24-48 business hours, valid nationwide for 3 full years.',
        img: 'https://static.wixstatic.com/media/2c3d7b_da911de336714a9cb0e32d5b2cec49b3~mv2.jpg'
      }
    ];
  })();

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
                <h1 className="detail-title" style={{ fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.25, marginBottom: '16px' }}>
                  {title}
                </h1>

                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                    Training Locations:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {locationsList.map((loc, i) => (
                      <span key={i} className="serving-badge">📍 {loc}</span>
                    ))}
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  {course.description || 'Comprehensive Canadian Red Cross First Aid & CPR training meets all Ontario WSIB workplace regulations.'}
                </p>

                <div className="detail-meta" style={{ display: 'flex', gap: '12px 24px', marginBottom: '28px', fontSize: '0.92rem', color: '#475569', flexWrap: 'wrap' }}>
                  <div>⏱️ <strong>{duration}</strong></div>
                  <div>📋 <strong>{format}</strong></div>
                  <div>🛡️ <strong>{certification}</strong></div>
                </div>

                <div className="course-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>COURSE FEE</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ${price.toFixed(2)} CAD
                    </div>
                  </div>
                  <a href={`/book?courseId=${bookingCourseId}`} className="btn btn-primary btn-lg" style={{ flex: 1, minWidth: 'min(100%, 200px)', textAlign: 'center' }}>
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
            <div className="highlights-grid detail-highlights-grid">
              {highlightsList.map((h, i) => (
                <div key={i} className="highlight-card detail-highlight-card">
                  {h.img && (
                    <div className="detail-highlight-img-wrap">
                      <img src={h.img} alt={h.title} className="detail-highlight-img" />
                    </div>
                  )}
                  <div className="highlight-body">
                    <h3 className="highlight-title">{h.title}</h3>
                    <p className="highlight-desc">{h.desc}</p>
                  </div>
                </div>
              ))}
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
                  {curriculumList.map((topic, i) => (
                    <li key={i} className="curriculum-item">
                      <span className="curriculum-check">✓</span> {topic}
                    </li>
                  ))}
                </ul>

                {course.prerequisites && (
                  <div style={{ marginTop: '28px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '6px' }}>
                      📋 Prerequisites
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                      {course.prerequisites}
                    </p>
                  </div>
                )}
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
