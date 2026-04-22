(() => {
  const nav = document.getElementById('mainNav');
  const navLinks = document.querySelector('.nav-links');
  const menuButton = document.querySelector('.hamburger');
  const inquiryForm = document.getElementById('inquiryForm');
  const submitButton = inquiryForm ? inquiryForm.querySelector('.form-submit') : null;
  const roomTypeField = document.getElementById('roomtype');
  const checkInField = document.getElementById('checkin');
  const checkOutField = document.getElementById('checkout');

  const dotsContainer = document.getElementById('heroDots');
  if (dotsContainer) {
    for (let i = 0; i < 18; i += 1) {
      const dot = document.createElement('span');
      const size = Math.random() * 6 + 2;
      dot.style.cssText = `
        width:${size}px; height:${size}px;
        top:${Math.random() * 90}%; left:${Math.random() * 100}%;
        animation-duration:${4 + Math.random() * 6}s;
        animation-delay:${Math.random() * 4}s;
      `;
      dotsContainer.appendChild(dot);
    }
  }

  function scrollToContact() {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  }

  function selectRoom(roomLabel) {
    if (roomTypeField) {
      roomTypeField.value = roomLabel;
    }
    scrollToContact();
    if (roomTypeField) {
      roomTypeField.focus({ preventScroll: true });
    }
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!submitButton || !roomTypeField || !checkInField || !checkOutField) {
      return;
    }

    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const checkin = checkInField.value;
    const checkout = checkOutField.value;
    const roomtype = roomTypeField.value;
    const msg = document.getElementById('msg').value.trim();

    if (!fname || !email || !roomtype) {
      showToast('Please fill in your name, email, and room type to send an inquiry.');
      return;
    }

    if (checkin && checkout && checkin > checkout) {
      showToast('Check-out date must be after your check-in date.');
      return;
    }

    if (checkin && !checkout) {
      showToast('Please choose a check-out date before submitting.');
      return;
    }

    if (!checkin && checkout) {
      showToast('Please choose a check-in date before submitting.');
      return;
    }

    const payload = {
      firstName: fname,
      lastName: lname,
      email,
      phone,
      checkIn: checkin,
      checkOut: checkout,
      roomType: roomtype,
      message: msg
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || 'Unable to send inquiry right now. Please try again.');
        return;
      }

      showToast(`Thank you, ${fname}! Inquiry #${data.inquiryId.slice(0, 8)} received. We'll be in touch soon from Itbayat!`);
      inquiryForm.reset();
      checkOutField.min = localDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
    } catch (_error) {
      showToast('Network issue detected. Please make sure the backend server is running.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Inquiry →';
    }
  }

  function toggleMenu() {
    nav.classList.toggle('nav-open');
    menuButton.setAttribute('aria-expanded', nav.classList.contains('nav-open'));
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (checkInField && checkOutField) {
    checkInField.min = localDateString(today);
    checkOutField.min = localDateString(tomorrow);
  }

  if (checkInField && checkOutField) {
    checkInField.addEventListener('change', () => {
      if (checkInField.value) {
        const minCheckout = new Date(`${checkInField.value}T00:00:00`);
        minCheckout.setDate(minCheckout.getDate() + 1);
        checkOutField.min = localDateString(minCheckout);
        if (checkOutField.value && checkOutField.value <= checkInField.value) {
          checkOutField.value = '';
        }
      }
    });
  }

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', handleSubmit);
  }

  if (navLinks && menuButton) {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      if (nav) {
        nav.classList.remove('nav-open');
      }
      if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
      }
    }
  });

  const footerYear = document.getElementById('footerYear');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.room-card, .explore-card, .store-cat, .feat-item, .contact-item, .gallery-item').forEach((element) => {
      element.style.cssText += 'opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease;';
      observer.observe(element);
    });
  }

  window.scrollToContact = scrollToContact;
  window.selectRoom = selectRoom;
})();
