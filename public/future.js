// Decorative motion only. Product status and all links work without this file.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.product-panel, .play-features article, .email-vision, .engineering-grid article, .download-grid, .pipeline-section, .community-copy, .community-support, .register-inner, .faq-section').forEach(element => {
    element.classList.add('reveal');
    observer.observe(element);
  });
}
const progress = document.querySelector('.scroll-progress');
let scheduled = false;
function updateProgress() {
  scheduled = false;
  if (!progress) return;
  const available = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${available > 0 ? Math.min(1, Math.max(0, scrollY / available)) : 0})`;
}
addEventListener('scroll', () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateProgress);
}, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();
document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-inactive', document.hidden));
reducedMotion.addEventListener?.('change', event => {
  if (event.matches) document.querySelectorAll('.reveal').forEach(element => element.classList.add('in-view'));
});
