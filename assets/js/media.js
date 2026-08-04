(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const heroRoots = Array.from(document.querySelectorAll("[data-video-background]"));
  const categorySlots = Array.from(document.querySelectorAll("[data-category-video-slot]"));
  const heroObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(handleHeroIntersection, { threshold: [0, 0.18] })
    : null;

  heroRoots.forEach(initHeroVideo);
  categorySlots.forEach(initCategorySlot);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", handlePreferenceChange);
  else reduceMotion.addListener(handlePreferenceChange);
  document.addEventListener("visibilitychange", handleVisibility);

  function initHeroVideo(root) {
    const video = root.querySelector("video");
    const toggle = root.parentElement.querySelector("[data-video-toggle]");
    const valid = root.dataset.videoValid === "true";

    if (!video || !valid) {
      if (video) video.pause();
      if (toggle) toggle.hidden = true;
      root.classList.add("is-poster-only");
      return;
    }

    activateDeferredSources(video);
    const state = {
      video,
      toggle,
      visible: true,
      userPaused: false,
      autoplay: root.dataset.autoplay === "true"
    };
    root._coralVideo = state;
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener("click", () => togglePlayback(root));
    }

    video.addEventListener("loadeddata", () => root.classList.add("is-video-ready"), { once: true });
    video.addEventListener("playing", () => {
      root.classList.remove("has-autoplay-failed");
      root.classList.add("is-video-ready");
      setToggleState(state, false);
    });
    video.addEventListener("error", () => markVideoUnavailable(root));

    if (reduceMotion.matches || saveData) {
      video.autoplay = false;
      video.removeAttribute("autoplay");
      video.pause();
      root.classList.remove("is-video-ready");
      setToggleState(state, true);
      return;
    }

    if (heroObserver) heroObserver.observe(root);
    if (state.autoplay) playWhenAllowed(root);
  }

  function handleHeroIntersection(entries) {
    entries.forEach((entry) => {
      const state = entry.target._coralVideo;
      if (!state) return;
      state.visible = entry.intersectionRatio >= 0.18;
      if (state.visible) playWhenAllowed(entry.target);
      else state.video.pause();
    });
  }

  async function playWhenAllowed(root) {
    const state = root._coralVideo;
    if (!state || !state.autoplay || state.userPaused || !state.visible || document.hidden || reduceMotion.matches || saveData) return;
    try {
      await state.video.play();
    } catch (error) {
      root.classList.add("has-autoplay-failed");
      setToggleState(state, true);
    }
  }

  async function togglePlayback(root) {
    const state = root._coralVideo;
    if (!state) return;
    if (state.video.paused) {
      state.userPaused = false;
      state.autoplay = true;
      try {
        await state.video.play();
      } catch (error) {
        markVideoUnavailable(root);
      }
    } else {
      state.userPaused = true;
      state.video.pause();
      setToggleState(state, true);
    }
  }

  function setToggleState(state, paused) {
    if (!state.toggle) return;
    state.toggle.setAttribute("aria-pressed", String(paused));
    state.toggle.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
    const label = state.toggle.querySelector("[data-video-toggle-label]");
    const icon = state.toggle.querySelector("[data-video-toggle-icon]");
    if (label) label.textContent = paused ? "Play video" : "Pause video";
    if (icon) icon.textContent = paused ? ">" : "||";
  }

  function markVideoUnavailable(root) {
    const state = root._coralVideo;
    if (state) state.video.pause();
    root.classList.remove("is-video-ready");
    root.classList.add("has-video-error");
    if (state && state.toggle) state.toggle.hidden = true;
  }

  function activateDeferredSources(video) {
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });
  }

  function initCategorySlot(slot) {
    if (slot.dataset.videoValid !== "true") return;
    const webm = slot.dataset.videoWebm;
    const mp4 = slot.dataset.videoMp4;
    const media = slot.querySelector(".overview-card__media, .category-media");
    if (!media || !webm || !mp4 || reduceMotion.matches || saveData) return;

    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    video.innerHTML = `<source data-src="${webm}" type="video/webm"><source data-src="${mp4}" type="video/mp4">`;
    media.appendChild(video);

    let loaded = false;
    const play = async () => {
      if (!loaded) {
        activateDeferredSources(video);
        video.load();
        loaded = true;
      }
      try {
        await video.play();
        slot.classList.add("is-category-video-playing");
      } catch (error) {
        slot.classList.remove("is-category-video-playing");
      }
    };
    const pause = () => {
      video.pause();
      slot.classList.remove("is-category-video-playing");
    };
    slot.addEventListener("mouseenter", play);
    slot.addEventListener("mouseleave", pause);
    slot.addEventListener("focusin", play);
    slot.addEventListener("focusout", pause);
  }

  function handlePreferenceChange() {
    heroRoots.forEach((root) => {
      const state = root._coralVideo;
      if (!state) return;
      if (reduceMotion.matches) {
        state.video.pause();
        root.classList.remove("is-video-ready");
        setToggleState(state, true);
      } else {
        playWhenAllowed(root);
      }
    });
  }

  function handleVisibility() {
    heroRoots.forEach((root) => {
      const state = root._coralVideo;
      if (!state) return;
      if (document.hidden) state.video.pause();
      else playWhenAllowed(root);
    });
  }
})();
