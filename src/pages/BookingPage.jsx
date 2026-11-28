import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import wixClient from '../wixClient';

const CITIES = {
  'Thunder Bay': [
    'Current River Community Centre',
    'Vickers Heights Community Centre',
    'West Thunder Community Centre',
    'North End Community Centre'
  ],
  'Nipigon': [
    'Nipigon Community Centre'
  ],
  'Terrace Bay': [
    'Terrace Bay Community Centre'
  ]
};

const SESSIONS = [
  { id: 's1', date: 'Saturday, Dec 5, 2026', time: '9:00 AM – 5:00 PM (Full Day)', seats: '8 seats left' },
  { id: 's2', date: 'Saturday, Dec 12, 2026', time: '9:00 AM – 5:00 PM (Full Day)', seats: '5 seats left' },
  { id: 's3', date: 'Saturday, Dec 19, 2026', time: '9:00 AM – 5:00 PM (Full Day)', seats: '11 seats left' },
  { id: 's4', date: 'Saturday, Jan 9, 2027', time: '9:00 AM – 5:00 PM (Full Day)', seats: '14 seats left' }
];

export default function BookingPage() {
  const hashSearch = window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '';
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(hashSearch);
  const queryCourseId = searchParams.get('courseId') || searchParams.get('course') || hashParams.get('courseId') || hashParams.get('course') || '';
  const paymentReturnStatus = searchParams.get('paymentStatus') || hashParams.get('paymentStatus');

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [city, setCity] = useState('Thunder Bay');
  const [venue, setVenue] = useState(CITIES['Thunder Bay'][0]);
  const [selectedSession, setSelectedSession] = useState(SESSIONS[0]);

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState(null); // { valid, message, discount, finalPrice }
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Form
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(() => {
    if (paymentReturnStatus === 'success') {
      try {
        const saved = JSON.parse(sessionStorage.getItem('wix_last_checkout_booking') || 'null');
        if (saved) return { ...saved, paid: true };
      } catch {}
      return {
        title: 'First Aid & CPR Training Course',
        date: SESSIONS[0].date,
        venue: CITIES['Thunder Bay'][0],
        city: 'Thunder Bay',
        name: 'Student',
        total: 0,
        paymentMethod: 'wix',
        paid: true
      };
    }
    return null;
  });

  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      try {
        const list = await wixClient.getCourses();
        const all = (list && list.length) ? list : wixClient.getDefaultCourses();
        if (isMounted) {
          setCourses(all);
          const cleanId = (queryCourseId || '').toLowerCase();
          const match = all.find(c =>
            (c.id && c.id.toLowerCase() === cleanId) ||
            (c.slug && c.slug.toLowerCase() === cleanId) ||
            (c.aliasId && c.aliasId.toLowerCase() === cleanId)
          ) || all[0];
          setSelectedCourse(match);
        }
      } catch (e) {
        const def = wixClient.getDefaultCourses();
        if (isMounted) {
          setCourses(def);
          setSelectedCourse(def[0]);
        }
      }
    }
    loadCourses();
    return () => { isMounted = false; };
  }, [queryCourseId]);

  const handleCityChange = (newCity) => {
    setCity(newCity);
    setVenue(CITIES[newCity][0]);
  };

  const handleCourseChange = (courseId) => {
    const found = courses.find(c => c.id === courseId || c.slug === courseId || c._id === courseId);
    if (found) {
      setSelectedCourse(found);
      setPromoStatus(null);
      setPromoCode('');
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !selectedCourse) return;
    setIsApplyingPromo(true);
    try {
      const basePrice = Number(selectedCourse.price) || 0;
      const res = await wixClient.validateCoupon(promoCode, basePrice, selectedCourse);
      setPromoStatus(res);
    } catch (err) {
      setPromoStatus({ valid: false, message: 'Error checking coupon' });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const basePrice = Number(selectedCourse.price) || 0;
    const finalFee = promoStatus && promoStatus.valid ? promoStatus.finalPrice : basePrice;
    const appliedCouponCode = promoStatus && promoStatus.valid ? promoCode.trim().toUpperCase() : '';
    const courseTitle = selectedCourse.title || selectedCourse.name;

    let checkoutRes;
    try {
      checkoutRes = await wixClient.createWixCheckout({
        courseId: selectedCourse._id || selectedCourse.id,
        course: selectedCourse,
        title: `${courseTitle} - ${selectedSession.date}`,
        sessionDate: selectedSession.date,
        city,
        venue,
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        studentPhone: studentPhone.trim(),
        couponCode: appliedCouponCode,
        existingCartId: (promoStatus && promoStatus.valid && promoStatus.cartId) ? promoStatus.cartId : undefined
      });
    } catch (payErr) {
      console.error('Wix Checkout creation error:', payErr);
      setSubmitError(payErr?.message || 'Unable to connect to Wix Checkout. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const paymentMethod = 'wix';
    const paymentLinkId = checkoutRes.checkoutId;
    const paymentUrl = checkoutRes.checkoutUrl;
    const paymentStatus = 'Pending Online Payment';

    const bookingPayload = {
      courseId: selectedCourse._id || selectedCourse.id,
      courseTitle,
      studentName: studentName.trim(),
      email: studentEmail.trim(),
      phone: studentPhone.trim(),
      city,
      venue,
      sessionDate: selectedSession.date,
      sessionTime: selectedSession.time,
      price: finalFee,
      basePrice,
      discount: promoStatus && promoStatus.valid ? promoStatus.discount : 0,
      couponCode: appliedCouponCode,
      paymentMethod,
      paymentStatus,
      paymentLinkId,
      paymentUrl,
      status: 'Pending Payment',
      createdAt: new Date().toISOString()
    };

    try {
      await wixClient.createBooking(bookingPayload);
    } catch (err) {
      console.warn('Booking create error', err);
      // Fallback local registration
      try {
        const local = JSON.parse(localStorage.getItem('wix_local_bookings') || '[]');
        local.unshift({ id: 'loc-' + Date.now(), ...bookingPayload });
        localStorage.setItem('wix_local_bookings', JSON.stringify(local));
      } catch (le) { }
    }

    const successSummary = {
      title: courseTitle,
      date: selectedSession.date,
      venue,
      city,
      name: studentName.trim(),
      total: finalFee,
      paymentMethod: 'wix',
      paymentUrl,
      paid: false
    };

    try {
      sessionStorage.setItem('wix_last_checkout_booking', JSON.stringify(successSummary));
    } catch {}

    if (paymentUrl) {
      window.location.assign(paymentUrl);
      return;
    }

    setIsSubmitting(false);
    setSubmitSuccess(successSummary);
  };

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const basePrice = selectedCourse ? Number(selectedCourse.price) || 0 : 0;
  const discountAmount = promoStatus && promoStatus.valid ? promoStatus.discount : 0;
  const totalPrice = promoStatus && promoStatus.valid ? promoStatus.finalPrice : basePrice;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isSubmitting && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}
        >
          <style>{`@keyframes wixPaySpin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '4px solid #e2e8f0',
              borderTopColor: 'var(--primary, #dc2626)',
              borderRadius: '50%',
              animation: 'wixPaySpin 0.8s linear infinite'
            }}
          />
          <div style={{ fontSize: '1.08rem', fontWeight: 700, color: '#0f172a' }}>
            Connecting with Wix Payment...
          </div>
        </div>
      )}
      <Navbar activePage="courses" />
      <div style={{ flex: 1 }}>
        <main className="container booking-page-main">
          <h1 className="section-title" style={{ marginBottom: '8px' }}>Select Location &amp; Date</h1>
          <p className="section-desc" style={{ marginTop: 0, marginBottom: '32px' }}>
            Pick a city, choose a community training location, and view seats left.
          </p>

          {submitSuccess ? (
            <div className="booking-card booking-confirmation-card">
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '12px' }}>
                {submitSuccess.paid ? 'Payment Completed – Registration Confirmed!' : 'Booking Reserved – Redirecting to Wix Checkout'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Thank you, <strong>{submitSuccess.name}</strong>! Your registration for <strong>{submitSuccess.title}</strong> has been saved in Wix CMS.
              </p>
              <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ marginBottom: '8px' }}><strong>Date:</strong> {submitSuccess.date}</div>
                <div style={{ marginBottom: '8px' }}><strong>Location:</strong> {submitSuccess.venue}, {submitSuccess.city}</div>
                {submitSuccess.total > 0 && (
                  <div style={{ marginBottom: '8px' }}><strong>Total Fee:</strong> ${submitSuccess.total.toFixed(2)} CAD</div>
                )}
                <div><strong>Payment Method:</strong> Online via Wix Checkout</div>
              </div>

              {submitSuccess.paymentUrl && !submitSuccess.paid ? (
                <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                    🔒 Official Wix Secure Checkout
                  </div>
                  <p style={{ fontSize: '0.92rem', color: '#15803d', marginBottom: '18px', lineHeight: 1.5 }}>
                    If you are not redirected automatically, click below to pay <strong>${submitSuccess.total.toFixed(2)} CAD</strong> securely on Wix Checkout.
                  </p>
                  <a
                    href={submitSuccess.paymentUrl}
                    onClick={(e) => { e.stopPropagation(); }}
                    className="btn btn-primary btn-lg"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '1.05rem', boxShadow: '0 8px 16px -4px rgba(220, 38, 38, 0.4)' }}
                  >
                    💳 Pay ${submitSuccess.total.toFixed(2)} CAD via Wix Checkout &rarr;
                  </a>
                </div>
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  A confirmation email and Canadian Red Cross training workbook instructions have been sent to your inbox.
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a href="/" className="btn btn-primary">Return Home</a>
                <a href="/courses" className="btn btn-secondary">Browse More Courses</a>
              </div>
            </div>
          ) : (
            <div className="booking-container">
              {/* Left: Step Selection */}
              <div>
                {/* Step 1: City & Venue */}
                <div className="booking-card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Step 1: Choose Your City</h3>
                  <div className="city-selector">
                    {Object.keys(CITIES).map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`city-btn ${city === c ? 'active' : ''}`}
                        onClick={() => handleCityChange(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
                    Select Training Venue:
                  </h4>
                  <div className="venue-list">
                    {CITIES[city].map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`venue-chip ${venue === v ? 'active' : ''}`}
                        onClick={() => setVenue(v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Available Dates */}
                <div className="booking-card">
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>Step 2: Available Training Dates</h3>
                  <div id="sessions-list">
                    {SESSIONS.map(s => {
                      const isSelected = selectedSession.id === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`session-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedSession(s)}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.date}</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{s.time}</div>
                          </div>
                          <span className="seats-badge">{s.seats}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Summary & Registration */}
              <div>
                <div className="booking-card booking-summary-card">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    Booking Summary
                  </h3>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SELECTED COURSE</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '8px' }}>
                      {selectedCourse ? (selectedCourse.title || selectedCourse.name) : 'Loading...'}
                    </div>
                    {courses.length > 0 && (
                      <select
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.88rem', fontFamily: 'inherit' }}
                        value={selectedCourse ? selectedCourse.id : ''}
                        onChange={(e) => handleCourseChange(e.target.value)}
                      >
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.title || c.name} — ${(Number(c.price) || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>LOCATION</div>
                    <div style={{ fontWeight: 700 }}>{venue}, {city}</div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE &amp; TIME</div>
                    <div style={{ fontWeight: 700 }}>{selectedSession.date} · {selectedSession.time}</div>
                  </div>

                  {/* Coupon Code Input */}
                  <div style={{ marginBottom: '16px', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                      Promo / Coupon Code
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. DISCOUNT20"
                        style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', textTransform: 'uppercase' }}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo}
                      >
                        {isApplyingPromo ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                    {promoStatus && (
                      <div style={{ fontSize: '0.82rem', marginTop: '6px', color: promoStatus.valid ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {promoStatus.message}
                      </div>
                    )}
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a', fontWeight: 700 }}>
                      <span>Discount Applied:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ marginBottom: '24px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Total Course Fee:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="(807) 555-0123"
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '6px' }}
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
                        Payment Option *
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '2px solid var(--primary)',
                            background: '#fef2f2',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input
                            type="radio"
                            name="paymentOption"
                            value="wix"
                            checked
                            readOnly
                            style={{ marginTop: '3px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--secondary)' }}>
                                Pay Online via Wix Checkout
                              </span>
                              <span style={{ fontSize: '0.7rem', background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                Official Wix Gateway
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                              Secure payment with Credit / Debit Card (Visa, Mastercard, Amex), Apple Pay, Google Pay, or PayPal
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {submitError && (
                      <div
                        role="alert"
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fca5a5',
                          color: '#b91c1c',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          marginBottom: '14px'
                        }}
                      >
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={isSubmitting}
                      style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
                    >
                      {isSubmitting
                        ? 'Connecting with Wix Payment...'
                        : `Pay $${totalPrice.toFixed(2)} CAD via Wix Checkout`}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
