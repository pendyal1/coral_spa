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
  renderServicesMenu();
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
      nav.innerHTML = services.map((category) => `<a href="#${categoryHash(category.category)}" data-category-link="${categoryHash(category.category)}">${escapeHtml(category.category)}</a>`).join("");
    }

    root.innerHTML = services.map((category) => {
      const id = categoryHash(category.category);
      return `
        <section class="service-group" id="${id}" data-service-group="${escapeHtml(category.category)}">
          <header class="service-group__header" data-reveal="fade-up">
            <div><h2>${escapeHtml(category.category)}</h2><p>${escapeHtml(category.intro)}</p></div>
            <figure data-parallax-media><img ${responsiveImageAttributes(categoryImage(category), "(max-width: 720px) 92vw, 34vw")} width="1920" height="1080" loading="lazy" decoding="async" alt=""></figure>
          </header>
          <div class="service-list">${category.services.map((service) => serviceRow(service, category.category)).join("")}</div>
        </section>`;
    }).join("");

    initActiveCategory();
    openInitialServiceHash();
    document.dispatchEvent(new CustomEvent("coral:content-rendered"));
  }

  function serviceRow(service, category) {
    const prices = splitValue(service.price);
    const durations = splitDuration(service.duration);
    const tags = serviceKeywords(service).slice(0, 3);
    const description = service.longDescription || longDescriptions[service.name] || service.description;
    const searchText = [service.name, service.technique, service.description, service.goodFor, category, ...tags].join(" ").toLowerCase();
    return `
      <details class="service-row" id="${slug(service.name)}" data-service-item data-search-text="${escapeHtml(searchText)}" data-reveal="fade-up">
        <summary>
          <span class="service-row__identity"><span class="service-row__name">${escapeHtml(service.name)}${service.tag ? `<small>${escapeHtml(service.tag)}</small>` : ""}</span><span class="service-row__technique">${escapeHtml(service.technique)}</span></span>
          <span class="service-row__prices">${priceColumn(prices[0], durations[0])}${prices[1] || durations[1] ? priceColumn(prices[1] || "-", durations[1] || "-") : ""}</span>
          <span class="service-row__toggle" aria-hidden="true"></span>
        </summary>
        <div class="service-row__detail"><p>${escapeHtml(service.description)}</p><div class="service-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>${description !== service.description ? `<details class="service-more"><summary>Know more</summary><p>${escapeHtml(description)}</p></details>` : ""}<a class="text-link text-link--arrow" href="tel:+919792710010">Call to book <span aria-hidden="true">→</span></a></div>
      </details>`;
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
