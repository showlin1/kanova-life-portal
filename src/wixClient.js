// Wix Client for Kanova Life Course Booking Portal
const WIX_CONFIG = {
  clientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WIX_CLIENT_ID) || '0e26fa75-841f-440d-8472-c6cec7ef4ec5',
  siteId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WIX_SITE_ID) || 'e8d91b1e-743d-465b-852d-c4b3a038efcc',
  apiBase: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WIX_API_BASE) || 'https://www.wixapis.com'
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
    const authHeader = (token && token.startsWith('Bearer ')) || token === 'anonymous' ? token : `Bearer ${token}`;
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'wix-site-id': WIX_CONFIG.siteId,
      ...(options.headers || {})
    };
    return fetch(`${WIX_CONFIG.apiBase}${endpoint}`, {
      ...options,
      headers
    });
  }

  resolveImageUrl(img, fallback = '/images/course-1.jpg') {
    if (!img) return fallback;
    if (typeof img === 'string') {
      if (img.startsWith('http://') || img.startsWith('https://')) return img;
      if (img.startsWith('wix:image://v1/')) {
        const parts = img.replace('wix:image://v1/', '').split('/');
        const fileId = parts[0];
        return `https://static.wixstatic.com/media/${fileId}`;
      }
      if (img.startsWith('/')) return img;
    }
    if (typeof img === 'object' && img.url) return img.url;
    return fallback;
  }

  // --- COURSES ---
  async getCourses() {
    try {
      const res = await this.fetchApi('/wix-data/v2/items/query', {
        method: 'POST',
        body: JSON.stringify({
          dataCollectionId: 'Courses',
          query: {
            paging: { limit: 100 }
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.dataItems && data.dataItems.length > 0) {
          return data.dataItems.map(item => {
            const d = item.data || {};
            const rawImg = d.image || d.imageUrl;
            return {
              id: item.id,
              _id: item.id,
              ...d,
              image: d.image,
              imageUrl: this.resolveImageUrl(rawImg, '/images/course-1.jpg')
            };
          });
        }
      }
      return this.getDefaultCourses();
    } catch (e) {
      console.warn('Error fetching courses from Wix CMS, using default catalog:', e);
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
    const defaultCoupons = [
      { id: 'c-kanova15', code: 'KANOVA15', discountType: 'PERCENT', discountValue: 10, active: true, description: '10% off any course booking' },
      { id: 'c-save25', code: 'SAVE25', discountType: 'FIXED', discountValue: 25, minAmount: 100, active: true, description: '$25 off certification courses' }
    ];
    try {
      const res = await this.fetchApi('/wix-data/v2/items/query', {
        method: 'POST',
        body: JSON.stringify({
          dataCollectionId: 'Coupons',
          query: { paging: { limit: 50 } }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (data.dataItems && Array.isArray(data.dataItems) && data.dataItems.length > 0) {
        return data.dataItems.map(item => ({
          id: item.id,
          ...item.data
        }));
      }
      return defaultCoupons;
    } catch (e) {
      console.error('Error fetching coupons:', e);
      return defaultCoupons;
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

  async updateCoupon(id, couponData) {
    const res = await this.fetchApi(`/wix-data/v2/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        dataCollectionId: 'Coupons',
        dataItem: { id, data: couponData }
      })
    });
    return res.json();
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

  // --- WIX PAYMENTS & CHECKOUT ---
  async createWixCheckout(checkoutDetails) {
    const {
      courseId,
      title,
      sessionDate,
      city,
      venue,
      studentName,
      studentEmail,
      studentPhone,
      couponCode
    } = checkoutDetails;

    if (!courseId) {
      throw new Error('Selected course is missing a catalog ID.');
    }

    const noteParts = [
      title ? `Course: ${title}` : '',
      sessionDate ? `Session: ${sessionDate}` : '',
      venue || city ? `Location: ${[venue, city].filter(Boolean).join(', ')}` : '',
      studentName ? `Student: ${studentName}` : ''
    ].filter(Boolean);
    const noteText = noteParts.join(' | ');

    // 1. Create a fresh visitor-owned Cart V2 referencing the CMS Courses catalog item
    const cartRes = await this.fetchApi('/ecom/v2/carts', {
      method: 'POST',
      body: JSON.stringify({
        catalogItems: [
          {
            catalogReference: {
              appId: 'e593b0bd-b783-45b8-97c2-873d42aacaf4',
              catalogItemId: courseId,
              options: {
                collectionId: 'Courses'
              }
            },
            quantity: 1
          }
        ],
        ...(noteText ? { note: noteText } : {})
      })
    });

    const cartData = await cartRes.json().catch(() => ({}));
    if (!cartRes.ok || !cartData?.cart?.id) {
      const errMsg = cartData?.message || cartData?.details?.applicationError?.description || `Failed to create Wix checkout cart (${cartRes.status})`;
      throw new Error(errMsg);
    }

    const cartId = cartData.cart.id;

    // 2. Attach student contact info to prefill Wix Checkout (best-effort, non-blocking)
    try {
      const cleanName = (studentName || '').trim();
      const [firstName, ...restName] = cleanName ? cleanName.split(/\s+/) : [];
      const lastName = restName.join(' ');
      const customerInfo = {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(studentEmail ? { email: studentEmail.trim() } : {}),
        ...(studentPhone ? { phone: studentPhone.trim() } : {})
      };
      if (Object.keys(customerInfo).length > 0 || noteText) {
        await this.fetchApi(`/ecom/v2/carts/${cartId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            cart: {
              ...(Object.keys(customerInfo).length > 0 ? { customerInfo } : {}),
              ...(noteText ? { note: noteText } : {})
            }
          })
        });
      }
    } catch (patchErr) {
      console.warn('Wix Cart customerInfo update warning:', patchErr);
    }

    // 3. Apply coupon code on Wix Cart if it also exists in Wix Marketing Coupons (best-effort)
    if (couponCode && couponCode.trim()) {
      try {
        await this.fetchApi(`/ecom/v2/carts/${cartId}/add-coupon`, {
          method: 'POST',
          body: JSON.stringify({
            coupon: { code: couponCode.trim().toUpperCase() }
          })
        });
      } catch (couponErr) {
        console.warn('Wix Cart coupon sync note:', couponErr);
      }
    }

    // 4. Generate official Wix Headless hosted checkout Redirect Session URL
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin
      : 'https://headless-zoxjvmdldqa-cmsscaleup-140a.wix-site-host.com';

    const redirectRes = await this.fetchApi('/_api/redirects-api/v1/redirect-session', {
      method: 'POST',
      body: JSON.stringify({
        ecomCheckout: { checkoutId: cartId },
        callbacks: {
          postFlowUrl: `${origin}/#/book`,
          thankYouPageUrl: `${origin}/?paymentStatus=success#/book`
        }
      })
    });

    const redirectData = await redirectRes.json().catch(() => ({}));
    const checkoutUrl = redirectData?.redirectSession?.fullUrl;
    if (!redirectRes.ok || !checkoutUrl) {
      const errMsg = redirectData?.message || `Failed to create Wix checkout redirect session (${redirectRes.status})`;
      throw new Error(errMsg);
    }

    return {
      checkoutId: cartId,
      checkoutUrl
    };
  }

  async createPaymentLink(paymentDetails) {
    const res = await this.createWixCheckout(paymentDetails);
    return {
      paymentLink: {
        id: res.checkoutId,
        url: res.checkoutUrl,
        links: { url: { url: res.checkoutUrl } }
      }
    };
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

  // --- BLOGS ---
  async getBlogs() {
    try {
      const res = await this.fetchApi('/wix-data/v2/items/query', {
        method: 'POST',
        body: JSON.stringify({
          dataCollectionId: 'Blogs',
          query: {
            paging: { limit: 50 }
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.dataItems && data.dataItems.length > 0) {
          return data.dataItems.map(item => ({
            id: item.id,
            ...item.data
          }));
        }
      }
      return this.getDefaultBlogs();
    } catch (e) {
      console.warn('Error fetching blogs from Wix CMS, using default list:', e);
      return this.getDefaultBlogs();
    }
  }

  async getBlogBySlug(slugOrId) {
    const blogs = await this.getBlogs();
    if (!blogs || !blogs.length) return null;
    const clean = (slugOrId || '').toLowerCase().trim();
    return blogs.find(b =>
      (b.slug && b.slug.toLowerCase() === clean) ||
      (b.id && b.id.toLowerCase() === clean) ||
      (b.title && b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean)
    ) || blogs[0];
  }

  getDefaultBlogs() {
    return [
      {
        id: "b1",
        title: "What to Expect at Your First Aid & CPR Course",
        slug: "what-to-expect-at-your-first-aid-and-cpr-course",
        category: "Training Tips",
        date: "November 20, 2026",
        author: "Kanova Life Instructors",
        readTime: "5 min read",
        imageUrl: "https://static.wixstatic.com/media/0ec70773d1ca4891a636a4623e110cc9.jpg",
        excerpt: "Never taken a Red Cross course before? Here is how a typical training day runs, from check-in to certification.",
        content: `Arriving for your first Canadian Red Cross First Aid & CPR/AED course can feel a little intimidating if you’ve never participated in emergency skills training before. At Kanova Life, our goal is to create a welcoming, practical, and highly supportive learning environment where you leave feeling confident and fully prepared to save a life.

### 1. Morning Check-In & Welcome
When you arrive at our community training center in Thunder Bay, Nipigon, or Terrace Bay, you'll be greeted by your certified Red Cross instructor. You'll sign in, receive your training workbook and reference materials, and get settled at your training station equipped with sanitized equipment.

### 2. Interactive Theory & Real-World Scenarios
Rather than boring lectures, our training uses multimedia presentations, discussion, and real-world Ontario workplace scenarios. You will explore emergency scene assessment, when and how to call 911, and how to protect yourself with personal protective equipment (PPE).

### 3. Hands-On CPR & AED Practice
Every participant practices directly on feedback-enabled adult, child, and infant manikins. You will master the rhythm and depth of 30 chest compressions and 2 rescue breaths, alongside automated external defibrillator (AED) operation.

### 4. Comprehensive First Aid Skills
In the afternoon, you will practice hands-on bandaging, wound packing, tourniquet application, splinting, and auto-injector (EpiPen) administration for severe allergic reactions.

### 5. Knowledge Verification & Digital Certification
At the end of the day, there is a simple multiple-choice knowledge assessment. Upon successful completion, your official 3-year Canadian Red Cross digital certificate will be issued to your email within 24-48 hours!`
      },
      {
        id: "b2",
        title: "When Should You Recertify Your First Aid?",
        slug: "when-should-you-recertify-your-first-aid",
        category: "Certification",
        date: "November 15, 2026",
        author: "Kanova Life Instructors",
        readTime: "4 min read",
        imageUrl: "https://static.wixstatic.com/media/2c3d7b_39839bc5388e4600b74859f9a2c7f3a1~mv2.jpg",
        excerpt: "Red Cross certifications last three years. Learn when a recert course is the right choice and how to plan ahead.",
        content: `Under Canadian Red Cross and Ontario WSIB guidelines, Standard (Intermediate) First Aid and CPR/AED certifications remain valid for up to 3 years. However, waiting until your certificate has completely expired can cost you extra time and money.

### Why Recertification Matters
Emergency response skills naturally degrade over time if you don't use them regularly. Recertification refreshes your muscle memory, updates you on any new clinical protocols (such as recent ILCOR guideline updates), and keeps you legally compliant in your workplace.

### The 1-Day Recertification Option vs Full Course
If your current Canadian Red Cross Intermediate (Standard) First Aid certificate has NOT expired, you are eligible to take a fast-tracked, 1-day recertification course. This saves you an entire training day and offers a discounted course fee ($130 instead of the full course fee).

### Important Rules for Recertification
- You must hold a valid, unexpired Canadian Red Cross certification on the day of the course.
- You cannot recertify a certificate that has already expired; once expired, WSIB regulations require completing the full course again.
- A recertification certificate cannot be recertified consecutively; your next renewal must be a full course.

### When Should You Book?
We strongly advise booking your recertification training at least 30 to 60 days before your certification's expiry date to ensure you secure an open seat before your workplace credentials lapse.`
      },
      {
        id: "b3",
        title: "5 CPR Steps Everyone Should Know",
        slug: "5-cpr-steps-everyone-should-know",
        category: "Safety",
        date: "November 10, 2026",
        author: "Kanova Life Instructors",
        readTime: "4 min read",
        imageUrl: "https://static.wixstatic.com/media/2c3d7b_82a57891a9bf4c1f938f772967e22bbc~mv2.jpg",
        excerpt: "Acting quickly in a cardiac emergency saves lives. A simple refresher on the essential steps you will master in class.",
        content: `Cardiac arrest can happen anywhere—at home, at work, or in public. When a person's heart stops beating, brain damage can begin in as little as 4 minutes, and survival chances drop by 10% for every minute without CPR. Here are the 5 vital steps taught in Canadian Red Cross courses:

Step 1: Check the Scene & Responsiveness Before rushing in, ensure the scene is safe for you. Tap the victim's shoulders firmly and shout loudly: 'Are you okay?'. Look for normal chest rise and fall for no more than 5 to 10 seconds.

Step 2: Call 911 & Request an AED If the person is unresponsive and not breathing normally, point directly at a specific bystander and say: 'You, call 911 and bring an AED!'. If you are alone, call 911 on speakerphone immediately.

Step 3: Position Your Hands in the Center of the Chest Place the heel of one hand in the center of the person's chest (lower half of the breastbone). Interlock the fingers of your other hand on top. Keep your arms straight and position your shoulders directly over your hands.

Step 4: Push Hard and Fast (100–120 Compressions Per Minute) Compress the chest at least 5 cm (2 inches) deep at a rate of 100 to 120 beats per minute (to the beat of 'Stayin' Alive'). Allow complete chest recoil between each push. If trained in rescue breaths, deliver 30 compressions followed by 2 breaths; if untrained, perform continuous hands-only CPR.

Step 5: Turn On the AED Immediately As soon as the Automated External Defibrillator arrives, turn it on and follow its clear voice prompts. Apply the electrode pads to the person's bare chest as shown on the diagrams, ensure no one is touching the person, and press the shock button if advised by the machine.

Taking an in-person first aid and CPR course gives you the hands-on muscle memory that makes these steps second nature in a real crisis.`
      }
    ];
  }

  getCategories(courses = []) {
    const baseCategories = [
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

    if (!courses || !courses.length) {
      return baseCategories;
    }

    const result = [...baseCategories];
    const existingIds = new Set(baseCategories.map(c => c.id.toLowerCase().trim()));

    courses.forEach(c => {
      let rawCat = (c.category || '').trim();
      let cleanCat = rawCat.replace(/\s*\(\s*coming\s*soon\s*\)/i, '').trim();
      let catId = (c.categoryId || '').trim().toLowerCase();
      if (!catId && cleanCat) {
        catId = 'cat-' + cleanCat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }

      if (catId && !existingIds.has(catId)) {
        result.push({
          id: catId,
          name: cleanCat || rawCat,
          shortName: cleanCat || rawCat,
          note: c.categoryNote || '',
          isComingSoon: !!c.isComingSoon || rawCat.toLowerCase().includes('coming soon')
        });
        existingIds.add(catId);
      }
    });

    return result;
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
        price: 145,
        imageUrl: "/images/course-2.jpg",
        duration: "Blended (Online + 1 Day In-Class)",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Blended",
        isComingSoon: false,
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
        price: 110,
        imageUrl: "/images/course-1.jpg",
        duration: "1 Day (6-8 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "Recertification",
        isComingSoon: false,
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
        price: 165,
        imageUrl: "/images/course-3.jpg",
        duration: "2 Days (14-16 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "2-Day In-Person",
        isComingSoon: false,
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
        price: 105,
        imageUrl: "/images/course-5.jpg",
        duration: "Blended (Online + Half Day In-Class)",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Blended",
        isComingSoon: false,
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
        price: 115,
        imageUrl: "/images/course-4.jpg",
        duration: "1 Day (6.5-8 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "1-Day In-Person",
        isComingSoon: false,
        description: "Practical one-day course covering essential life-saving first aid skills and CPR/AED for workplace compliance."
      },

      // 3. CPR Courses
      {
        id: "c-cpr-blended",
        categoryId: "cat-cpr",
        category: "CPR Courses",
        categoryNote: "",
        title: "CPR/AED Level C (Blended)",
        name: "CPR/AED Level C (Blended)",
        slug: "cpr-aed-level-c-blended",
        price: 75,
        imageUrl: "/images/course-1.jpg",
        duration: "Online Theory + 2 hrs In-Class",
        format: "Blended (Online + In-Class)",
        certification: "3-Year WSIB Recognized",
        badge: "Blended",
        isComingSoon: false,
        description: "CPR and AED Level C covering adult, child, and infant resuscitation skills and choking relief protocols."
      },
      {
        id: "c-cpr-recert",
        categoryId: "cat-cpr",
        category: "CPR Courses",
        categoryNote: "",
        title: "CPR/AED Level C Recertification",
        name: "CPR/AED Level C Recertification",
        slug: "cpr-aed-level-c-recertification",
        price: 60,
        imageUrl: "/images/course-2.jpg",
        duration: "Half Day (4 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB Recognized",
        badge: "Recertification",
        isComingSoon: false,
        description: "Renew your CPR/AED Level C certification with this practical refresher and skills verification session."
      },

      // 4. Basic Life Support (BLS) Courses (coming soon)
      {
        id: "c-bls-hcp",
        categoryId: "cat-bls",
        category: "Basic Life Support (BLS) Courses (coming soon)",
        categoryNote: "Registration opening soon for healthcare professionals",
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
        category: "Basic Life Support (BLS) Courses (coming soon)",
        categoryNote: "Registration opening soon for healthcare professionals",
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
        categoryNote: "",
        title: "Marine Basic First Aid CPR/AED Level C (2-Day)",
        name: "Marine Basic First Aid CPR/AED Level C (2-Day)",
        slug: "marine-basic-first-aid-cpr-aed-level-c-2-day",
        price: 185,
        imageUrl: "/images/course-7.jpg",
        duration: "2 Days (16 hrs)",
        format: "In-Person Maritime",
        certification: "Transport Canada Approved",
        badge: "2-Day Maritime",
        isComingSoon: false,
        description: "Transport Canada-approved first aid training for mariners, boat crews, and commercial fishing vessels."
      },

      // 6. Mask Fit Testing (coming soon)
      {
        id: "c-mask-n95",
        categoryId: "cat-mask",
        category: "Mask Fit Testing (coming soon)",
        categoryNote: "Qualitative N95 & Respirator Fit Testing",
        isComingSoon: true,
        title: "N95 Mask Fit Testing (Qualitative)",
        name: "N95 Mask Fit Testing (Qualitative)",
        slug: "n95-mask-fit-testing-qualitative",
        price: 50,
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
        category: "Mask Fit Testing (coming soon)",
        categoryNote: "Qualitative N95 & Respirator Fit Testing",
        isComingSoon: true,
        title: "Half-Face Respirator Fit Testing (Qualitative)",
        name: "Half-Face Respirator Fit Testing (Qualitative)",
        slug: "half-face-respirator-fit-testing-qualitative",
        price: 60,
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
        category: "Mask Fit Testing (coming soon)",
        categoryNote: "Qualitative N95 & Respirator Fit Testing",
        isComingSoon: true,
        title: "Full-Face Respirator Fit Testing (Qualitative)",
        name: "Full-Face Respirator Fit Testing (Qualitative)",
        slug: "full-face-respirator-fit-testing-qualitative",
        price: 70,
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
        categoryNote: "",
        title: "Standard Child Care First Aid CPR/AED Level B (2-Day In-Person)",
        name: "Standard Child Care First Aid CPR/AED Level B (2-Day In-Person)",
        slug: "standard-child-care-first-aid-cpr-aed-level-b-2-day",
        price: 155,
        imageUrl: "/images/course-6.jpg",
        duration: "2 Days (14-16 hrs)",
        format: "In-Person Classroom",
        certification: "3-Year WSIB & Child Care Recognized",
        badge: "2-Day Child Care",
        isComingSoon: false,
        description: "Specialized Canadian Red Cross first aid training designed for daycare educators, school staff, and childcare providers."
      }
    ];
  }
}

const wixClient = new WixClient();
if (typeof window !== 'undefined') {
  window.wixClient = wixClient;
}
export { wixClient };
export default wixClient;
