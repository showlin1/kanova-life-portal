import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

export default function CoursesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await wixClient.getCourses();
        if (isMounted) {
          if (data && data.length) {
            setCourses(data);
          } else {
            setCourses(wixClient.getDefaultCourses());
          }
        }
      } catch (e) {
        if (isMounted) setCourses(wixClient.getDefaultCourses());
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const displayedList = courses.length ? courses : wixClient.getDefaultCourses();
  const categories = wixClient.getCategories(displayedList);
  const filteredCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="courses" />
      <div style={{ flex: 1 }}>
        {/* Hero Banner */}
        <section className="hero" style={{ padding: '70px 0 80px' }}>
          <div className="container">
            <div className="pill-badge">
              <span>🛡️</span> WSIB Approved &amp; Canadian Red Cross Certified
            </div>
            <h1 className="hero-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
              Training Courses &amp; Programs
            </h1>
            <p className="hero-sub" style={{ marginBottom: 0 }}>
              Explore our 7 specialized training categories designed for workplaces, healthcare professionals, childcare providers, and individuals across Northern Ontario.
            </p>
          </div>
        </section>

        {/* Courses List */}
        <section className="section">
          <div className="container">
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

            <div id="categorized-courses-container">
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
                        <h2 className="category-title">
                          <span>{cat.isComingSoon ? '⏳' : '📋'}</span> {cat.name}
                          {cat.isComingSoon && <span className="badge-soon">Coming Soon</span>}
                        </h2>
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
                              <h3 className="course-name">{title}</h3>
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
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
