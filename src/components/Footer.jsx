import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <a href="/" className="brand" style={{ marginBottom: '16px', display: 'inline-block' }}>
            <img src="/images/logo-light.png" alt="Kanova Life" className="brand-logo footer-logo" />
          </a>
          <p style={{ maxWidth: '360px', lineHeight: 1.6, marginBottom: '16px' }}>
            Canadian Red Cross Training Partner based in Thunder Bay, ON. Certified First Aid, CPR/AED and BLS courses for workplaces and individuals.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
            <strong>Location:</strong> 450 Dewe Avenue, Thunder Bay, ON P7A 2G7
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/courses">All Courses</a></li>
            <li><a href="/locations">Training Locations</a></li>
            <li><a href="/blog">First Aid Blog</a></li>
            <li><a href="/admin">Admin Portal</a></li>
          </ul>
        </div>

        <div>
          <h4>Certifications</h4>
          <p style={{ marginBottom: '8px' }}>Standard First Aid (WSIB)</p>
          <p style={{ marginBottom: '8px' }}>Emergency First Aid</p>
          <p style={{ marginBottom: '8px' }}>CPR/AED Level C</p>
          <p>Basic Life Support (BLS)</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 Kanova Life Safety & Training. Canadian Red Cross Training Partner.</p>
      </div>
    </footer>
  );
}
