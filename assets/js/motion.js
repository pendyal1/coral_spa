(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let revealObserver = null;
  let staggerObserver = null;
  let playbackObserver = null;
  const staggerTargets = new WeakMap();

  function timestamp(node) {
    node.dataset.revealedAt = performance.now().toFixed(1);
  }

  function revealElement(node) {
    node.dataset.revealState = "visible";
    timestamp(node);
    if (node.dataset.revealRepeat !== "true" && revealObserver) revealObserver.unobserve(node);
  }

  function groupItems(group) {
    if (group.hasAttribute("data-stagger-group")) return Array.from(group.querySelectorAll(":scope [data-stagger-item]"));
    return Array.from(group.children).map((child) => {
      child.setAttribute("data-stagger-item", "");
      return child;
    });
  }

  function selectIncludingRoot(root, selector) {
    const matches = root instanceof Element && root.matches(selector) ? [root] : [];
    return matches.concat(Array.from(root.querySelectorAll(selector)));
  }

  function revealGroup(group) {
    const items = groupItems(group);
    group.dataset.staggerState = "running";
    const delay = items.length > 8 ? 55 : window.innerWidth < 720 ? 115 : 175;
    items.forEach((item, index) => {
      window.setTimeout(() => {
        item.dataset.staggerState = "visible";
        item.dataset.motionState = "visible";
        item.dataset.revealState = "visible";
        timestamp(item);
        if (index === items.length - 1) {
          group.dataset.staggerState = "complete";
          timestamp(group);
        }
      }, reduceMotion.matches ? 0 : index * delay);
    });
    if (staggerObserver && group._staggerObserverTarget) staggerObserver.unobserve(group._staggerObserverTarget);
  }

  function revealNow(root = document) {
    selectIncludingRoot(root, "[data-reveal]").forEach(revealElement);
    selectIncludingRoot(root, "[data-stagger], [data-stagger-group]").forEach((group) => {
      group.dataset.staggerReady = "false";
      group.dataset.staggerState = "complete";
      groupItems(group).forEach((item) => {
        item.dataset.staggerState = "visible";
        item.dataset.motionState = "visible";
        item.dataset.revealState = "visible";
      });
    });
  }

  function refresh(root = document) {
    if (reduceMotion.matches || !revealObserver || !staggerObserver || !playbackObserver) {
      revealNow(root);
      return;
    }

    selectIncludingRoot(root, "[data-stagger], [data-stagger-group]").forEach((group) => {
      if (group.dataset.staggerObserved === "true") return;
      const items = groupItems(group);
      if (!items.length) return;
      try {
        const observerTarget = items[0];
        group._staggerObserverTarget = observerTarget;
        staggerTargets.set(observerTarget, group);
        staggerObserver.observe(observerTarget);
        group.dataset.staggerObserved = "true";
        group.dataset.staggerReady = "true";
        group.dataset.staggerState = "pending";
        items.forEach((item, index) => {
          item.classList.toggle("stagger-direct", !item.querySelector(":scope > .stagger-motion-layer"));
          item.style.setProperty("--stagger-index", String(index));
          item.dataset.staggerState = "pending";
          item.dataset.motionState = "pending";
          item.dataset.revealState = "pending";
        });
      } catch (error) {
        revealGroup(group);
      }
    });

    selectIncludingRoot(root, "[data-reveal]:not([data-reveal-observed])").forEach((node) => {
      if (node.closest('[data-stagger-ready="true"]')) return;
      try {
        revealObserver.observe(node);
        node.dataset.revealObserved = "true";
        node.dataset.revealState = "pending";
      } catch (error) {
        revealElement(node);
      }
    });
    selectIncludingRoot(root, "[data-motion-playback]:not([data-motion-observed])").forEach((node) => {
      node.dataset.motionObserved = "true";
      playbackObserver.observe(node);
    });
  }

  function initialize() {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealNow(document);
      return;
    }
    try {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) revealElement(entry.target); });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) revealGroup(staggerTargets.get(entry.target) || entry.target); });
      }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
      playbackObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const active = entry.isIntersecting && entry.intersectionRatio >= 0.35;
          entry.target.dataset.motionActive = String(active);
          entry.target.dispatchEvent(new CustomEvent(active ? "coral:motion-active" : "coral:motion-inactive"));
        });
      }, { threshold: [0, 0.35, 0.7] });
      refresh(document);
    } catch (error) {
      revealObserver = null;
      staggerObserver = null;
      playbackObserver = null;
      revealNow(document);
    }
  }

  window.CoralMotion = { refresh, revealNow };
  document.addEventListener("coral:content-rendered", (event) => refresh(event.detail && event.detail.root || document));
  const motionChange = () => {
    if (reduceMotion.matches) {
      if (revealObserver) revealObserver.disconnect();
      if (staggerObserver) staggerObserver.disconnect();
      if (playbackObserver) playbackObserver.disconnect();
      revealObserver = null;
      staggerObserver = null;
      playbackObserver = null;
      revealNow(document);
    } else {
      initialize();
    }
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", motionChange);
  else reduceMotion.addListener(motionChange);
  initialize();
})();
