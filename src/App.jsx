import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import BookingPage from './pages/BookingPage';
import LocationsPage from './pages/LocationsPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import AdminPage from './pages/AdminPage';
import './styles.css';

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].replace(/\.html$/, '').toLowerCase();
  const pathname = window.location.pathname.replace(/^\/|\/$/g, '').replace(/\.html$/, '').toLowerCase();
  const r = hash || pathname || '';

  if (!r || r === 'home' || r === 'index') return 'home';
  if (r.startsWith('courses')) return 'courses';
  if (r.startsWith('course-detail')) return 'course-detail';
  if (r.startsWith('book')) return 'book';
  if (r.startsWith('locations')) return 'locations';
  if (r.startsWith('blog-detail')) return 'blog-detail';
  if (r.startsWith('blog')) return 'blog';
  if (r.startsWith('admin')) return 'admin';
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    // If opened directly as /book or /course-detail, sync URL to hash format
    const initialPath = window.location.pathname.replace(/^\/|\/$/g, '').replace(/\.html$/, '');
    if (initialPath && initialPath !== 'index' && !window.location.hash) {
      const search = window.location.search || '';
      const target = `#/${initialPath}${search}`;
      window.history.replaceState({}, '', target);
    }

    const handlePop = () => {
      setRoute(parseRoute());
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePop);
    window.addEventListener('hashchange', handlePop);

    const handleClick = (e) => {
      const a = e.target.closest('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      try {
        const url = new URL(a.href, window.location.origin);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          let target = '';
          if (a.getAttribute('href')?.startsWith('#')) {
            target = a.getAttribute('href');
          } else {
            const cleanPath = url.pathname.replace(/^\/|\/$/g, '').replace(/\.html$/, '');
            const search = url.search || '';
            if (cleanPath && cleanPath !== 'home' && cleanPath !== 'index') {
              target = `#/${cleanPath}${search}`;
            } else {
              target = search ? `#/${search}` : '#/';
            }
          }
          if (window.location.hash !== target) {
            window.location.hash = target.startsWith('#') ? target.substring(1) : target;
          }
          setRoute(parseRoute());
          window.scrollTo(0, 0);
        }
      } catch (err) {}
    };

    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('hashchange', handlePop);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const renderRoute = () => {
    switch (route) {
      case 'courses':
        return <CoursesPage />;
      case 'course-detail':
        return <CourseDetailPage />;
      case 'book':
        return <BookingPage />;
      case 'locations':
        return <LocationsPage />;
      case 'blog':
        return <BlogPage />;
      case 'blog-detail':
        return <BlogDetailPage />;
      case 'admin':
        return <AdminPage />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return renderRoute();
}
