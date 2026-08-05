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

  const longDescriptions = {
    "The Jet Lag Reset": "A recovery-focused Coral Spa ritual for guests arriving tired, heavy or out of rhythm. Swedish-style oil work eases the body first, followed by focused head massage to settle screen fatigue, travel stress and post-flight stiffness.",
    "Lymphatic Drainage": "A light-to-medium rhythmic massage designed to support fluid movement, ease heaviness and help the body feel less stagnant. Pressure is selected by the therapist after a short consult.",
    "The Heat Ritual": "Hot Stone Massage combines traditional massage with therapeutic warmth from basalt stones. The stones are placed and moved across energy points to melt muscle tension and create a grounded reset.",
    "The Nervous System Reset": "A calming Thai aromatherapy ritual blending Thai-style pressure, assisted stretching and flowing oil strokes, paced to feel slower and restorative."
  };

  initYear();
  initHeader();
  initNavigation();
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
  }

  function renderServicesMenu() {
    const root = document.querySelector("[data-service-categories]");
    const nav = document.querySelector("[data-service-nav]");
    if (!root || !services.length) return;

    if (nav) {
      nav.innerHTML = services.map((category) => {
        const id = categoryHash(category.category);
        return `<a class="service-nav-tile" href="#${id}" data-category-link="${id}"><img ${responsiveImageAttributes(categoryImage(category), "(max-width: 719px) 46vw, (max-width: 1279px) 18vw, 9vw")} width="960" height="1200" loading="lazy" decoding="async" alt=""><span>${escapeHtml(category.category)}</span></a>`;
      }).join("");
    }

    root.innerHTML = services.map((category, categoryIndex) => {
      const id = categoryHash(category.category);
      const surfaces = ["surface-smoked-glass", "surface-pebble", "surface-deep-wood"];
      return `
        <section class="service-group ${surfaces[categoryIndex % surfaces.length]}" id="${id}" data-service-group="${escapeHtml(category.category)}">
          <header class="service-group__header" data-reveal="fade-up">
            <div><h2>${escapeHtml(category.category)}</h2><p>${escapeHtml(category.intro)}</p></div>
            <figure class="category-media" ${categoryVideoAttributes(category)}><img ${responsiveImageAttributes(categoryImage(category), "(max-width: 720px) 92vw, 34vw")} width="1920" height="1080" loading="lazy" decoding="async" alt=""></figure>
          </header>
          <div class="service-list">${category.services.map((service) => serviceRow(service, category.category)).join("")}</div>
        </section>`;
    }).join("");

    initActiveCategory();
    openInitialServiceHash();
    document.dispatchEvent(new CustomEvent("coral:content-rendered"));
  }

  function initGalleryShowcase() {
    const root = document.querySelector("[data-gallery-showcase]");
    if (!root) return;
    const focus = root.querySelector("[data-gallery-focus]");
    const focusSource = root.querySelector("[data-gallery-focus-source]");
    const focusImage = root.querySelector("[data-gallery-focus-image]");
    const caption = root.querySelector("[data-gallery-caption]");
    const thumbs = Array.from(root.querySelectorAll("[data-gallery-thumb]"));
    if (!focus || !focusSource || !focusImage || !caption || thumbs.length !== 4) return;

    const readItem = (element) => ({
      src: element.dataset.gallerySrc,
      small: element.dataset.gallerySmall,
      large: element.dataset.galleryLarge,
      caption: element.dataset.galleryCaption,
      alt: element.dataset.galleryAlt
    });
    const items = [readItem(focus), ...thumbs.map(readItem)];
    thumbs.forEach((button, index) => { button.dataset.galleryIndex = String(index + 1); });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let focusedIndex = 0;
    let timer = null;
    let paused = false;
    let manualResumeAt = 0;

    let renderToken = 0;

    const decodeImage = (src) => new Promise((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate.currentSrc || candidate.src);
      candidate.onerror = reject;
      candidate.src = src;
      if (candidate.decode) candidate.decode().then(() => resolve(candidate.currentSrc || candidate.src)).catch(() => {});
    });

    const loadGalleryItem = async (item) => {
      const preferred = window.matchMedia("(max-width: 899px)").matches ? item.small : item.large;
      try {
        return { url: await decodeImage(preferred), isWebp: true };
      } catch (error) {
        return { url: await decodeImage(item.src), isWebp: false };
      }
    };

    const render = async (nextIndex) => {
      const requestedIndex = (nextIndex + items.length) % items.length;
      if (requestedIndex === focusedIndex) return true;
      const focused = items[requestedIndex];
      const token = ++renderToken;
      let loadedSource;
      try {
        loadedSource = await loadGalleryItem(focused);
      } catch (error) {
        return false;
      }
      if (token !== renderToken) return false;

      root.classList.add("is-changing");
      focusedIndex = requestedIndex;
      root.dataset.galleryIndex = String(focusedIndex);
      focus.dataset.gallerySrc = focused.src;
      focus.dataset.gallerySmall = focused.small;
      focus.dataset.galleryLarge = focused.large;
      focus.dataset.galleryCaption = focused.caption;
      focus.dataset.galleryAlt = focused.alt;
      focusSource.srcset = loadedSource.isWebp ? loadedSource.url : "";
      focusImage.src = focused.src;
      focusImage.alt = focused.alt;
      caption.textContent = focused.caption;

      const remaining = items.map((item, index) => ({ item, index })).filter(({ index }) => index !== focusedIndex);
      thumbs.forEach((button, slot) => {
        const { item, index } = remaining[slot];
        const image = button.querySelector("img");
        const label = button.querySelector("span");
        button.dataset.galleryIndex = String(index);
        button.dataset.gallerySrc = item.src;
        button.dataset.gallerySmall = item.small;
        button.dataset.galleryLarge = item.large;
        button.dataset.galleryCaption = item.caption;
        button.dataset.galleryAlt = item.alt;
        button.setAttribute("aria-label", `Show ${item.caption}`);
        button.setAttribute("aria-pressed", "false");
        image.src = item.small;
        label.textContent = item.caption;
      });
      window.requestAnimationFrame(() => root.classList.remove("is-changing"));
      return true;
    };

    const stop = () => {
      if (timer) window.clearTimeout(timer);
      timer = null;
    };
    const schedule = (minimumDelay = 5500) => {
      stop();
      if (paused || reduceMotion.matches || document.hidden) return;
      const delay = Math.max(minimumDelay, manualResumeAt - Date.now());
      timer = window.setTimeout(async () => {
        const changed = await render(focusedIndex + 1);
        if (!changed) paused = true;
        schedule(5500);
      }, delay);
    };
    const select = async (index, manual) => {
      if (manual) manualResumeAt = Date.now() + 10000;
      await render(index);
      schedule(manual ? 10000 : 5500);
    };

    thumbs.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.galleryIndex), true)));
    root.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      select(focusedIndex + (event.key === "ArrowRight" ? 1 : -1), true);
    });
    root.addEventListener("mouseenter", () => { paused = true; stop(); });
    root.addEventListener("mouseleave", () => { paused = false; schedule(); });
    root.addEventListener("focusin", () => { paused = true; stop(); });
    root.addEventListener("focusout", (event) => {
      if (root.contains(event.relatedTarget)) return;
      paused = false;
      schedule();
    });
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : schedule());
    const handleMotionChange = () => reduceMotion.matches ? stop() : schedule();
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", handleMotionChange);
    else reduceMotion.addListener(handleMotionChange);

    schedule();
    root.dataset.galleryIndex = "0";
  }

  async function initGoogleReviews() {
    const roots = Array.from(document.querySelectorAll("[data-google-reviews]"));
    if (!roots.length) return;
    const config = window.CORAL_GOOGLE_REVIEWS || {};
    const mapsUrl = config.mapsUrl || "https://www.google.com/maps/search/?api=1&query=Coral%20Spa%20B.K-2%20Tower%203%2F13A%20Vishnu%20Puri%20Kanpur";

    try {
      let reviews = [];
      let liveMapsUrl = mapsUrl;
      if (config.endpoint) {
        const response = await fetch(config.endpoint, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Reviews endpoint returned an unsuccessful response");
        const payload = await response.json();
        reviews = normalizeReviews(payload.reviews || payload);
        liveMapsUrl = payload.mapsUrl || mapsUrl;
      } else if (config.apiKey) {
        await loadGoogleMaps(config.apiKey);
        const place = await resolveGooglePlace(config);
        await place.fetchFields({ fields: ["displayName", "googleMapsURI", "rating", "userRatingCount", "reviews"] });
        reviews = normalizeReviews(place.reviews || []);
        liveMapsUrl = place.googleMapsURI || mapsUrl;
      } else {
        renderGoogleReviewFallback(roots, mapsUrl, new Error("Live review configuration is not available"));
        return;
      }

      const sortedReviews = reviews.sort(newestReviewFirst);
      if (!sortedReviews.length) throw new Error("No reviews were returned");
      const highRatedReviews = sortedReviews.filter((review) => review.rating >= 4);
      const selectedReviews = (highRatedReviews.length >= 3 ? highRatedReviews : sortedReviews).slice(0, 5);
      renderGoogleReviews(roots, selectedReviews, liveMapsUrl);
    } catch (error) {
      renderGoogleReviewFallback(roots, mapsUrl, error);
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
      return `<article class="review-card glass-panel"><div class="review-card__stars" aria-label="${rating} out of 5 stars">${stars}</div>${review.text ? `<p>${escapeHtml(trimReview(review.text))}</p>` : ""}<span>${author}${review.relativeTime ? ` · ${escapeHtml(review.relativeTime)}` : ""}</span></article>`;
    }).join("");
    roots.forEach((root) => {
      root.innerHTML = cards;
      root.dataset.reviewState = "ready";
      root.setAttribute("aria-busy", "false");
      initCarousel(root.closest("[data-carousel]"));
    });
    updateGoogleReviewLinks(mapsUrl);
  }

  function renderGoogleReviewFallback(roots, mapsUrl, error) {
    const diagnostic = isDevelopmentHost() && error ? `<p class="review-diagnostic" role="status">Review diagnostic: ${escapeHtml(error.message || "Live review loading failed")}</p>` : "";
    const card = `<article class="review-card review-card--fallback glass-panel"><div class="review-card__stars" aria-hidden="true">★★★★★</div><p>Open Coral Spa’s Google listing to read the latest reviews and ratings directly from the source.</p><span><a href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener noreferrer">Open Google Reviews</a></span>${diagnostic}</article>`;
    roots.forEach((root) => {
      root.innerHTML = card;
      root.dataset.reviewState = "fallback";
      root.setAttribute("aria-busy", "false");
      const carousel = root.closest("[data-carousel]");
      const controls = carousel && carousel.querySelector(".carousel-controls");
      if (controls) controls.hidden = true;
    });
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
    const description = service.longDescription || longDescriptions[service.name] || service.description;
    const searchText = [service.name, service.technique, service.description, service.goodFor, category, ...tags].join(" ").toLowerCase();
    return `
      <details class="service-row" id="${slug(service.name)}" data-service-item data-search-text="${escapeHtml(searchText)}" data-reveal="fade-up">
        <summary>
          <span class="service-row__identity">${service.editorialSubtitle ? `<span class="service-row__subtitle">${escapeHtml(service.editorialSubtitle)}</span>` : ""}<span class="service-row__name">${escapeHtml(service.name)}${service.tag ? `<small>${escapeHtml(service.tag)}</small>` : ""}</span><span class="service-row__technique">${escapeHtml(service.technique)}</span></span>
          <span class="service-row__prices">${priceColumn(prices[0], durations[0])}${prices[1] || durations[1] ? priceColumn(prices[1] || "-", durations[1] || "-") : ""}</span>
          <span class="service-row__toggle" aria-hidden="true"></span>
        </summary>
        <div class="service-row__detail"><p>${escapeHtml(service.description)}</p>${tags.length ? `<div class="service-tags" aria-label="Good for">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}${description !== service.description ? `<details class="service-more"><summary>Know more</summary><p>${escapeHtml(description)}</p></details>` : ""}<a class="text-link text-link--arrow" href="tel:+919792710010">Call to book <span aria-hidden="true">→</span></a></div>
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
    if (!root || root.dataset.carouselReady === "true") return;
    const track = root.querySelector("[data-carousel-track]");
    const previous = root.querySelector("[data-carousel-prev]");
    const next = root.querySelector("[data-carousel-next]");
    if (!track || !previous || !next) return;
    root.dataset.carouselReady = "true";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const interval = Number(root.dataset.carouselInterval || 5500);
    let index = 0;
    let timer = null;
    let paused = false;
    let pointerStart = null;

    const columns = () => Number(getComputedStyle(root).getPropertyValue("--carousel-columns")) || 1;
    const maximum = () => Math.max(0, track.children.length - columns());
    const update = (nextIndex) => {
      index = Math.max(0, Math.min(maximum(), nextIndex));
      if (nextIndex > maximum()) index = 0;
      if (nextIndex < 0) index = maximum();
      const item = track.firstElementChild;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      const distance = item ? (item.getBoundingClientRect().width + gap) * index : 0;
      track.style.transform = `translate3d(${-distance}px, 0, 0)`;
      root.dataset.carouselIndex = String(index);
      previous.disabled = maximum() === 0;
      next.disabled = maximum() === 0;
    };
    const stop = () => { if (timer) clearTimeout(timer); timer = null; };
    const schedule = () => {
      stop();
      if (paused || reduceMotion.matches || document.hidden || maximum() === 0) return;
      timer = setTimeout(() => { update(index + 1); schedule(); }, interval);
    };
    const move = (direction) => { update(index + direction); schedule(); };
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    root.addEventListener("mouseenter", () => { paused = true; stop(); });
    root.addEventListener("mouseleave", () => { paused = false; schedule(); });
    root.addEventListener("focusin", () => { paused = true; stop(); });
    root.addEventListener("focusout", (event) => { if (!root.contains(event.relatedTarget)) { paused = false; schedule(); } });
    root.addEventListener("pointerdown", (event) => { pointerStart = event.clientX; });
    root.addEventListener("pointerup", (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1);
    });
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : schedule());
    window.addEventListener("resize", () => update(Math.min(index, maximum())));
    const motionChange = () => reduceMotion.matches ? stop() : schedule();
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", motionChange); else reduceMotion.addListener(motionChange);
    update(0);
    schedule();
  }

  function initTeamSection() {
    const root = document.querySelector("[data-team-section]");
    if (!root) return;
    const track = root.querySelector("[data-carousel-track]");
    const empty = root.querySelector("[data-team-empty]");
    const team = Array.isArray(window.CORAL_TEAM) ? window.CORAL_TEAM : [];
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
      const initials = name.slice(0, 2).toUpperCase();
      const photo = member.showPhoto && member.photo
        ? `<img src="${escapeHtml(member.photo)}" alt="${escapeHtml(name)}, Coral Spa therapist" loading="lazy" decoding="async">`
        : `<span class="team-card__monogram" aria-hidden="true">${escapeHtml(initials)}</span>`;
      const credentials = Array.isArray(member.certifications) ? member.certifications.slice(0, 4) : [];
      const specializations = Array.isArray(member.specializations) ? member.specializations.slice(0, 3) : [];
      return `<article class="team-card glass-panel" data-stagger-item data-reveal="fade-up"><div class="team-card__media">${photo}</div><div class="team-card__copy"><h3>${escapeHtml(name)}</h3>${member.experienceYears ? `<p>${escapeHtml(member.experienceYears)} years of experience</p>` : ""}${credentials.length ? `<ul>${credentials.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}${specializations.length ? `<span>Known for: ${escapeHtml(specializations.join(", "))}</span>` : ""}</div></article>`;
    }).join("");
    document.dispatchEvent(new CustomEvent("coral:content-rendered"));
    initCarousel(root);
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
    if (!input) return;

    const filter = () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll("[data-service-group]").forEach((group) => {
        let groupVisible = 0;
        group.querySelectorAll("[data-service-item]").forEach((item) => {
          const match = !query || item.dataset.searchText.includes(query);
          item.hidden = !match;
          if (match) { visible += 1; groupVisible += 1; }
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
