(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealObserver = null;

  initRevealSystem();
  document.addEventListener("coral:content-rendered", () => observeRevealContent(document));
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", handleMotionPreference);
  else reduceMotion.addListener(handleMotionPreference);

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
      }, { threshold: 0.12, rootMargin: "0px 0px -6%" });
      observeRevealContent(document);
    } catch (error) {
      revealObserver = null;
      showAll(document);
    }
  }

  function observeRevealContent(root) {
    root.querySelectorAll("[data-stagger]").forEach((parent) => {
      Array.from(parent.children).forEach((child, index) => {
        child.style.setProperty("--stagger-index", String(index));
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
