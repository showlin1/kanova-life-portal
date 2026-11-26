import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadBlogs() {
      try {
        const data = await wixClient.getBlogs();
        if (isMounted) {
          if (data && data.length) {
            setBlogs(data);
          } else {
            setBlogs(wixClient.getDefaultBlogs());
          }
        }
      } catch (err) {
        if (isMounted) setBlogs(wixClient.getDefaultBlogs());
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBlogs();
    return () => { isMounted = false; };
  }, []);

  const list = blogs.length ? blogs : wixClient.getDefaultBlogs();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="blog" />
      <div style={{ flex: 1 }}>
        <section className="hero" style={{ padding: '70px 0 80px' }}>
          <div className="container">
            <h1 className="hero-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
              First Aid &amp; Safety Insights
            </h1>
            <p className="hero-sub" style={{ marginBottom: 0 }}>
              Practical guides and training updates from Canadian Red Cross certified instructors.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="highlights-grid" id="blogs-grid">
              {list.map(post => {
                const linkTarget = post.slug || post.id;
                const img = post.imageUrl || 'https://static.wixstatic.com/media/0ec70773d1ca4891a636a4623e110cc9.jpg';
                return (
                  <article key={post.id || post.slug} className="highlight-card">
                    <a href={`/blog-detail?slug=${linkTarget}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <img src={img} alt={post.title} className="highlight-img" loading="lazy" />
                    </a>
                    <div className="highlight-body">
                      <span className="course-badge">{post.category || 'Training Tips'}</span>
                      <h3 className="highlight-title">
                        <a href={`/blog-detail?slug=${linkTarget}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {post.title}
                        </a>
                      </h3>
                      <p className="highlight-desc">{post.excerpt}</p>
                      <div style={{ marginTop: '14px' }}>
                        <a
                          href={`/blog-detail?slug=${linkTarget}`}
                          style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Read Article &rarr;
                        </a>
                      </div>
                    </div>
                  </article>
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
