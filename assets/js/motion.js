(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const smallScreen = window.matchMedia("(max-width: 760px)");
  let revealObserver;
  let parallaxObserver;
  const activeParallax = new Set();
  let parallaxScheduled = false;

  document.documentElement.classList.add("motion-enabled");
  initRevealObserver();
  observeMotionContent(document);
  initParallaxObserver();

  document.addEventListener("coral:content-rendered", () => observeMotionContent(document));
  reduceMotion.addEventListener("change", handleMotionPreference);
  smallScreen.addEventListener("change", handleMotionPreference);

  function initRevealObserver() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6%" });
  }

  function observeMotionContent(root) {
    root.querySelectorAll("[data-stagger]").forEach((parent) => {
      Array.from(parent.children).forEach((child, index) => child.style.setProperty("--stagger-index", String(index)));
    });
    root.querySelectorAll("[data-reveal]:not([data-motion-observed])").forEach((item) => {
      item.dataset.motionObserved = "true";
      if (reduceMotion.matches || !revealObserver) item.classList.add("is-revealed");
      else revealObserver.observe(item);
    });
    if (parallaxObserver) {
      root.querySelectorAll("[data-parallax-media]:not([data-parallax-observed])").forEach((item) => {
        item.dataset.parallaxObserved = "true";
        parallaxObserver.observe(item);
      });
    }
  }

  function initParallaxObserver() {
    if (reduceMotion.matches || smallScreen.matches || !("IntersectionObserver" in window)) return;
    parallaxObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activeParallax.add(entry.target);
        else activeParallax.delete(entry.target);
      });
      scheduleParallax();
    }, { rootMargin: "12% 0px" });
    document.querySelectorAll("[data-parallax-media]").forEach((item) => {
      item.dataset.parallaxObserved = "true";
      parallaxObserver.observe(item);
    });
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });
  }

  function scheduleParallax() {
    if (parallaxScheduled || !activeParallax.size) return;
    parallaxScheduled = true;
    window.requestAnimationFrame(updateParallax);
  }

  function updateParallax() {
    const viewport = window.innerHeight;
    activeParallax.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      const offset = Math.max(-1, Math.min(1, progress)) * -18;
      item.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });
    parallaxScheduled = false;
  }

  function handleMotionPreference() {
    if (reduceMotion.matches || smallScreen.matches) {
      activeParallax.clear();
      if (parallaxObserver) parallaxObserver.disconnect();
      parallaxObserver = null;
      document.querySelectorAll("[data-parallax-media]").forEach((item) => item.style.removeProperty("--parallax-y"));
      document.querySelectorAll("[data-reveal]").forEach((item) => item.classList.add("is-revealed"));
      return;
    }
    if (!parallaxObserver) initParallaxObserver();
  }
})();
