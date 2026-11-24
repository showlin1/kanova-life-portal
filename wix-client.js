// Wix Client for Kanova Life Course Booking Portal
const WIX_CONFIG = {
  clientId: '0e26fa75-841f-440d-8472-c6cec7ef4ec5',
  siteId: 'e8d91b1e-743d-465b-852d-c4b3a038efcc',
  apiBase: 'https://www.wixapis.com'
};

class WixClient {
  constructor() {
    this.token = null;
  }

  async getToken() {
    const now = Date.now();
    const cached = sessionStorage.getItem('wix_access_token');
    const cachedExp = parseInt(sessionStorage.getItem('wix_token_exp') || '0', 10);
    if (cached && cachedExp > now + 60000) {
      this.token = cached;
      return cached;
    }

    try {
      const res = await fetch(`${WIX_CONFIG.apiBase}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: WIX_CONFIG.clientId,
          grantType: 'anonymous'
        })
      });
      const data = await res.json();
      if (data.access_token) {
        this.token = data.access_token;
        const expiresAt = now + ((data.expires_in || 14400) * 1000);
        sessionStorage.setItem('wix_access_token', this.token);
        sessionStorage.setItem('wix_token_exp', expiresAt.toString());
        return this.token;
      }
      throw new Error('Failed to get Wix token');
    } catch (e) {
      console.warn('Wix OAuth token fetch failed, using fallback', e);
      return this.token || 'anonymous';
    }
  }

  async fetchApi(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Authorization': token,
      'Content-Type': 'application/json',
      'wix-site-id': WIX_CONFIG.siteId,
      ...(options.headers || {})
    };
    return fetch(`${WIX_CONFIG.apiBase}${endpoint}`, {
      ...options,
      headers
    });
  }

  // --- COURSES ---
  async getCourses() {
    try {
      const res = await this.fetchApi('/wix-data/v2/items/query', {
        method: 'POST',
        body: JSON.stringify({
          dataCollectionId: 'Courses',
          query: {
            paging: { limit: 50 }
          }
        })
      });
      const data = await res.json();
      if (data.dataItems && data.dataItems.length > 0) {
        return data.dataItems.map(item => ({
          id: item.id,
          ...item.data
        }));
      }
      return this.getDefaultCourses();
    } catch (e) {
      console.error('Error fetching courses from Wix CMS:', e);
      return this.getDefaultCourses();
    }
  }

  async addCourse(courseData) {
    const res = await this.fetchApi('/wix-data/v2/items', {
      method: 'POST',
      body: JSON.stringify({
        dataCollectionId: 'Courses',
        dataItem: { data: courseData }
      })
    });
    const result = await res.json();
    return result.dataItem;
  }

  async updateCourse(id, courseData) {
    const res = await this.fetchApi(`/wix-data/v2/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        dataCollectionId: 'Courses',
        dataItem: { data: courseData }
      })
    });
    return res.json();
  }

  async deleteCourse(id) {
    const res = await this.fetchApi(`/wix-data/v2/items/${id}?dataCollectionId=Courses`, {
      method: 'DELETE'
    });
    return res.status === 200;
  }

  // --- COUPONS ---
  async getCoupons() {
    try {
      const res = await this.fetchApi('/wix-data/v2/items/query', {
        method: 'POST',
        body: JSON.stringify({
          dataCollectionId: 'Coupons',
          query: { paging: { limit: 50 } }
        })
      });
      const data = await res.json();
      if (data.dataItems) {
        return data.dataItems.map(item => ({
          id: item.id,
          ...item.data
        }));
      }
      return [];
    } catch (e) {
      console.error('Error fetching coupons:', e);
      return [];
    }
  }

  async addCoupon(couponData) {
    const res = await this.fetchApi('/wix-data/v2/items', {
      method: 'POST',
      body: JSON.stringify({
        dataCollectionId: 'Coupons',
        dataItem: { data: couponData }
      })
    });
    return res.json();
  }

  async deleteCoupon(id) {
    const res = await this.fetchApi(`/wix-data/v2/items/${id}?dataCollectionId=Coupons`, {
      method: 'DELETE'
    });
    return res.status === 200;
  }

  async validateCoupon(code, coursePrice) {
    if (!code) return { valid: false, message: 'Please enter a coupon code' };
    const coupons = await this.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code && c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return { valid: false, message: `Invalid coupon code: "${code}"` };
    }
    if (coupon.active === false) {
      return { valid: false, message: 'This coupon is inactive.' };
    }
    if (coupon.minAmount && coursePrice < coupon.minAmount) {
      return { valid: false, message: `Minimum order amount of $${coupon.minAmount} required.` };
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = (coursePrice * (Number(coupon.discountValue) || 0)) / 100;
    } else {
      discount = Number(coupon.discountValue) || 0;
    }

    discount = Math.min(discount, coursePrice);
    const finalPrice = Math.max(0, coursePrice - discount);

    return {
      valid: true,
      coupon,
      discount,
      finalPrice,
      message: `Coupon "${coupon.code}" applied! You saved $${discount.toFixed(2)}.`
    };
  }

  // --- BOOKINGS ---
  async createBooking(bookingData) {
    const res = await this.fetchApi('/wix-data/v2/items', {
      method: 'POST',
      body: JSON.stringify({
        dataCollectionId: 'Bookings',
        dataItem: { data: bookingData }
      })
    });
    return res.json();
  }

  async getBookings() {
    try {
      const res = await this.fetchApi('/wix-data/v2/items/query', {
        method: 'POST',
        body: JSON.stringify({
          dataCollectionId: 'Bookings',
          query: {
            paging: { limit: 100 }
          }
        })
      });
      const data = await res.json();
      if (data.dataItems) {
        return data.dataItems.map(item => ({
          id: item.id,
          ...item.data
        }));
      }
      return [];
    } catch (e) {
      console.error('Error fetching bookings:', e);
      return [];
    }
  }

  getCategories() {
    return [
      {
        id: "cat-intermediate",
        name: "Intermediate First Aid Courses",
        shortName: "Intermediate First Aid",
        note: "Formerly called Standard First Aid, but now officially renamed Intermediate First Aid by the Canadian Red Cross"
      },
      {
        id: "cat-basic",
        name: "Basic First Aid Courses",
        shortName: "Basic First Aid",
        note: "Formerly called Emergency First Aid, but now officially renamed Basic First Aid Courses by Canadian Red Cross"
      },
      {
        id: "cat-cpr",
        name: "CPR Courses",
        shortName: "CPR Courses"
      },
      {
        id: "cat-bls",
        name: "Basic Life Support (BLS) Courses",
        shortName: "Basic Life Support (BLS)",
        isComingSoon: true,
        badge: "Coming Soon",
        note: "Coming Soon — Registration opening soon for healthcare professionals"
      },
      {
        id: "cat-marine",
        name: "Marine First Aid Courses",
        shortName: "Marine First Aid"
      },
      {
        id: "cat-mask",
        name: "Mask Fit Testing",
        shortName: "Mask Fit Testing",
        isComingSoon: true,
        badge: "Coming Soon",
        note: "Coming Soon — Qualitative N95 & Respirator Fit Testing"
      },
      {
        id: "cat-childcare",
        name: "Child Care First Aid",
        shortName: "Child Care First Aid"
      }
    ];
  }

  getDefaultCourses() {
    return [
      // 1. Intermediate First Aid Courses
      {
        id: "c-ifa-blended",
        aliasId: "c2",
        categoryId: "cat-intermediate",
        category: "Intermediate First Aid Courses",
        categoryNote: "Formerly called Standard First Aid, but now officially renamed Intermediate First Aid by the Canadian Red Cross",
        title: "Intermediate First Aid CPR/AED Level C (Blended)",
        name: "Intermediate First Aid CPR/AED Level C (Blended)",
        slug: "intermediate-first-aid-cpr-aed-level-c-blended",
        price: 110,
        imageUrl: "/images/course-2.jpg",
        duration: "Blended (Online + 1 Day In-Class)",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Blended",
        description: "Comprehensive Canadian Red Cross Intermediate First Aid training combining self-paced online theory and hands-on skills."
      },
      {
        id: "c-ifa-recert",
        aliasId: "c1",
        categoryId: "cat-intermediate",
        category: "Intermediate First Aid Courses",
        categoryNote: "Formerly called Standard First Aid, but now officially renamed Intermediate First Aid by the Canadian Red Cross",
        title: "Intermediate First Aid CPR/AED Level C Recertification",
        name: "Intermediate First Aid CPR/AED Level C Recertification",
        slug: "intermediate-first-aid-cpr-aed-level-c-recertification",
        price: 130,
        imageUrl: "/images/course-1.jpg",
        duration: "1 Day (6-8 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "Recertification",
        description: "Canadian Red Cross Intermediate First Aid Recertification course for individuals renewing valid credentials."
      },
      {
        id: "c-ifa-2day",
        aliasId: "c3",
        categoryId: "cat-intermediate",
        category: "Intermediate First Aid Courses",
        categoryNote: "Formerly called Standard First Aid, but now officially renamed Intermediate First Aid by the Canadian Red Cross",
        title: "Intermediate First Aid CPR/AED Level C (2-Day In-Person)",
        name: "Intermediate First Aid CPR/AED Level C (2-Day In-Person)",
        slug: "intermediate-first-aid-cpr-aed-level-c-2-day",
        price: 130,
        imageUrl: "/images/course-3.jpg",
        duration: "2 Days (14-16 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "2-Day In-Person",
        description: "Comprehensive two-day Canadian Red Cross certification covering first aid, CPR/AED protocols, and workplace emergency response."
      },

      // 2. Basic First Aid Courses
      {
        id: "c-bfa-blended",
        aliasId: "c5",
        categoryId: "cat-basic",
        category: "Basic First Aid Courses",
        categoryNote: "Formerly called Emergency First Aid, but now officially renamed Basic First Aid Courses by Canadian Red Cross",
        title: "Basic First Aid CPR/AED Level C (Blended)",
        name: "Basic First Aid CPR/AED Level C (Blended)",
        slug: "basic-first-aid-cpr-aed-level-c-blended",
        price: 130,
        imageUrl: "/images/course-5.jpg",
        duration: "Blended (Online + Half Day In-Class)",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Blended",
        description: "Flexible basic first aid and CPR Level C training with online modules and an in-person practical skills session."
      },
      {
        id: "c-bfa-1day",
        aliasId: "c4",
        categoryId: "cat-basic",
        category: "Basic First Aid Courses",
        categoryNote: "Formerly called Emergency First Aid, but now officially renamed Basic First Aid Courses by Canadian Red Cross",
        title: "Basic First Aid CPR/AED Level C (1-Day In-Person)",
        name: "Basic First Aid CPR/AED Level C (1-Day In-Person)",
        slug: "basic-first-aid-cpr-aed-level-c-1-day",
        price: 130,
        imageUrl: "/images/course-4.jpg",
        duration: "1 Day (6.5-8 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "1-Day In-Person",
        description: "Practical one-day course covering essential life-saving first aid skills and CPR/AED for workplace compliance."
      },

      // 3. CPR Courses
      {
        id: "c-cpr-blended",
        categoryId: "cat-cpr",
        category: "CPR Courses",
        title: "CPR/AED Level C (Blended)",
        name: "CPR/AED Level C (Blended)",
        slug: "cpr-aed-level-c-blended",
        price: 75,
        imageUrl: "/images/course-1.jpg",
        duration: "Online Theory + 2 hrs In-Class",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Blended",
        description: "CPR and AED Level C covering adult, child, and infant resuscitation skills and choking relief protocols."
      },
      {
        id: "c-cpr-recert",
        categoryId: "cat-cpr",
        category: "CPR Courses",
        title: "CPR/AED Level C Recertification",
        name: "CPR/AED Level C Recertification",
        slug: "cpr-aed-level-c-recertification",
        price: 65,
        imageUrl: "/images/course-2.jpg",
        duration: "Half Day (4 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "Recertification",
        description: "Renew your CPR/AED Level C certification with this practical refresher and skills verification session."
      },

      // 4. Basic Life Support (BLS) Courses (coming soon)
      {
        id: "c-bls-hcp",
        categoryId: "cat-bls",
        category: "Basic Life Support (BLS) Courses",
        isComingSoon: true,
        title: "Basic Life Support (CPR-HCP)",
        name: "Basic Life Support (CPR-HCP)",
        slug: "basic-life-support-cpr-hcp",
        price: 85,
        imageUrl: "/images/course-3.jpg",
        duration: "4-5 hrs In-Person",
        format: "Healthcare Professional",
        certification: "1-Year Certification",
        badge: "Coming Soon",
        description: "High-performance resuscitation training designed for healthcare professionals, nurses, paramedics, and first responders."
      },
      {
        id: "c-bls-recert",
        categoryId: "cat-bls",
        category: "Basic Life Support (BLS) Courses",
        isComingSoon: true,
        title: "Basic Life Support (CPR-HCP) Recertification",
        name: "Basic Life Support (CPR-HCP) Recertification",
        slug: "basic-life-support-cpr-hcp-recertification",
        price: 65,
        imageUrl: "/images/course-4.jpg",
        duration: "2-3 hrs In-Person",
        format: "Healthcare Professional",
        certification: "1-Year Recertification",
        badge: "Coming Soon",
        description: "Annual BLS recertification course for practicing medical and healthcare professionals."
      },

      // 5. Marine First Aid Courses
      {
        id: "c-marine-2day",
        aliasId: "c7",
        categoryId: "cat-marine",
        category: "Marine First Aid Courses",
        title: "Marine Basic First Aid CPR/AED Level C (2-Day)",
        name: "Marine Basic First Aid CPR/AED Level C (2-Day)",
        slug: "marine-basic-first-aid-cpr-aed-level-c-2-day",
        price: 130,
        imageUrl: "/images/course-7.jpg",
        duration: "2 Days (16 hrs)",
        format: "In-Person Maritime",
        certification: "Transport Canada Approved",
        badge: "2-Day Maritime",
        description: "Transport Canada-approved first aid training for mariners, boat crews, and commercial fishing vessels."
      },

      // 6. Mask Fit Testing (coming soon)
      {
        id: "c-mask-n95",
        categoryId: "cat-mask",
        category: "Mask Fit Testing",
        isComingSoon: true,
        title: "N95 Mask Fit Testing (Qualitative)",
        name: "N95 Mask Fit Testing (Qualitative)",
        slug: "n95-mask-fit-testing-qualitative",
        price: 40,
        imageUrl: "/images/course-5.jpg",
        duration: "20-30 mins",
        format: "Qualitative Fit Test",
        certification: "CSA Standard Z94.4",
        badge: "Coming Soon",
        description: "Qualitative fit testing using Bitrex or Saccharin to ensure a safe, hermetic seal for N95 particulate respirators."
      },
      {
        id: "c-mask-halfface",
        categoryId: "cat-mask",
        category: "Mask Fit Testing",
        isComingSoon: true,
        title: "Half-Face Respirator Fit Testing (Qualitative)",
        name: "Half-Face Respirator Fit Testing (Qualitative)",
        slug: "half-face-respirator-fit-testing-qualitative",
        price: 50,
        imageUrl: "/images/course-6.jpg",
        duration: "30 mins",
        format: "Qualitative Fit Test",
        certification: "CSA Standard Z94.4",
        badge: "Coming Soon",
        description: "Mandatory workplace safety fit test for half-face elastomeric respirators in industrial and healthcare settings."
      },
      {
        id: "c-mask-fullface",
        categoryId: "cat-mask",
        category: "Mask Fit Testing",
        isComingSoon: true,
        title: "Full-Face Respirator Fit Testing (Qualitative)",
        name: "Full-Face Respirator Fit Testing (Qualitative)",
        slug: "full-face-respirator-fit-testing-qualitative",
        price: 60,
        imageUrl: "/images/course-7.jpg",
        duration: "30-45 mins",
        format: "Qualitative Fit Test",
        certification: "CSA Standard Z94.4",
        badge: "Coming Soon",
        description: "Professional qualitative fit testing for full-facepiece respiratory protection equipment."
      },

      // 7. Child Care First Aid
      {
        id: "c-childcare-2day",
        aliasId: "c6",
        categoryId: "cat-childcare",
        category: "Child Care First Aid",
        title: "Standard Child Care First Aid CPR/AED Level B (2-Day In-Person)",
        name: "Standard Child Care First Aid CPR/AED Level B (2-Day In-Person)",
        slug: "standard-child-care-first-aid-cpr-aed-level-b-2-day",
        price: 130,
        imageUrl: "/images/course-6.jpg",
        duration: "2 Days (14-16 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB & Child Care Recognized",
        badge: "2-Day Child Care",
        description: "Specialized Canadian Red Cross first aid training designed for daycare educators, school staff, and childcare providers."
      }
    ];
  }
}

window.wixClient = new WixClient();
