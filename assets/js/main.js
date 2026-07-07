(function () {
  const header = document.getElementById("siteHeader") || document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const year = document.querySelector("[data-year]");

  const phoneIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .5 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.5-1 1-1h3.5c.5 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z"/></svg>';

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (header) {
    const updateHeader = () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open");
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("in"));
  }

  const preview = document.querySelector("[data-service-preview]");
  if (preview && window.CORAL_SERVICES) {
    const featured = [
      ["Signature Rituals", "The Heat Ritual"],
      ["Signature Rituals", "The Jet Lag Reset"],
      ["Signature Rituals", "The De-Puff"],
      ["Bodywork", "The Knot Fixer"],
      ["Skin Rituals", "The Glass Skin Facial"],
      ["Hair Spa", "Moroccanoil Hair Reset"]
    ];

    preview.innerHTML = featured
      .map(([categoryName, serviceName]) => {
        const category = window.CORAL_SERVICES.find((item) => item.category === categoryName);
        if (!category) return "";
        const service = category.services.find((item) => item.name === serviceName) || category.services[0];
        return legacyServiceCard(service, category.image);
      })
      .join("");
  }

  const categories = document.querySelector("[data-service-categories]");
  if (categories && window.CORAL_SERVICES) {
    categories.innerHTML = window.CORAL_SERVICES.map(categorySection).join("");
    document.querySelectorAll(".services-list .reveal").forEach((item) => item.classList.add("in"));
  }

  function categorySection(category, categoryIndex) {
    const image = serviceImage(category.services[0], category.image);
    return `
      <section class="svc-group reveal" id="${slug(category.category)}">
        <div class="svc-group-head">
          <div>
            <div class="svc-group-title">${escapeHtml(category.category)}</div>
            <p>${escapeHtml(category.intro)}</p>
          </div>
          <div class="svc-group-image scene">
            <div class="scene-fill" style="background-image:url('${image}')"></div>
          </div>
        </div>
        ${category.services.map((service, serviceIndex) => serviceItem(service, categoryIndex === 0 && serviceIndex === 0)).join("")}
      </section>
    `;
  }

  function serviceItem(service, open) {
    const prices = splitPair(service.price);
    const durations = splitDurations(service.duration);
    const tags = [
      service.goodFor,
      service.technique,
      service.tag || ""
    ]
      .filter(Boolean)
      .slice(0, 3);

    return `
      <details class="svc-item" ${open ? "open" : ""}>
        <summary>
          <div class="svc-title-block">
            <h3>
              ${escapeHtml(service.name)}
              ${service.tag ? `<span class="${service.tag.toLowerCase() === "new" ? "new-tag" : "signature-tag"}">${escapeHtml(service.tag)}</span>` : ""}
            </h3>
            <span>${escapeHtml(service.technique)}</span>
          </div>
          <div class="svc-price">
            ${priceBlock(prices[0], durations[0])}
            ${prices[1] || durations[1] ? priceBlock(prices[1] || "-", durations[1] || "-") : ""}
            <svg class="svc-chevron" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </summary>
        <div class="svc-detail">
          <p>${escapeHtml(service.description)}</p>
          <div class="tags">
            ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </details>
    `;
  }

  function legacyServiceCard(service, fallbackImage) {
    const image = serviceImage(service, fallbackImage);
    return `
      <article class="ritual-card reveal in">
        <span class="ritual-cat">${escapeHtml(service.technique)}</span>
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.description)}</p>
        <span class="${service.tag && service.tag.toLowerCase() === "new" ? "new-tag" : "signature-tag"}">${escapeHtml(service.price)}</span>
        <span class="scene-tag" style="display:none">${escapeHtml(image)}</span>
      </article>
    `;
  }

  function priceBlock(price, duration) {
    return `
      <div class="p">
        <strong>${escapeHtml(price || "-")}</strong>
        <span>${escapeHtml(duration || "-")}</span>
      </div>
    `;
  }

  function splitPair(value) {
    if (!value) return [];
    return String(value)
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function splitDurations(value) {
    const parts = splitPair(value);
    if (parts.length <= 1) return parts;
    const unitMatch = String(value).match(/\b(Min|Hour|Hours|Hrs)\b/i);
    const unit = unitMatch ? unitMatch[0] : "";
    return parts.map((part) => (unit && !new RegExp(`\\b${unit}\\b`, "i").test(part) ? `${part} ${unit}` : part));
  }

  function serviceImage(service, fallbackImage) {
    if (service && service.image) return service.image;
    if (service && service.name) return `assets/images/services/${slug(service.name)}.jpg`;
    return fallbackImage || "assets/images/gallery/coral-spa-main-suite.jpeg";
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  document.querySelectorAll(".btn.call-btn").forEach((button) => {
    if (!button.querySelector("svg")) {
      button.insertAdjacentHTML("afterbegin", phoneIcon);
    }
  });
})();
