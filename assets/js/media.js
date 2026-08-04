(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const roots = Array.from(document.querySelectorAll("[data-video-background]"));
  if (!roots.length) return;

  const observer = "IntersectionObserver" in window ? new IntersectionObserver(handleIntersection, { rootMargin: "200px 0px", threshold: [0, 0.18] }) : null;
  roots.forEach(initVideo);
  reduceMotion.addEventListener("change", handlePreferenceChange);
  document.addEventListener("visibilitychange", handleVisibility);

  function initVideo(root, index) {
    const video = root.querySelector("video");
    const toggle = root.parentElement.querySelector("[data-video-toggle]");
    if (!video) return;
    root._coralVideo = { video, toggle, loaded: index === 0, visible: index === 0, userPaused: false, autoplay: root.dataset.autoplay === "true" };
    video.addEventListener("canplay", () => root.classList.add("is-video-ready"), { once: true });
    video.addEventListener("error", () => root.classList.add("has-video-error"));
    if (toggle) toggle.addEventListener("click", () => togglePlayback(root));
    if (observer) observer.observe(root); else { loadVideo(root); root._coralVideo.visible = true; playWhenAllowed(root); }
    if (index === 0) playWhenAllowed(root);
  }

  function handleIntersection(entries) {
    entries.forEach((entry) => {
      const state = entry.target._coralVideo;
      if (!state) return;
      if (entry.isIntersecting) loadVideo(entry.target);
      state.visible = entry.intersectionRatio >= 0.18;
      if (state.visible) playWhenAllowed(entry.target); else state.video.pause();
    });
  }

  function loadVideo(root) {
    const state = root._coralVideo;
    if (!state || state.loaded || reduceMotion.matches || saveData) return;
    state.video.load();
    state.loaded = true;
  }

  async function playWhenAllowed(root) {
    const state = root._coralVideo;
    if (!state || !state.autoplay || state.userPaused || !state.visible || document.hidden || reduceMotion.matches || saveData) return;
    loadVideo(root);
    try {
      await state.video.play();
      setToggleState(state, false);
    } catch (error) {
      root.classList.add("has-autoplay-failed");
      setToggleState(state, true);
    }
  }

  function togglePlayback(root) {
    const state = root._coralVideo;
    if (!state) return;
    if (state.video.paused) {
      state.userPaused = false;
      state.autoplay = true;
      playWhenAllowed(root);
    } else {
      state.userPaused = true;
      state.video.pause();
      setToggleState(state, true);
    }
  }

  function setToggleState(state, paused) {
    if (!state.toggle) return;
    state.toggle.setAttribute("aria-pressed", String(paused));
    const label = state.toggle.querySelector("[data-video-toggle-label]");
    if (label) label.textContent = paused ? "Play video" : "Pause video";
  }

  function handlePreferenceChange() {
    roots.forEach((root) => {
      const state = root._coralVideo;
      if (!state) return;
      if (reduceMotion.matches) {
        state.video.pause();
        state.video.removeAttribute("autoplay");
        root.classList.remove("is-video-ready");
        setToggleState(state, true);
      } else {
        playWhenAllowed(root);
      }
    });
  }

  function handleVisibility() {
    roots.forEach((root) => {
      const state = root._coralVideo;
      if (!state) return;
      if (document.hidden) state.video.pause(); else playWhenAllowed(root);
    });
  }
})();
