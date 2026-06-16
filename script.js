/**
 * VoltGuard Electrical - Main Script
 */

document.addEventListener('DOMContentLoaded', () => {
  
    // --- 1. Current Year for Footer ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  
    // --- 2. Mobile Navigation Toggle ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (mainNav.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    }
  
    // Mobile Mega Menu Accordion
    const navItems = document.querySelectorAll('.nav-item.has-mega > a');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const parent = item.parentElement;
          parent.classList.toggle('mobile-mega-open');
        }
      });
    });
  
    // --- 3. Search Overlay Toggle ---
    const searchBtn = document.querySelector('.search-icon button');
    const closeSearchBtn = document.querySelector('.close-search');
    const searchOverlay = document.querySelector('.search-overlay');
    
    if (searchBtn && closeSearchBtn && searchOverlay) {
      searchBtn.addEventListener('click', () => {
        searchOverlay.classList.add('active');
        setTimeout(() => {
          searchOverlay.querySelector('input').focus();
        }, 100);
      });
      
      closeSearchBtn.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
      });
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
          searchOverlay.classList.remove('active');
        }
      });
    }
  
    // --- 4. Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, revealOptions);
    
    revealElements.forEach(el => {
      revealObserver.observe(el);
    });
  
    // --- 5. Number Counters Animation ---
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // The lower the slower
    
    const animateCounters = (counter) => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      
      const inc = target / speed;
      
      if (count < target) {
        counter.innerText = Math.ceil(count + inc);
        setTimeout(() => animateCounters(counter), 10);
      } else {
        counter.innerText = target.toLocaleString(); // Format with commas
      }
    };
    
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
      counterObserver.observe(counter);
    });
  
    // --- 6. Sticky Header on Scroll ---
    const header = document.querySelector('.site-header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        header.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
        header.style.padding = "0"; // Example adjustment
      } else {
        header.style.boxShadow = "var(--shadow-sm)";
      }
      lastScrollY = window.scrollY;
    });
  
    // --- 7. Contact Overlay Toggle ---
    const contactLinks = document.querySelectorAll('a[href="#contact"]');
    const contactOverlay = document.getElementById('contact-overlay');
    const closeContactBtn = document.querySelector('.close-contact');
    
    if (contactOverlay && closeContactBtn) {
      contactLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          contactOverlay.classList.add('active');
        });
      });
      
      closeContactBtn.addEventListener('click', () => {
        contactOverlay.classList.remove('active');
      });
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactOverlay.classList.contains('active')) {
          contactOverlay.classList.remove('active');
        }
      });
    }
  
  });
