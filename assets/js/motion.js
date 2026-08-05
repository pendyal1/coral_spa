(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealObserver = null;
  let scrollCheckScheduled = false;

  initRevealSystem();
  document.addEventListener("coral:content-rendered", () => observeRevealContent(document));
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", handleMotionPreference);
  else reduceMotion.addListener(handleMotionPreference);
  window.addEventListener("scroll", schedulePassedRevealCheck, { passive: true });

  function initRevealSystem() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      showAll(document);
      return;
    }

    try {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.dataset.revealState = "visible";
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "600px 0px 600px" });
      observeRevealContent(document);
    } catch (error) {
      revealObserver = null;
      showAll(document);
    }
  }

  function observeRevealContent(root) {
    root.querySelectorAll("[data-stagger], [data-stagger-group]").forEach((parent) => {
      const children = parent.hasAttribute("data-stagger-group")
        ? Array.from(parent.querySelectorAll("[data-stagger-item]"))
        : Array.from(parent.children);
      children.forEach((child, index) => {
        child.style.setProperty("--stagger-index", String(index));
        if (child.hasAttribute("data-stagger-item") && !child.hasAttribute("data-reveal")) child.dataset.reveal = "fade-up";
      });
    });

    root.querySelectorAll("[data-reveal]:not([data-reveal-observed])").forEach((item) => {
      item.dataset.revealObserved = "true";
      if (reduceMotion.matches || !revealObserver) {
        item.dataset.revealState = "visible";
        return;
      }

      try {
        revealObserver.observe(item);
        item.dataset.revealState = "pending";
      } catch (error) {
        item.dataset.revealState = "visible";
      }
    });
  }

  function showAll(root) {
    root.querySelectorAll("[data-reveal]").forEach((item) => {
      item.dataset.revealState = "visible";
    });
  }

  function schedulePassedRevealCheck() {
    if (scrollCheckScheduled || !revealObserver) return;
    scrollCheckScheduled = true;
    window.requestAnimationFrame(() => {
      document.querySelectorAll('[data-reveal-state="pending"]').forEach((item) => {
        if (item.getBoundingClientRect().top >= window.innerHeight * 0.94) return;
        item.dataset.revealState = "visible";
        revealObserver.unobserve(item);
      });
      scrollCheckScheduled = false;
    });
  }

  function handleMotionPreference() {
    if (reduceMotion.matches) {
      if (revealObserver) revealObserver.disconnect();
      revealObserver = null;
      showAll(document);
      return;
    }
    if (!revealObserver) initRevealSystem();
  }
})();
