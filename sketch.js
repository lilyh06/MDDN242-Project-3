/* =============================================
   SOLE STORY — script.js
   ============================================= */

// --- Scroll-triggered section reveals ---
const stages = document.querySelectorAll('.stage');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      // Animate impact bars when they come into view
      const fill = entry.target.querySelector('.fill');
      if (fill) {
        const targetWidth = fill.style.width;
        fill.style.width = '0';
        setTimeout(() => { fill.style.width = targetWidth; }, 200);
      }
    }
  });
}, { threshold: 0.2 });

stages.forEach(stage => observer.observe(stage));


// --- Active nav dot on scroll ---
const navDots = document.querySelectorAll('.nav-dot');
const sectionIds = ['materials', 'manufacturing', 'transport', 'use', 'end'];

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navDots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('href') === `#${id}`) {
          dot.classList.add('active');
        }
      });
    }
  });
}, { threshold: 0.5 });

sectionIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) navObserver.observe(el);
});


// --- Smooth scroll for nav dots ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});


// --- Hero shoe parallax on mouse move ---
const heroShoe = document.querySelector('.hero-img-stack');
document.addEventListener('mousemove', (e) => {
  if (!heroShoe) return;
  const x = (e.clientX / window.innerWidth - 0.5) * 12;
  const y = (e.clientY / window.innerHeight - 0.5) * 12;
  heroShoe.style.transform = `translate(${x}px, ${y}px)`;
});