import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

export default function BlogDetailPage() {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPost() {
      try {
        const hashSearch = window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '';
        const urlParams = new URLSearchParams(window.location.search || hashSearch);
        const id = urlParams.get('slug') || urlParams.get('id') || '';
        const post = await wixClient.getBlogBySlug(id);
        if (isMounted) setBlog(post);
      } catch (e) {
        const def = wixClient.getDefaultBlogs();
        if (isMounted) setBlog(def[0]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPost();
    return () => { isMounted = false; };
  }, []);

  if (loading || !blog) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar activePage="blog" />
        <div className="container" style={{ flex: 1, padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading blog article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const img = blog.imageUrl || 'https://static.wixstatic.com/media/0ec70773d1ca4891a636a4623e110cc9.jpg';
  const paragraphs = (blog.content || '').split('\n\n');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="blog" />
      <div style={{ flex: 1 }}>
        <section className="article-hero">
          <div className="container">
            <div className="article-breadcrumbs">
              <a href="/">Home</a>
              <span>/</span>
              <a href="/blog">Blog</a>
              <span>/</span>
              <span>{blog.title}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className="course-badge">{blog.category || 'First Aid Insights'}</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{blog.date}</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>&middot; {blog.readTime || '4 min read'}</span>
            </div>

            <h1 className="article-title" style={{ fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.25, maxWidth: '860px', marginBottom: '20px' }}>
              {blog.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--secondary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                KL
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{blog.author || 'Kanova Life Instructors'}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Canadian Red Cross Certified Instructors</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ background: '#fff' }}>
          <div className="container">
            <div className="article-layout">
              <main>
                <div className="article-image-box" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                  <img src={img} alt={blog.title} className="article-image" style={{ width: '100%', maxWidth: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div className="article-body">
                  {paragraphs.map((p, idx) => {
                    if (p.startsWith('### ')) {
                      return <h3 key={idx}>{p.replace('### ', '')}</h3>;
                    }
                    if (p.startsWith('## ')) {
                      return <h2 key={idx}>{p.replace('## ', '')}</h2>;
                    }
                    return <p key={idx}>{p}</p>;
                  })}
                </div>

                <div className="author-box" style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', marginTop: '48px', padding: '24px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>About Kanova Life Instructors</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Our instructors are fully certified Canadian Red Cross training partners with decades of emergency medical and workplace safety training experience across Northwestern Ontario.
                  </p>
                </div>
              </main>

              <aside>
                <div className="sticky-sidebar-box" style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>Get Certified Today</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Register for WSIB-approved Red Cross First Aid &amp; CPR courses in Thunder Bay, Nipigon, and Terrace Bay.
                  </p>
                  <a href="/courses" className="btn btn-primary btn-block">
                    View Upcoming Courses &rarr;
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
