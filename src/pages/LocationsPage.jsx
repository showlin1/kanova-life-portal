import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LocationsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="locations" />
      <div style={{ flex: 1 }}>
        <section className="hero" style={{ padding: '70px 0 80px' }}>
          <div className="container">
            <h1 className="hero-title" style={{ fontSize: '2.8rem', marginBottom: '16px' }}>
              Our Training Locations
            </h1>
            <p className="hero-sub" style={{ marginBottom: 0 }}>
              Comfortable, accessible community training centers across Northern Ontario.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Thunder Bay */}
            <div className="booking-card">
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
                Thunder Bay
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                Main headquarters and primary regular training location.
              </p>
              <div className="venue-grid">
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Current River Community Centre</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>450 Dewe Avenue, Thunder Bay</div>
                </div>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Vickers Heights Community Centre</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>107 Broadway Avenue, Thunder Bay</div>
                </div>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>West Thunder Community Centre</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>915 Edward St S, Thunder Bay</div>
                </div>
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>North End Community Centre</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>954 Huron Ave, Thunder Bay</div>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <a href="/courses" className="btn btn-primary">
                  View Thunder Bay Course Schedule &rarr;
                </a>
              </div>
            </div>

            {/* Nipigon */}
            <div className="booking-card">
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
                Nipigon
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Serving the Township of Nipigon and Red Rock communities.
              </p>
              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', maxWidth: '400px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Nipigon Community Centre</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>138 Wadsworth Dr, Nipigon, ON</div>
              </div>
              <a href="/courses" className="btn btn-primary">
                View Nipigon Course Schedule &rarr;
              </a>
            </div>

            {/* Terrace Bay */}
            <div className="booking-card">
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
                Terrace Bay
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Serving North Shore businesses and residents.
              </p>
              <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', maxWidth: '400px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Terrace Bay Community Centre</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>1 Selkirk Ave, Terrace Bay, ON</div>
              </div>
              <a href="/courses" className="btn btn-primary">
                View Terrace Bay Course Schedule &rarr;
              </a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
