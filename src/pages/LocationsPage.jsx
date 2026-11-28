import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [pageContent, setPageContent] = useState(() => wixClient.getDefaultPageContent('locations'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [locData, contentData] = await Promise.all([
          wixClient.getLocations(),
          wixClient.getPageContent('locations')
        ]);
        if (isMounted) {
          if (locData && locData.length) {
            setLocations(locData);
          } else {
            setLocations(wixClient.getDefaultLocations());
          }
          if (contentData) {
            setPageContent(contentData);
          }
        }
      } catch (err) {
        console.warn('Error loading locations page CMS data:', err);
        if (isMounted) {
          setLocations(wixClient.getDefaultLocations());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const activeLocations = locations.length ? locations : wixClient.getDefaultLocations();
  const grouped = wixClient.getGroupedLocations(activeLocations);
  const heroContent = pageContent?.hero || wixClient.getDefaultPageContent('locations').hero;

  const cityDescriptions = {
    'Thunder Bay': 'Main headquarters and primary regular training location.',
    'Nipigon': 'Serving the Township of Nipigon and Red Rock communities.',
    'Terrace Bay': 'Serving North Shore businesses and residents.'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="locations" />
      <div style={{ flex: 1 }}>
        <section className="hero" style={{ padding: '70px 0 80px' }}>
          <div className="container">
            <h1 className="hero-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
              {heroContent.title || 'Our Training Locations'}
            </h1>
            <p className="hero-sub" style={{ marginBottom: 0 }}>
              {heroContent.subtitle || 'Comfortable, accessible community training centers across Northern Ontario.'}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {Object.keys(grouped).map(city => {
              const venues = grouped[city];
              const desc = venues[0]?.description || cityDescriptions[city] || `Training facilities serving ${city} and surrounding areas.`;
              return (
                <div key={city} className="booking-card">
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
                    {city}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    {desc}
                  </p>
                  <div className="venue-grid">
                    {venues.map(v => (
                      <div key={v.id || v.venue} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{v.venue}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{v.address}</div>
                        {v.description && v.description !== desc && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>{v.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <a href="/courses" className="btn btn-primary">
                      View {city} Course Schedule &rarr;
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
