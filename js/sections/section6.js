export function initSection6() {
  const sc6RevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });

  document.querySelectorAll('.sc6-reveal').forEach(el => sc6RevealObserver.observe(el));
}