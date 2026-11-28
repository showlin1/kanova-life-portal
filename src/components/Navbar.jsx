import React from 'react';

export default function Navbar({ activePage = 'home' }) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <a href="/" className="brand">
          <img src="/images/logo.png" alt="Kanova Life" className="brand-logo" />
        </a>
        <ul className="nav-menu">
          <li>
            <a href="/" className={`nav-link ${activePage === 'home' ? 'active' : ''}`}>
              Home
            </a>
          </li>
          <li>
            <a href="/courses" className={`nav-link ${activePage === 'courses' ? 'active' : ''}`}>
              Course
            </a>
          </li>
          <li>
            <a href="/locations" className={`nav-link ${activePage === 'locations' ? 'active' : ''}`}>
              Locations
            </a>
          </li>
          <li>
            <a href="/blog" className={`nav-link ${activePage === 'blog' ? 'active' : ''}`}>
              Blog
            </a>
          </li>
        </ul>
        <div className="nav-actions">
          <a href="/courses" className="btn btn-primary">
            Book a Course &rarr;
          </a>
        </div>
      </div>
    </header>
  );
}
