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

  getDefaultCourses() {
    return [
      {
        id: "0f2be1b5-ece6-4a64-b5b2-8c283d1b6252",
        title: "Standard First Aid & CPR/AED Level C",
        slug: "standard-first-aid-cpr-c",
        price: 165,
        duration: "2 Days (14-16 hrs)",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Most Popular",
        level: "Comprehensive",
        description: "Comprehensive two-day course covering first aid and cardiopulmonary resuscitation (CPR) skills for workplace or personal response."
      },
      {
        id: "754999b2-0d5c-4ef7-a316-43e91c4361fb",
        title: "Emergency First Aid & CPR/AED Level C",
        slug: "emergency-first-aid-cpr-c",
        price: 125,
        duration: "1 Day (6.5-8 hrs)",
        format: "In-Person / Blended",
        certification: "3-Year WSIB Recognized",
        badge: "Essential",
        level: "Basic",
        description: "Simple, practical one-day course covering essential life-saving first aid skills and CPR/AED for common workplace emergencies."
      },
      {
        id: "0d8e8825-4c37-4862-9615-1ea5073d728d",
        title: "Basic Life Support (BLS)",
        slug: "basic-life-support-bls",
        price: 95,
        duration: "4 Hours",
        format: "In-Person Intensive",
        certification: "1-Year Healthcare Provider",
        badge: "Healthcare Pros",
        level: "Professional",
        description: "Designed for healthcare providers and designated first responders. Focuses on high-performance CPR, team dynamics, and rapid assessment."
      },
      {
        id: "05b8af48-99f7-4c59-8a34-a45f22b0347d",
        title: "CPR/AED Level C Recertification",
        slug: "cpr-c-recertification",
        price: 85,
        duration: "4 Hours",
        format: "Fast-Track In-Person",
        certification: "3-Year Renewal",
        badge: "Quick Renewal",
        level: "Intermediate",
        description: "Fast-track refresher for individuals whose current CPR/AED certification is due to expire. Revalidates credentials quickly."
      },
      {
        id: "4ece4887-eb86-4f65-95c0-07b6781d8bcb",
        title: "Marine Basic First Aid",
        slug: "marine-basic-first-aid",
        price: 195,
        duration: "2 Days (16 hrs)",
        format: "Specialized Maritime",
        certification: "Transport Canada Approved",
        badge: "Maritime",
        level: "Specialized",
        description: "Comprehensive training covering first aid and CPR skills required by Transport Canada Marine Safety for crew members and vessel operators."
      }
    ];
  }
}

window.wixClient = new WixClient();
