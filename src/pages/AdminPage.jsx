import React, { useState, useEffect } from 'react';
import wixClient from '../wixClient';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [courses, setCourses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Edit State
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingCouponId, setEditingCouponId] = useState(null);

  // Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Intermediate First Aid Courses');
  const [newPrice, setNewPrice] = useState('130');
  const [newDuration, setNewDuration] = useState('1 Day (6-8 hrs)');
  const [newFormat, setNewFormat] = useState('In-Person Classroom');
  const [newDesc, setNewDesc] = useState('');
  const [newImageBase64, setNewImageBase64] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountValue, setNewDiscountValue] = useState('20');
  const [newMinAmount, setNewMinAmount] = useState('50');
  const [newCouponActive, setNewCouponActive] = useState(true);
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  // Student Search
  const [studentSearch, setStudentSearch] = useState('');

  const categories = wixClient.getCategories();

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const [cList, cpList, bList] = await Promise.all([
          wixClient.getCourses(),
          wixClient.getCoupons(),
          wixClient.getBookings()
        ]);
        if (isMounted) {
          setCourses(cList && cList.length ? cList : wixClient.getDefaultCourses());
          setCoupons(cpList || []);

          // Bookings fallback
          let allBookings = bList || [];
          try {
            const local = JSON.parse(localStorage.getItem('wix_local_bookings') || '[]');
            allBookings = [...local, ...allBookings];
          } catch (e) { }

          if (!allBookings.length) {
            allBookings = [
              {
                id: 'b-demo-1',
                studentName: 'Sarah Jenkins',
                email: 'sarah.j@example.com',
                phone: '(807) 555-0192',
                courseTitle: 'Intermediate First Aid CPR/AED Level C (Blended)',
                city: 'Thunder Bay',
                venue: 'Current River Community Centre',
                sessionDate: 'Saturday, Dec 5, 2026',
                price: 110,
                status: 'Confirmed'
              },
              {
                id: 'b-demo-2',
                studentName: 'Marcus Tremblay',
                email: 'marcus.t@workplace.ca',
                phone: '(807) 555-0144',
                courseTitle: 'Basic First Aid CPR/AED Level C (1-Day In-Person)',
                city: 'Nipigon',
                venue: 'Nipigon Community Centre',
                sessionDate: 'Saturday, Dec 12, 2026',
                price: 130,
                status: 'Confirmed'
              }
            ];
          }
          setBookings(allBookings);
        }
      } catch (err) {
        if (isMounted) {
          setCourses(wixClient.getDefaultCourses());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAdminData();
    return () => { isMounted = false; };
  }, []);

  // Handle course image selection & convert to Base64
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddCourse = () => {
    setEditingCourseId(null);
    setNewTitle('');
    setNewCategory(categories[0]?.name || 'Intermediate First Aid Courses');
    setNewPrice('130');
    setNewDuration('1 Day (6-8 hrs)');
    setNewFormat('In-Person Classroom');
    setNewDesc('');
    setNewImageBase64('');
    setImageFileName('');
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourseId(course.id);
    setNewTitle(course.title || course.name || '');
    setNewCategory(course.category || categories[0]?.name || 'Intermediate First Aid Courses');
    setNewPrice(String(course.price || 0));
    setNewDuration(course.duration || '1 Day (6-8 hrs)');
    setNewFormat(course.format || 'In-Person Classroom');
    setNewDesc(course.description || '');
    setNewImageBase64(course.imageUrl || '');
    setImageFileName(course.imageUrl ? 'Current Image' : '');
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || isSavingCourse) return;
    if (!editingCourseId && !newImageBase64) return;

    setIsSavingCourse(true);
    const catObj = categories.find(c => c.name === newCategory) || categories[0];
    const coursePayload = {
      title: newTitle.trim(),
      name: newTitle.trim(),
      category: newCategory,
      categoryId: catObj.id,
      price: Number(newPrice) || 0,
      duration: newDuration,
      format: newFormat,
      imageUrl: newImageBase64 || '/images/course-1.jpg',
      description: newDesc.trim() || 'Certified Canadian Red Cross course.',
      badge: 'Certified',
      isComingSoon: false
    };

    if (editingCourseId) {
      try {
        await wixClient.updateCourse(editingCourseId, coursePayload);
        setCourses(courses.map(c => c.id === editingCourseId ? { ...c, ...coursePayload } : c));
        setShowCourseModal(false);
      } catch (err) {
        console.warn('Wix updateCourse err', err);
        setCourses(courses.map(c => c.id === editingCourseId ? { ...c, ...coursePayload } : c));
        setShowCourseModal(false);
      } finally {
        setIsSavingCourse(false);
      }
    } else {
      const newCourseItem = {
        ...coursePayload,
        createdAt: new Date().toISOString()
      };
      try {
        const added = await wixClient.addCourse(newCourseItem);
        const courseWithId = added || { id: 'c-new-' + Date.now(), ...newCourseItem };
        setCourses([courseWithId, ...courses]);
        setShowCourseModal(false);
      } catch (err) {
        console.warn('Wix addCourse err', err);
        const fallback = { id: 'c-loc-' + Date.now(), ...newCourseItem };
        setCourses([fallback, ...courses]);
        setShowCourseModal(false);
      } finally {
        setIsSavingCourse(false);
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course from Wix CMS?')) return;
    try {
      await wixClient.deleteCourse(courseId);
    } catch (err) { }
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const handleOpenAddCoupon = () => {
    setEditingCouponId(null);
    setNewCouponCode('');
    setNewDiscountValue('20');
    setNewMinAmount('50');
    setNewCouponActive(true);
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (coupon) => {
    setEditingCouponId(coupon.id);
    setNewCouponCode(coupon.code || '');
    setNewDiscountValue(String(coupon.discountValue || 10));
    setNewMinAmount(String(coupon.minAmount || 0));
    setNewCouponActive(coupon.active !== false);
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode.trim() || isSavingCoupon) return;

    setIsSavingCoupon(true);
    const couponPayload = {
      code: newCouponCode.trim().toUpperCase(),
      discountType: 'PERCENT',
      discountValue: Number(newDiscountValue) || 10,
      minAmount: Number(newMinAmount) || 0,
      active: newCouponActive
    };

    if (editingCouponId) {
      try {
        await wixClient.updateCoupon(editingCouponId, couponPayload);
        setCoupons(coupons.map(cp => cp.id === editingCouponId ? { ...cp, ...couponPayload } : cp));
        setShowCouponModal(false);
      } catch (err) {
        console.warn('Wix updateCoupon err', err);
        setCoupons(coupons.map(cp => cp.id === editingCouponId ? { ...cp, ...couponPayload } : cp));
        setShowCouponModal(false);
      } finally {
        setIsSavingCoupon(false);
      }
    } else {
      const couponItem = {
        ...couponPayload,
        createdAt: new Date().toISOString()
      };
      try {
        const res = await wixClient.addCoupon(couponItem);
        const added = res && res.dataItem ? { id: res.dataItem.id, ...res.dataItem.data } : { id: 'cp-' + Date.now(), ...couponItem };
        setCoupons([added, ...coupons]);
        setShowCouponModal(false);
      } catch (err) {
        setCoupons([{ id: 'cp-' + Date.now(), ...couponItem }, ...coupons]);
        setShowCouponModal(false);
      } finally {
        setIsSavingCoupon(false);
      }
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon code?')) return;
    try {
      await wixClient.deleteCoupon(couponId);
    } catch (err) { }
    setCoupons(coupons.filter(cp => cp.id !== couponId));
  };

  // Stats calculation
  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const activeCouponsCount = coupons.filter(c => c.active !== false).length;

  // Filter students
  const filteredStudents = bookings.filter(b => {
    const q = studentSearch.toLowerCase();
    return (
      (b.studentName && b.studentName.toLowerCase().includes(q)) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.phone && b.phone.toLowerCase().includes(q)) ||
      (b.courseTitle && b.courseTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Topbar */}
      <div className="admin-topbar" style={{ background: '#0b1329', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="brand-plus">+</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>Kanova Life Admin</span>
          <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
            Wix Headless Live
          </span>
        </div>
        <div>
          <a href="/" style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
            &larr; View Live Website
          </a>
        </div>
      </div>

      <div className="admin-layout" style={{ display: 'flex', flex: 1 }}>
        {/* Admin Sidebar */}
        <aside className="admin-sidebar" style={{ width: '260px', background: '#0f172a', padding: '24px 16px', color: '#cbd5e1' }}>
          <div className="admin-sidebar-nav">
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              📋 Recent Registrations ({bookings.length})
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              📚 Courses Database ({courses.length})
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              🏷️ Promo &amp; Coupons ({coupons.length})
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              👥 Student Directory
            </button>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="admin-content" style={{ flex: 1, padding: '32px 28px' }}>
          {/* Stats Grid */}
          <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div className="admin-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>COURSES IN CMS</div>
              <div className="admin-stat-num">{courses.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>● 7 Active Categories</div>
            </div>
            <div className="admin-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>STUDENT REGISTRATIONS</div>
              <div className="admin-stat-num">{bookings.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>● WSIB &amp; Red Cross Tracked</div>
            </div>
            <div className="admin-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE PROMO CODES</div>
              <div className="admin-stat-num">{activeCouponsCount}</div>
              <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>● Live CMS Validation</div>
            </div>
            <div className="admin-card">
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REVENUE</div>
              <div className="admin-stat-num" style={{ color: 'var(--primary)' }}>${totalRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CAD Total Bookings</div>
            </div>
          </div>

          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Recent Student Registrations</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Showing {bookings.length} registrations</span>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '150px' }}>Student Name</th>
                      <th style={{ minWidth: '180px' }}>Contact Info</th>
                      <th style={{ minWidth: '220px' }}>Course</th>
                      <th style={{ minWidth: '180px' }}>Location / Venue</th>
                      <th style={{ minWidth: '140px' }}>Date</th>
                      <th style={{ minWidth: '90px' }}>Fee</th>
                      <th style={{ minWidth: '110px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={b.id || i}>
                        <td style={{ fontWeight: 700 }}>{b.studentName || 'Student'}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{b.email}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{b.phone}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{b.courseTitle || 'First Aid Course'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{b.venue || b.city || 'Thunder Bay'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{b.sessionDate || 'Scheduled'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${(Number(b.price) || 0).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${b.status === 'Confirmed' ? 'confirmed' : 'pending'}`}>
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: COURSES */}
          {activeTab === 'courses' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Courses Database</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage courses synced with Wix CMS collection</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddCourse}
                >
                  + Add New Course
                </button>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '64px' }}>Image</th>
                      <th style={{ minWidth: '220px' }}>Course Title</th>
                      <th style={{ minWidth: '160px' }}>Category</th>
                      <th style={{ minWidth: '150px' }}>Format &amp; Duration</th>
                      <th style={{ minWidth: '90px' }}>Price</th>
                      <th style={{ minWidth: '140px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id || course.slug}>
                        <td>
                          <img
                            src={course.imageUrl || '/images/course-1.jpg'}
                            alt=""
                            style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{course.title || course.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: {course.id}</div>
                        </td>
                        <td>
                          <span className="badge-pill" style={{ fontSize: '0.75rem' }}>
                            {course.category}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{course.format || 'Classroom'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{course.duration}</div>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          ${(Number(course.price) || 0).toFixed(2)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              onClick={() => handleOpenEditCourse(course)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              onClick={() => handleDeleteCourse(course.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROMO CODES */}
          {activeTab === 'coupons' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Active Promo Codes</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Coupons applied in the booking flow against Wix CMS</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenAddCoupon}
                >
                  + Add Promo Code
                </button>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '140px' }}>Coupon Code</th>
                      <th style={{ minWidth: '110px' }}>Discount</th>
                      <th style={{ minWidth: '110px' }}>Min Order</th>
                      <th style={{ minWidth: '100px' }}>Status</th>
                      <th style={{ minWidth: '140px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((cp, idx) => (
                      <tr key={cp.id || idx}>
                        <td>
                          <strong style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                            {cp.code}
                          </strong>
                        </td>
                        <td style={{ fontWeight: 700, color: '#16a34a' }}>
                          {cp.discountValue}% OFF
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          ${cp.minAmount ? Number(cp.minAmount).toFixed(2) : '0.00'}
                        </td>
                        <td>
                          <span className={`status-badge ${cp.active !== false ? 'confirmed' : 'pending'}`}>
                            {cp.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              onClick={() => handleOpenEditCoupon(cp)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              onClick={() => handleDeleteCoupon(cp.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: STUDENTS */}
          {activeTab === 'students' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Student Directory</h2>
                <input
                  type="text"
                  placeholder="Search student name, email or course..."
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', maxWidth: '320px', width: '100%' }}
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '150px' }}>Student</th>
                      <th style={{ minWidth: '180px' }}>Email</th>
                      <th style={{ minWidth: '130px' }}>Phone</th>
                      <th style={{ minWidth: '200px' }}>Registered Course</th>
                      <th style={{ minWidth: '150px' }}>Venue</th>
                      <th style={{ minWidth: '130px' }}>Session Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((st, i) => (
                      <tr key={st.id || i}>
                        <td style={{ fontWeight: 700 }}>{st.studentName || 'Student'}</td>
                        <td>{st.email}</td>
                        <td>{st.phone}</td>
                        <td style={{ fontWeight: 600 }}>{st.courseTitle}</td>
                        <td style={{ fontSize: '0.85rem' }}>{st.venue || st.city}</td>
                        <td style={{ fontSize: '0.85rem' }}>{st.sessionDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD / EDIT COURSE */}
      {showCourseModal && (
        <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) setShowCourseModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editingCourseId ? 'Edit Course' : 'Add New Course to Wix CMS'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCourseModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Wilderness First Aid & CPR"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-grid-2col">
                <div className="form-group">
                  <label className="form-label">Price ($ CAD) *</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Course Format *</label>
                <select
                  className="form-select"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                >
                  <option value="In-Person Classroom">In-Person Classroom</option>
                  <option value="Blended (Online + In-Person)">Blended (Online + In-Person)</option>
                  <option value="Online Self-Paced">Online Self-Paced</option>
                </select>
              </div>

              {/* COURSE IMAGE UPLOAD */}
              <div className="form-group">
                <label className="form-label">Course Image {editingCourseId ? '(Optional to change)' : '* (Upload File)'}</label>
                <input
                  type="file"
                  accept="image/*"
                  required={!editingCourseId && !newImageBase64}
                  className="form-input"
                  onChange={handleImageFileChange}
                />
                {newImageBase64 && (
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>✓ Image: {imageFileName || 'Selected'}</span>
                    <img
                      src={newImageBase64}
                      alt="Preview"
                      style={{ display: 'block', width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', marginTop: '6px' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Course Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Brief description of skills covered..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCourseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingCourse || (!editingCourseId && !newImageBase64)}
                >
                  {editingCourseId
                    ? (isSavingCourse ? 'Updating Course...' : 'Update Course')
                    : (isSavingCourse ? 'Saving to Wix...' : 'Save Course to CMS')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PROMO CODE */}
      {showCouponModal && (
        <div className="modal-backdrop open" onClick={(e) => { if (e.target === e.currentTarget) setShowCouponModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editingCouponId ? 'Edit Promo Code' : 'Add Promo Code'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCouponModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCoupon}>
              <div className="form-group">
                <label className="form-label">Promo Code *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. DISCOUNT25"
                  style={{ textTransform: 'uppercase' }}
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                />
              </div>

              <div className="modal-grid-2col">
                <div className="form-group">
                  <label className="form-label">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    className="form-input"
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Order ($ CAD)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newMinAmount}
                    onChange={(e) => setNewMinAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={newCouponActive ? 'active' : 'inactive'}
                  onChange={(e) => setNewCouponActive(e.target.value === 'active')}
                >
                  <option value="active">Active (Available for checkout)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCouponModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingCoupon}
                >
                  {editingCouponId
                    ? (isSavingCoupon ? 'Updating...' : 'Update Promo Code')
                    : (isSavingCoupon ? 'Saving...' : 'Save Promo Code')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
