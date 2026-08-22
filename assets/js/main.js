(function () {
  "use strict";

  const services = Array.isArray(window.CORAL_SERVICES) ? window.CORAL_SERVICES : [];
  const categoryImages = {
    Specials: mediaPair("assets/images/categories/specials-desktop.webp", "assets/images/categories/specials-mobile.webp"),
    Massages: mediaPair("assets/images/categories/category-massage.webp"),
    Facials: mediaPair("assets/images/categories/category-facials.webp"),
    "Body Polish": mediaPair("assets/images/categories/category-body-care.webp"),
    "Body Wraps": mediaPair("assets/images/categories/category-body-care.webp"),
    "Foot Reflexology": mediaPair("assets/images/categories/foot-reflexology-desktop.webp", "assets/images/categories/foot-reflexology-mobile.webp"),
    "Head Massage": mediaPair("assets/images/categories/head-massage-desktop.webp", "assets/images/categories/head-massage-mobile.webp"),
    "De-tanning": mediaPair("assets/images/categories/de-tanning-desktop.webp", "assets/images/categories/de-tanning-mobile.webp"),
    "Manicure & Pedicure": mediaPair("assets/images/categories/category-hands-feet.webp"),
    "Hair Spa": mediaPair("assets/images/categories/category-hair-spa.webp")
  };

  const signatureImages = {
    "The Jet Lag Reset": mediaPair("assets/images/signatures/jet-lag-reset-desktop.webp", "assets/images/signatures/jet-lag-reset-mobile.webp"),
    "Lymphatic Drainage": mediaPair("assets/images/signatures/lymphatic-drainage-desktop.webp", "assets/images/signatures/lymphatic-drainage-mobile.webp"),
    "The Heat Ritual": mediaPair("assets/images/signatures/heat-ritual-desktop.webp", "assets/images/signatures/heat-ritual-mobile.webp")
  };

  const categoryVideoSlots = {
    Massages: videoSlot("category-massage"),
    Facials: videoSlot("category-facials"),
    "Body Polish": videoSlot("category-body-care"),
    "Body Wraps": videoSlot("category-body-care"),
    "Foot Reflexology": videoSlot("category-hands-feet"),
    "Head Massage": videoSlot("category-massage"),
    "De-tanning": videoSlot("category-facials"),
    "Manicure & Pedicure": videoSlot("category-hands-feet"),
    "Hair Spa": videoSlot("category-hair-spa")
  };

  initYear();
  initHeader();
  initNavigation();
  initWhyMedia();
  initWhyActionAvoidance();
  renderHomeContent();
  initGalleryShowcase();
  initGoogleReviews();
  renderServicesMenu();
  initTeamSection();
  initRequestForms();
  initBackToTop();
  initServiceSearch();
  initAnchorNavigation();
  initCertificateDialog();

  function initYear() {
    document.querySelectorAll("[data-year]").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function initHeader() {
    const header = document.getElementById("siteHeader");
    if (!header) return;
    let scheduled = false;
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 36);
      scheduled = false;
    };
    update();
    window.addEventListener("scroll", () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  function initNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    const close = (returnFocus) => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener("click", () => {
      const willOpen = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(willOpen));
      nav.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("nav-open", willOpen);
    });
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) close(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) close(true);
    });
    document.addEventListener("pointerdown", (event) => {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) close(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) close(false);
    });
  }

  function initWhyMedia() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    document.querySelectorAll("[data-why-media]").forEach((root) => {
      const video = root.querySelector("video");
      if (!video || root.dataset.videoValid !== "true") return;
      let loaded = false;
      const load = () => {
        if (loaded || reduceMotion.matches || saveData) return;
        const mobile = window.matchMedia("(max-width: 719px)").matches;
        video.querySelectorAll("source").forEach((source) => { source.src = mobile ? source.dataset.src : source.dataset.desktopSrc; });
        video.load();
        loaded = true;
      };
      const play = () => {
        load();
        if (!loaded || reduceMotion.matches || document.hidden) return;
        video.play().then(() => root.classList.add("is-video-ready")).catch(() => root.classList.remove("is-video-ready"));
      };
      root.addEventListener("coral:motion-active", play);
      root.addEventListener("coral:motion-inactive", () => video.pause());
      video.addEventListener("canplay", () => root.classList.add("is-video-ready"), { once: true });
      video.addEventListener("error", () => root.classList.remove("is-video-ready"));
      document.addEventListener("visibilitychange", () => document.hidden ? video.pause() : root.dataset.motionActive === "true" && play());
    });
  }

  function initWhyActionAvoidance() {
    const actions = document.querySelector(".floating-actions");
    const backToTop = document.querySelector(".back-to-top");
    const sections = Array.from(document.querySelectorAll(".why-section"));
    if (!actions || !sections.length || !("IntersectionObserver" in window)) return;

    const visibleSections = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      });
      const shouldClearContent = visibleSections.size > 0;
      actions.classList.toggle("is-why-safe", shouldClearContent);
      if (backToTop) backToTop.classList.toggle("is-why-safe", shouldClearContent);
    }, { threshold: 0, rootMargin: "-8% 0px -8% 0px" });

    sections.forEach((section) => observer.observe(section));
  }

  function refreshDynamicContent(root) {
    document.dispatchEvent(new CustomEvent("coral:content-rendered", { detail: { root } }));
    if (window.CoralMotion && typeof window.CoralMotion.refresh === "function") window.CoralMotion.refresh(root);
  }

  function renderHomeContent() {
    const signatureRail = document.querySelector("[data-signature-rail]");
    const categoryGrid = document.querySelector("[data-home-categories]");

    if (signatureRail && services.length) {
      const specials = services.find((item) => item.category === "Specials");
      signatureRail.innerHTML = (specials ? specials.services.slice(0, 3) : []).map((service) => `
        <a class="signature-card" href="services.html#${slug(service.name)}" data-reveal="fade-up">
          <div class="signature-card__media"><img ${responsiveImageAttributes(signatureImages[service.name] || mediaPair(service.image), "(max-width: 720px) 82vw, 30vw")} width="900" height="1200" loading="lazy" decoding="async" alt=""></div>
          <div class="signature-card__copy"><span>${escapeHtml(service.tag || specials.category)}</span><h3>${escapeHtml(service.name)}</h3><p>${escapeHtml(service.description)}</p><div class="signature-card__meta"><span>${escapeHtml(service.duration)}</span><i aria-hidden="true">→</i></div></div>
        </a>`).join("");
    }

    if (categoryGrid && services.length) {
      categoryGrid.innerHTML = services.map((category) => `
        <a class="category-card" href="services.html#${categoryHash(category.category)}" data-reveal="fade-up">
          <img ${responsiveImageAttributes(categoryImage(category), "(max-width: 720px) 84vw, 30vw")} width="1920" height="1080" loading="lazy" decoding="async" alt="">
          <span class="category-card__scrim"></span><span class="category-card__label">${escapeHtml(category.category)}</span><i aria-hidden="true">→</i>
        </a>`).join("");
    }
    refreshDynamicContent(document);
  }

  function renderServicesMenu() {
    const root = document.querySelector("[data-service-categories]");
    const nav = document.querySelector("[data-service-nav]");
    if (!root || !services.length) return;

    if (nav) {
      nav.innerHTML = services.map((category) => {
        const id = categoryHash(category.category);
        return `<a class="service-nav-tile" href="#${id}" data-category-link="${id}" data-stagger-item><img ${responsiveImageAttributes(categoryImage(category), "(max-width: 719px) 46vw, (max-width: 1279px) 18vw, 9vw")} width="960" height="1200" loading="lazy" decoding="async" alt=""><span>${escapeHtml(category.category)}</span></a>`;
      }).join("");
    }

    root.innerHTML = services.map((category, categoryIndex) => {
      const id = categoryHash(category.category);
      const surfaces = ["surface-smoked-glass", "surface-pebble", "surface-deep-wood"];
      return `
        <section class="service-group ${surfaces[categoryIndex % surfaces.length]}" id="${id}" data-service-group="${escapeHtml(category.category)}">
          <header class="service-group__header">
            <div><h2>${escapeHtml(category.category)}</h2><p>${escapeHtml(category.intro)}</p></div>
            <figure class="category-media" ${categoryVideoAttributes(category)}><img ${responsiveImageAttributes(categoryImage(category), "(max-width: 720px) 92vw, 34vw")} width="1920" height="1080" loading="lazy" decoding="async" alt=""></figure>
          </header>
          <div class="service-list" data-stagger-group>${category.services.map((service) => serviceRow(service, category.category)).join("")}</div>
        </section>`;
    }).join("");

    initActiveCategory();
    openInitialServiceHash();
    initServiceDisclosures(root);
    refreshDynamicContent(root);
  }

  function initServiceDisclosures(root) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.querySelectorAll(".service-row:not([data-disclosure-ready])").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      const panel = details.querySelector(":scope > .service-row__detail");
      if (!summary || !panel) return;
      details.dataset.disclosureReady = "true";
      let state = details.open ? "open" : "closed";
      let animation = null;

      const settle = (opening, activeAnimation) => {
        if (animation !== activeAnimation) return;
        if (!opening) details.open = false;
        state = opening ? "open" : "closed";
        details.dataset.disclosureState = state;
        summary.setAttribute("aria-expanded", String(opening));
        animation = null;
        activeAnimation.cancel();
      };

      const toggle = (opening) => {
        if (animation) animation.cancel();
        const startHeight = details.open ? panel.getBoundingClientRect().height : 0;
        if (opening && !details.open) details.open = true;
        const endHeight = opening ? panel.scrollHeight : 0;
        summary.setAttribute("aria-expanded", String(opening));

        if (reduceMotion.matches || typeof panel.animate !== "function") {
          details.open = opening;
          state = opening ? "open" : "closed";
          details.dataset.disclosureState = state;
          return;
        }

        state = opening ? "opening" : "closing";
        details.dataset.disclosureState = state;
        const activeAnimation = panel.animate([
          { height: `${startHeight}px`, opacity: opening && startHeight === 0 ? 0 : 1, transform: opening ? "translateY(-7px)" : "none" },
          { height: `${endHeight}px`, opacity: opening ? 1 : 0, transform: opening ? "none" : "translateY(-7px)" }
        ], {
          duration: 520,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both"
        });
        animation = activeAnimation;
        activeAnimation.onfinish = () => settle(opening, activeAnimation);
      };

      summary.setAttribute("aria-expanded", String(details.open));
      details.dataset.disclosureState = state;
      summary.addEventListener("click", (event) => {
        event.preventDefault();
        toggle(state === "closed" || state === "closing");
      });
    });
  }

  function initGalleryShowcase() {
    const root = document.querySelector("[data-gallery-showcase]");
    if (!root) return;
    const focus = root.querySelector("[data-gallery-focus]");
    let focusMedia = root.querySelector("[data-gallery-focus-media]");
    let focusImage = root.querySelector("[data-gallery-focus-image]");
    const caption = root.querySelector("[data-gallery-caption-output]");
    const thumbs = Array.from(root.querySelectorAll("[data-gallery-thumb]"));
    const previous = root.querySelector("[data-gallery-prev]");
    const next = root.querySelector("[data-gallery-next]");
    const toggle = root.querySelector("[data-gallery-toggle]");
    const toggleLabel = root.querySelector("[data-gallery-toggle-label]");
    if (!focus || !focusMedia || !focusImage || !caption || thumbs.length !== 4) return;

    const readItem = (element) => ({ src: element.dataset.gallerySrc, small: element.dataset.gallerySmall, large: element.dataset.galleryLarge, caption: element.dataset.galleryCaption, alt: element.dataset.galleryAlt });
    const items = [readItem(focus), ...thumbs.map(readItem)];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const failedItems = new Set();
    let focusedIndex = 0;
    let timer = null;
    let explicitlyPaused = false;
    let focusPaused = false;
    let motionActive = root.dataset.motionActive === "true";
    let manualResumeAt = 0;
    let renderToken = 0;
    thumbs.forEach((button, index) => { button.dataset.galleryIndex = String(index + 1); });

    const decodeImage = (src) => new Promise((resolve, reject) => {
      const candidate = new Image();
      let settled = false;
      const fail = () => { if (!settled) { settled = true; reject(new Error(`Unable to load gallery image: ${src}`)); } };
      const finish = async () => {
        if (settled) return;
        if (!candidate.naturalWidth || !candidate.naturalHeight) { fail(); return; }
        try { if (candidate.decode) await candidate.decode(); } catch (error) { /* onload already confirmed a usable image. */ }
        if (!settled) { settled = true; resolve(candidate); }
      };
      candidate.onload = finish;
      candidate.onerror = fail;
      candidate.decoding = "async";
      candidate.src = src;
      if (candidate.complete && candidate.naturalWidth > 0) finish();
    });
    const loadItem = async (item) => {
      const preferred = window.matchMedia("(max-width: 899px)").matches ? item.small : item.large;
      try { return await decodeImage(preferred); }
      catch (error) { return decodeImage(item.src); }
    };
    const updatePlaybackUi = () => {
      root.dataset.galleryPlaying = String(!explicitlyPaused && !focusPaused && motionActive && !reduceMotion.matches && !document.hidden);
      if (!toggle) return;
      toggle.setAttribute("aria-pressed", String(explicitlyPaused));
      toggle.setAttribute("aria-label", explicitlyPaused ? "Resume gallery rotation" : "Pause gallery rotation");
      if (toggleLabel) toggleLabel.textContent = explicitlyPaused ? "Play" : "Pause";
    };
    const render = async (nextIndex) => {
      const requestedIndex = (nextIndex + items.length) % items.length;
      if (requestedIndex === focusedIndex) return true;
      if (failedItems.has(requestedIndex)) return false;
      const item = items[requestedIndex];
      const token = ++renderToken;
      let incomingImage;
      try { incomingImage = await loadItem(item); }
      catch (error) {
        failedItems.add(requestedIndex);
        root.dataset.galleryErrorCount = String(failedItems.size);
        if (isDevelopmentHost()) console.warn("Coral gallery image failed to load", item.large || item.src, error);
        return false;
      }
      if (token !== renderToken) return false;
      incomingImage.className = "gallery-showcase__focus-image gallery-showcase__focus-image--incoming";
      incomingImage.alt = item.alt;
      incomingImage.width = incomingImage.naturalWidth;
      incomingImage.height = incomingImage.naturalHeight;
      incomingImage.setAttribute("data-gallery-focus-image", "");
      focusImage.removeAttribute("data-gallery-focus-image");
      focus.insertBefore(incomingImage, caption);
      const outgoingMedia = focusMedia;
      focusMedia = incomingImage;
      focusImage = incomingImage;
      focusedIndex = requestedIndex;
      root.dataset.galleryIndex = String(focusedIndex);
      root.dataset.galleryLastChange = performance.now().toFixed(1);
      Object.assign(focus.dataset, { gallerySrc: item.src, gallerySmall: item.small, galleryLarge: item.large, galleryCaption: item.caption, galleryAlt: item.alt });
      caption.textContent = item.caption;
      const remaining = items.map((entry, index) => ({ item: entry, index })).filter(({ index }) => index !== focusedIndex);
      thumbs.forEach((button, slot) => {
        const entry = remaining[slot];
        const image = button.querySelector("img");
        const label = button.querySelector("span");
        Object.assign(button.dataset, { galleryIndex: String(entry.index), gallerySrc: entry.item.src, gallerySmall: entry.item.small, galleryLarge: entry.item.large, galleryCaption: entry.item.caption, galleryAlt: entry.item.alt });
        button.setAttribute("aria-label", `Show ${entry.item.caption}`);
        button.setAttribute("aria-pressed", "false");
        image.src = entry.item.small || entry.item.src;
        label.textContent = entry.item.caption;
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        incomingImage.classList.add("is-active");
        outgoingMedia.classList.add("is-outgoing");
        window.setTimeout(() => {
          outgoingMedia.remove();
          incomingImage.classList.remove("gallery-showcase__focus-image--incoming", "is-active");
        }, 300);
      }));
      return true;
    };
    const stop = () => { if (timer) clearTimeout(timer); timer = null; };
    const nextAvailable = (direction) => {
      for (let offset = 1; offset < items.length; offset += 1) {
        const candidate = (focusedIndex + direction * offset + items.length) % items.length;
        if (!failedItems.has(candidate)) return candidate;
      }
      return focusedIndex;
    };
    const schedule = (minimumDelay = 5500) => {
      stop();
      updatePlaybackUi();
      if (explicitlyPaused || focusPaused || !motionActive || reduceMotion.matches || document.hidden || failedItems.size >= items.length - 1) return;
      timer = setTimeout(async () => { await render(nextAvailable(1)); schedule(); }, Math.max(minimumDelay, manualResumeAt - Date.now()));
    };
    const select = async (index, manual) => { if (manual) manualResumeAt = Date.now() + 10000; await render(index); schedule(manual ? 10000 : 5500); };

    thumbs.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.galleryIndex), true)));
    if (previous) previous.addEventListener("click", () => select(nextAvailable(-1), true));
    if (next) next.addEventListener("click", () => select(nextAvailable(1), true));
    if (toggle) toggle.addEventListener("click", () => { explicitlyPaused = !explicitlyPaused; explicitlyPaused ? stop() : schedule(); updatePlaybackUi(); });
    root.addEventListener("keydown", (event) => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); select(nextAvailable(event.key === "ArrowRight" ? 1 : -1), true); });
    root.addEventListener("focusin", () => { focusPaused = true; stop(); updatePlaybackUi(); });
    root.addEventListener("focusout", (event) => { if (!root.contains(event.relatedTarget)) { focusPaused = false; schedule(); } });
    root.addEventListener("coral:motion-active", () => { motionActive = true; schedule(); });
    root.addEventListener("coral:motion-inactive", () => { motionActive = false; stop(); updatePlaybackUi(); });
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : schedule());
    const handleMotionChange = () => reduceMotion.matches ? stop() : schedule();
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", handleMotionChange); else reduceMotion.addListener(handleMotionChange);
    root.dataset.galleryIndex = "0";
    root.dataset.galleryErrorCount = "0";
    root.dataset.galleryReady = "true";
    updatePlaybackUi();
    const initialReady = focusImage.complete && focusImage.naturalWidth > 0 ? Promise.resolve() : decodeImage(focusImage.currentSrc || focusImage.src);
    initialReady.then(() => schedule()).catch((error) => { root.dataset.galleryErrorCount = "1"; if (isDevelopmentHost()) console.warn("Initial Coral gallery image failed to decode", error); });
  }

  async function initGoogleReviews() {
    const roots = Array.from(document.querySelectorAll("[data-google-reviews]"));
    if (!roots.length) return;
    const config = window.CORAL_GOOGLE_REVIEWS || {};
    const mapsUrl = config.mapsUrl || "https://www.google.com/maps/search/?api=1&query=Coral%20Spa%20B.K-2%20Tower%203%2F13A%20Vishnu%20Puri%20Kanpur";
    let stage = "configuration";

    try {
      let reviews = [];
      let liveMapsUrl = mapsUrl;
      if (config.endpoint) {
        stage = "endpoint-request";
        const response = await fetch(config.endpoint, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Reviews endpoint returned an unsuccessful response");
        const payload = await response.json();
        reviews = normalizeReviews(payload.reviews || payload);
        liveMapsUrl = payload.mapsUrl || mapsUrl;
      } else if (config.apiKey) {
        stage = "maps-script";
        await loadGoogleMaps(config.apiKey);
        stage = "place-resolution";
        const place = await resolveGooglePlace(config);
        stage = "review-fields";
        await place.fetchFields({ fields: ["displayName", "googleMapsURI", "rating", "userRatingCount", "reviews"] });
        reviews = normalizeReviews(place.reviews || []);
        liveMapsUrl = place.googleMapsURI || mapsUrl;
      } else {
        renderGoogleReviewFallback(roots, mapsUrl, new Error("Live review configuration is not available"), stage);
        return;
      }

      stage = "review-selection";
      const sortedReviews = reviews.sort(newestReviewFirst);
      if (!sortedReviews.length) throw new Error("No reviews were returned");
      const highRatedReviews = sortedReviews.filter((review) => review.rating >= 4);
      const selectedReviews = (highRatedReviews.length >= 3 ? highRatedReviews : sortedReviews).slice(0, 5);
      renderGoogleReviews(roots, selectedReviews, liveMapsUrl);
    } catch (error) {
      if (stage !== "configuration") console.error(`Coral Google Reviews failed during ${stage}:`, error);
      renderGoogleReviewFallback(roots, mapsUrl, error, stage);
    }
  }

  function loadGoogleMaps(apiKey) {
    if (window.google && window.google.maps && window.google.maps.importLibrary) return Promise.resolve();
    if (window.__coralGoogleMapsPromise) return window.__coralGoogleMapsPromise;
    window.__coralGoogleMapsPromise = new Promise((resolve, reject) => {
      const callbackName = `coralGoogleMapsReady_${Date.now()}`;
      const timeout = window.setTimeout(() => {
        delete window[callbackName];
        reject(new Error("Google Maps loading timed out"));
      }, 10000);
      window[callbackName] = () => { window.clearTimeout(timeout); delete window[callbackName]; resolve(); };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => { window.clearTimeout(timeout); delete window[callbackName]; reject(new Error("Google Maps could not load")); };
      document.head.appendChild(script);
    });
    return window.__coralGoogleMapsPromise;
  }

  async function resolveGooglePlace(config) {
    const { Place } = await window.google.maps.importLibrary("places");
    if (config.placeId) return new Place({ id: config.placeId });
    const result = await Place.searchByText({
      textQuery: config.placeQuery || "Coral Spa Kanpur",
      fields: ["id", "displayName", "googleMapsURI"],
      maxResultCount: 1
    });
    if (!result.places || !result.places[0]) throw new Error("Google place not found");
    return result.places[0];
  }

  function normalizeReviews(reviews) {
    if (!Array.isArray(reviews)) return [];
    return reviews.map((review) => {
      const author = review.authorAttribution || review.author || {};
      const text = review.text && typeof review.text === "object" ? review.text.text : review.text;
      return {
        authorName: author.displayName || review.authorName || "Google reviewer",
        authorUrl: safeExternalUrl(author.uri || review.authorUrl),
        rating: Number(review.rating || 0),
        text: String(text || "").trim(),
        publishTime: review.publishTime || review.time || "",
        relativeTime: review.relativePublishTimeDescription || review.relativeTime || ""
      };
    });
  }

  function newestReviewFirst(a, b) {
    return reviewTime(b.publishTime) - reviewTime(a.publishTime);
  }

  function reviewTime(value) {
    const parsed = typeof value === "number" ? value * 1000 : Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function renderGoogleReviews(roots, reviews, mapsUrl) {
    const cards = reviews.map((review) => {
      const rating = Math.max(0, Math.min(5, Math.round(review.rating)));
      const stars = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
      const author = review.authorUrl
        ? `<a href="${escapeHtml(review.authorUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(review.authorName)}</a>`
        : escapeHtml(review.authorName);
      return `<article class="review-card glass-panel" data-stagger-item><div class="review-card__stars" aria-label="${rating} out of 5 stars">${stars}</div>${review.text ? `<p>${escapeHtml(trimReview(review.text))}</p>` : ""}<span>${author}${review.relativeTime ? ` · ${escapeHtml(review.relativeTime)}` : ""}</span></article>`;
    }).join("");
    roots.forEach((root) => {
      root.innerHTML = cards;
      root.dataset.reviewState = "ready";
      root.dataset.reviewError = "";
      root.setAttribute("aria-busy", "false");
      refreshDynamicContent(root);
      requestAnimationFrame(() => requestAnimationFrame(() => initCarousel(root.closest("[data-carousel]"))));
    });
    updateGoogleReviewLinks(mapsUrl);
  }

  function renderGoogleReviewFallback(roots, mapsUrl, error, stage = "unknown") {
    const diagnostic = isDevelopmentHost() && error ? `<p class="review-diagnostic" role="status">Review diagnostic (${escapeHtml(stage)}): ${escapeHtml(error.message || "Live review loading failed")}</p>` : "";
    const card = `<article class="review-card review-card--fallback glass-panel"><div class="review-card__stars" aria-hidden="true">★★★★★</div><p>Open Coral Spa’s Google listing to read the latest reviews and ratings directly from the source.</p><span><a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Open Google Reviews</a></span>${diagnostic}</article>`;
    roots.forEach((root) => {
      root.innerHTML = card;
      root.dataset.reviewState = "fallback";
      root.dataset.reviewError = reviewErrorCode(stage);
      root.setAttribute("aria-busy", "false");
      const carousel = root.closest("[data-carousel]");
      const controls = carousel && carousel.querySelector(".carousel-controls");
      if (controls) controls.hidden = true;
    });
  }

  function reviewErrorCode(stage) {
    return ({ configuration: "missing-config", "maps-script": "maps-load", "place-resolution": "place-search", "review-fields": "place-fields", "review-selection": "no-reviews", "endpoint-request": "endpoint-failed" })[stage] || "unknown";
  }

  function isDevelopmentHost() {
    return location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  }

  function updateGoogleReviewLinks(url) {
    const safe = safeExternalUrl(url);
    if (!safe) return;
    document.querySelectorAll('#reviews a[href*="google.com/maps"]').forEach((link) => { link.href = safe; });
  }

  function trimReview(text) {
    return text.length > 220 ? `${text.slice(0, 217).trim()}...` : text;
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return url.protocol === "https:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function serviceRow(service, category) {
    const prices = splitValue(service.price);
    const durations = splitDuration(service.duration);
    const tags = benefitTags(service, category);
    const description = service.longDescription || service.description;
    const searchText = [service.name, service.technique, service.description, service.goodFor, category, ...tags].join(" ").toLowerCase();
    return `
      <details class="service-row" id="${slug(service.name)}" data-service-item data-search-text="${escapeHtml(searchText)}" data-stagger-item>
        <summary>
          <span class="service-row__identity">${service.editorialSubtitle ? `<span class="service-row__subtitle">${escapeHtml(service.editorialSubtitle)}</span>` : ""}<span class="service-row__name">${escapeHtml(service.name)}${service.tag ? `<small>${escapeHtml(service.tag)}</small>` : ""}</span><span class="service-row__technique">${escapeHtml(service.technique)}</span><span class="service-row__summary">${escapeHtml(service.description)}</span></span>
          <span class="service-row__book"><span class="service-row__prices">${priceColumn(prices[0], durations[0])}${prices[1] || durations[1] ? priceColumn(prices[1] || "-", durations[1] || "-") : ""}</span><span class="service-row__more"><span class="service-row__more-closed">Know more</span><span class="service-row__more-open">Show less</span><span class="service-row__toggle" aria-hidden="true"></span></span></span>
        </summary>
        <div class="service-row__detail">${description !== service.description ? `<p>${escapeHtml(description)}</p>` : ""}${tags.length ? `<div class="service-tags" aria-label="Good for">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}<a class="button button--primary button--arrow service-row__cta" href="tel:+919792710010">Call to book <span aria-hidden="true">→</span></a></div>
      </details>`;
  }

  function benefitTags(service, category) {
    if (!["Specials", "Massages", "Foot Reflexology", "Head Massage"].includes(category)) return [];
    const parts = String(service.goodFor || "")
      .replace(/[.]$/, "")
      .split(/,|\s+and\s+/i)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3);
    return parts.map((item) => item.replace(/\b\w/g, (letter) => letter.toUpperCase()));
  }

  function initCarousel(root) {
    if (!root) return;
    const track = root.querySelector("[data-carousel-track]");
    const previous = root.querySelector("[data-carousel-prev]");
    const next = root.querySelector("[data-carousel-next]");
    if (!track || !previous || !next) return;
    if (root._coralCarouselAbort) root._coralCarouselAbort.abort();
    if (root._coralCarouselTimer) clearTimeout(root._coralCarouselTimer);
    track.querySelectorAll("[data-carousel-clone]").forEach((node) => node.remove());
    const slides = Array.from(track.children);
    const controller = new AbortController();
    const listenerOptions = { signal: controller.signal };
    root._coralCarouselAbort = controller;
    root.dataset.carouselReady = "false";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const interval = Number(root.dataset.carouselInterval || 5500);
    const toggle = root.querySelector("[data-carousel-toggle]");
    const toggleLabel = root.querySelector("[data-carousel-toggle-label]");
    const status = root.querySelector("[data-carousel-status]");
    let realIndex = 0;
    let trackIndex = 0;
    let cloneCount = 0;
    let timer = null;
    let explicitlyPaused = false;
    let focusPaused = false;
    let motionActive = root.dataset.motionActive === "true";
    let pointerStart = null;

    const columns = () => Number(getComputedStyle(root).getPropertyValue("--carousel-columns")) || 1;
    const translate = (animate = true) => {
      track.style.transitionDuration = animate ? "" : "0ms";
      const item = track.firstElementChild;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      const distance = item ? (item.getBoundingClientRect().width + gap) * trackIndex : 0;
      track.style.transform = `translate3d(${-distance}px, 0, 0)`;
      root.dataset.carouselIndex = String(realIndex);
      if (status) status.textContent = slides.length ? `${realIndex + 1} / ${slides.length}` : "";
    };
    const build = () => {
      track.querySelectorAll("[data-carousel-clone]").forEach((node) => node.remove());
      cloneCount = slides.length > columns() ? Math.min(columns(), slides.length) : 0;
      if (cloneCount) {
        slides.slice(-cloneCount).reverse().forEach((slide) => { const clone = slide.cloneNode(true); clone.dataset.carouselClone = "true"; clone.setAttribute("aria-hidden", "true"); clone.inert = true; track.prepend(clone); });
        slides.slice(0, cloneCount).forEach((slide) => { const clone = slide.cloneNode(true); clone.dataset.carouselClone = "true"; clone.setAttribute("aria-hidden", "true"); clone.inert = true; track.append(clone); });
      }
      trackIndex = cloneCount + realIndex;
      const disabled = slides.length <= columns();
      previous.disabled = disabled;
      next.disabled = disabled;
      if (toggle) toggle.disabled = disabled;
      root.dataset.carouselIndex = String(realIndex);
      if (status) status.textContent = slides.length ? `${realIndex + 1} / ${slides.length}` : "";
      requestAnimationFrame(() => translate(false));
    };
    const updatePlaybackUi = () => {
      const playing = !explicitlyPaused && !focusPaused && motionActive && !reduceMotion.matches && !document.hidden && slides.length > columns();
      root.dataset.carouselPlaying = String(playing);
      if (!toggle) return;
      toggle.setAttribute("aria-pressed", String(explicitlyPaused));
      toggle.setAttribute("aria-label", explicitlyPaused ? "Resume carousel" : "Pause carousel");
      if (toggleLabel) toggleLabel.textContent = explicitlyPaused ? "Play" : "Pause";
    };
    const stop = () => { if (timer) clearTimeout(timer); timer = null; root._coralCarouselTimer = null; };
    const schedule = () => {
      updatePlaybackUi();
      if (explicitlyPaused || focusPaused || !motionActive || reduceMotion.matches || document.hidden || slides.length <= columns()) { stop(); return; }
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        root._coralCarouselTimer = null;
        if (!reduceMotion.matches && !explicitlyPaused && !focusPaused && motionActive && !document.hidden) move(1);
      }, interval);
      root._coralCarouselTimer = timer;
    };
    const move = (direction) => {
      if (slides.length <= columns()) return;
      realIndex = (realIndex + direction + slides.length) % slides.length;
      trackIndex += direction;
      translate(true);
      schedule();
    };
    track.addEventListener("transitionend", () => {
      if (!cloneCount) return;
      if (trackIndex >= cloneCount + slides.length) trackIndex = cloneCount;
      if (trackIndex < cloneCount) trackIndex = cloneCount + slides.length - 1;
      translate(false);
    }, listenerOptions);
    previous.addEventListener("click", () => move(-1), listenerOptions);
    next.addEventListener("click", () => move(1), listenerOptions);
    if (toggle) toggle.addEventListener("click", () => { explicitlyPaused = !explicitlyPaused; explicitlyPaused ? stop() : schedule(); updatePlaybackUi(); }, listenerOptions);
    root.addEventListener("focusin", () => { focusPaused = true; stop(); updatePlaybackUi(); }, listenerOptions);
    root.addEventListener("focusout", (event) => { if (!root.contains(event.relatedTarget)) { focusPaused = false; schedule(); } }, listenerOptions);
    root.addEventListener("pointerdown", (event) => { pointerStart = event.clientX; }, listenerOptions);
    root.addEventListener("pointerup", (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
    }, listenerOptions);
    root.addEventListener("coral:motion-active", () => { motionActive = true; schedule(); }, listenerOptions);
    root.addEventListener("coral:motion-inactive", () => { motionActive = false; stop(); updatePlaybackUi(); }, listenerOptions);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : schedule(), listenerOptions);
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 120); }, listenerOptions);
    const motionChange = () => reduceMotion.matches ? stop() : schedule();
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", motionChange); else reduceMotion.addListener(motionChange);
    build();
    root.dataset.carouselReady = "true";
    schedule();
  }

  function initTeamSection() {
    const root = document.querySelector("[data-team-section]");
    if (!root) return;
    const track = root.querySelector("[data-carousel-track]");
    const empty = root.querySelector("[data-team-empty]");
    const team = Array.isArray(window.CORAL_TEAM) ? window.CORAL_TEAM.filter((member) => member.isActive !== false).sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)) : [];
    if (!team.length) {
      if (empty) empty.hidden = false;
      const viewport = root.querySelector(".content-carousel__viewport");
      const controls = root.querySelector(".carousel-controls");
      if (viewport) viewport.hidden = true;
      if (controls) controls.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    const controls = root.querySelector(".carousel-controls");
    if (controls) controls.hidden = false;
    track.innerHTML = team.map((member) => {
      const name = member.nickname || member.firstName || "Therapist";
      const initials = name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
      const photo = member.showPhoto && member.photo
        ? `<img src="${escapeHtml(member.photo)}" alt="${escapeHtml(member.photoAlt || `Placeholder portrait for the ${name} therapist profile`)}" width="800" height="1000" loading="lazy" decoding="async">`
        : `<span class="team-card__monogram" aria-hidden="true">${escapeHtml(initials)}</span><span class="visually-hidden">No-photo profile for ${escapeHtml(name)}</span>`;
      const credentials = Array.isArray(member.certifications) ? member.certifications.slice(0, 4) : [];
      const specializations = Array.isArray(member.specializations) ? member.specializations.slice(0, 3) : [];
      const specialistTitle = member.specialistTitle || (specializations[0] ? `${specializations[0]} Specialist` : "Wellness Specialist");
      return `<article class="team-card glass-panel" data-stagger-item><div class="stagger-motion-layer"><div class="team-card__media">${photo}</div><div class="team-card__copy"><span class="team-card__status">${escapeHtml(specialistTitle)}</span><h3>${escapeHtml(name)}</h3>${member.experienceYears ? `<span class="team-card__experience">${escapeHtml(member.experienceYears)} years of experience</span>` : ""}${credentials.length ? `<ul>${credentials.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}${specializations.length ? `<p class="team-card__meta"><strong>Known for:</strong> ${escapeHtml(specializations.join(", "))}</p>` : ""}${Array.isArray(member.languages) ? `<p class="team-card__meta"><strong>Languages:</strong> ${escapeHtml(member.languages.join(", "))}</p>` : ""}${member.bio ? `<p class="team-card__bio">${escapeHtml(member.bio)}</p>` : ""}</div></div></article>`;
    }).join("");
    refreshDynamicContent(root);
    requestAnimationFrame(() => requestAnimationFrame(() => initCarousel(root)));
  }

  function initRequestForms() {
    document.querySelectorAll("[data-interest-form]").forEach((form) => {
      const select = form.querySelector('[name="service"]');
      if (select && services.length && select.options.length === 1) {
        services.forEach((category) => {
          const group = document.createElement("optgroup");
          group.label = category.category;
          category.services.forEach((service) => group.append(new Option(service.name, service.name)));
          select.append(group);
        });
      }
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const status = form.querySelector("[data-form-status]");
        if (status) status.hidden = false;
      });
    });
  }

  function initBackToTop() {
    document.querySelectorAll("[data-back-to-top]").forEach((button) => {
      const update = () => button.classList.toggle("is-visible", window.scrollY > 520);
      update();
      window.addEventListener("scroll", update, { passive: true });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("main-content")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
      });
    });
  }

  function initServiceSearch() {
    const input = document.querySelector("[data-service-search]");
    const clear = document.querySelector("[data-search-clear]");
    const status = document.querySelector("[data-filter-status]");
    const menu = document.querySelector(".services-menu");
    if (!input) return;

    const filter = () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      if (menu) menu.classList.toggle("is-filtering", Boolean(query));
      document.querySelectorAll("[data-service-group]").forEach((group) => {
        let groupVisible = 0;
        const categoryMatch = query && group.dataset.serviceGroup.toLowerCase().includes(query);
        group.querySelectorAll("[data-service-item]").forEach((item) => {
          const match = !query || categoryMatch || item.dataset.searchText.includes(query);
          item.hidden = !match;
          if (match) {
            visible += 1;
            groupVisible += 1;
            if (query) {
              item.dataset.staggerState = "visible";
              item.dataset.revealState = "visible";
            }
          }
        });
        group.hidden = groupVisible === 0;
      });
      if (status) status.textContent = query ? `${visible} treatment${visible === 1 ? "" : "s"} found` : "";
      if (clear) clear.hidden = !query;
    };
    input.addEventListener("input", filter);
    if (clear) clear.addEventListener("click", () => { input.value = ""; filter(); input.focus(); });
    filter();
  }

  function initActiveCategory() {
    if (!("IntersectionObserver" in window)) return;
    const links = new Map(Array.from(document.querySelectorAll("[data-category-link]")).map((link) => [link.dataset.categoryLink, link]));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link, id) => {
        const active = id === visible.target.id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-28% 0px -62%", threshold: [0, 0.1, 0.35] });
    document.querySelectorAll("[data-service-group]").forEach((group) => observer.observe(group));
  }

  function initAnchorNavigation() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.getAttribute("href") === "#") return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      if (target.matches("details")) target.open = true;
      history.pushState(null, "", link.hash);
      target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    });
  }

  function openInitialServiceHash() {
    if (!window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    if (target.matches("details")) target.open = true;
    window.setTimeout(() => target.scrollIntoView({ behavior: "auto", block: "start" }), 0);
  }

  function initCertificateDialog() {
    const dialog = document.getElementById("certificateDialog");
    const open = document.querySelector("[data-certificate-open]");
    const close = document.querySelector("[data-certificate-close]");
    if (!dialog || !open || !close) return;
    let returnFocus = open;

    open.addEventListener("click", () => {
      returnFocus = document.activeElement;
      dialog.showModal();
      close.focus();
    });
    const closeDialog = () => {
      dialog.close();
      window.requestAnimationFrame(() => returnFocus && returnFocus.focus());
    };
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", () => window.requestAnimationFrame(() => returnFocus && returnFocus.focus()));
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')).filter((item) => !item.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function mediaPair(desktop, mobile) { return { desktop, mobile: mobile || desktop }; }
  function videoSlot(name) {
    return {
      valid: false,
      webm: `assets/videos/${name}-desktop.webm`,
      mp4: `assets/videos/${name}-desktop.mp4`
    };
  }
  function categoryVideoAttributes(category) {
    const slot = categoryVideoSlots[category.category];
    if (!slot) return "";
    return `data-category-video-slot data-video-valid="${slot.valid}" data-video-webm="${escapeHtml(slot.webm)}" data-video-mp4="${escapeHtml(slot.mp4)}"`;
  }
  function categoryImage(category) { return categoryImages[category.category] || mediaPair(category.image); }
  function responsiveImageAttributes(media, sizes) {
    return `src="${escapeHtml(media.desktop)}" srcset="${escapeHtml(media.mobile)} 960w, ${escapeHtml(media.desktop)} 1920w" sizes="${escapeHtml(sizes)}"`;
  }
  function categoryHash(category) { return category === "Head Massage" ? "head-massage-category" : slug(category); }
  function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
  function reducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function serviceKeywords(service) {
    if (Array.isArray(service.keywords) && service.keywords.length) return service.keywords;
    return String(service.goodFor || service.technique || "")
      .replace(/\.$/, "").split(/,\s*|\s+and\s+/i).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  }

  function splitValue(value) { return String(value || "-").split("/").map((part) => part.trim()).filter(Boolean); }
  function splitDuration(value) {
    const parts = splitValue(value);
    const unit = String(value || "").match(/\b(Min|Hour|Hours|Hrs)\b/i);
    return parts.map((part) => unit && !new RegExp(`\\b${unit[0]}\\b`, "i").test(part) ? `${part} ${unit[0]}` : part);
  }
  function priceColumn(price, duration) { return `<span><strong>${escapeHtml(formatPrice(price))}</strong><small>${escapeHtml(duration || "-")}</small></span>`; }
  function formatPrice(value) {
    const text = String(value || "-").trim();
    if (/^na$/i.test(text)) return "NA";
    return /^\d/.test(text) ? `₹${text}` : text;
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
})();
