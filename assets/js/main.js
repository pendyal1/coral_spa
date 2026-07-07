(function () {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open");
    });
  }

  const year = document.querySelector("[data-year]");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  addCallTouchpoints();

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
        const service = category.services.find((item) => item.name === serviceName) || category.services[0];
        return serviceCard(service, category.category, category.image);
      })
      .join("");
  }

  const categories = document.querySelector("[data-service-categories]");
  if (categories && window.CORAL_SERVICES) {
    categories.innerHTML = window.CORAL_SERVICES.map(categorySection).join("");
  }

  function categorySection(category) {
    const image = serviceImage(category.services[0], category.image);
    return `
      <section class="service-category" id="${slug(category.category)}">
        <div class="category-heading">
          <div>
            <h2>${category.category}</h2>
            <p>${category.intro}</p>
          </div>
          <img src="${image}" alt="${category.category} at Coral Spa" loading="lazy">
        </div>
        <div class="service-grid">
          ${category.services.map((service) => serviceCard(service, category.category, category.image)).join("")}
        </div>
      </section>
    `;
  }

  function serviceImage(service, fallbackImage) {
    if (service.image) return service.image;
    if (service.name) return `assets/images/services/${slug(service.name)}.jpg`;
    return fallbackImage;
  }

  function serviceCard(service, category, image) {
    const tileImage = serviceImage(service, image);
    const cardImage = tileImage;
    return `
      <details class="service-card" style="--card-image: url('${cardImage}')">
        <summary>
          <span class="summary-label">View ritual details</span>
          <img src="${tileImage}" alt="${service.name}" loading="lazy">
          <div class="service-card-body">
            ${service.tag ? `<span class="service-tag">${service.tag}</span>` : ""}
            <h3>${service.name}</h3>
            <p class="service-technique">${service.technique}</p>
            <p>${service.description}</p>
            <div class="service-meta">
              <span>${service.duration}</span>
              <strong>${service.price}</strong>
            </div>
          </div>
        </summary>
        <div class="service-detail">
          <span>Good for</span>
          <p>${service.goodFor}</p>
        </div>
      </details>
    `;
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function addCallTouchpoints() {
    const footer = document.querySelector(".site-footer");
    if (footer && !document.querySelector(".booking-strip")) {
      footer.insertAdjacentHTML(
        "beforebegin",
        `<section class="booking-strip" aria-label="Coral Spa booking details">
          <div class="container booking-strip-inner">
            <div>
              <span class="eyebrow">• CALL FIRST</span>
              <p>Basement, B.K-2 Tower 3/13A, Vishnu Puri, Company Bagh Chauraha, Kanpur-208002</p>
            </div>
            <div class="booking-strip-actions">
              <span>Open daily, 11:30 AM - 9:30 PM</span>
              <a class="btn call-btn" href="tel:+919792710010" aria-label="Call Coral Spa to book">
                <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.3-.3.74-.4 1.13-.27 1.24.41 2.57.63 3.96.63.61 0 1.1.49 1.1 1.1v3.49c0 .61-.49 1.1-1.1 1.1C10.66 21.73 2.27 13.34 2.27 3.5c0-.61.49-1.1 1.1-1.1h3.5c.61 0 1.1.49 1.1 1.1 0 1.39.22 2.72.63 3.96.12.39.03.83-.28 1.13l-1.7 2.2Z"></path></svg>
                Call to Book - 97927 10010
              </a>
            </div>
          </div>
        </section>`
      );
    }

    if (!document.querySelector(".floating-call")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<a class="floating-call" href="tel:+919792710010" aria-label="Call Coral Spa to book">
          <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.3-.3.74-.4 1.13-.27 1.24.41 2.57.63 3.96.63.61 0 1.1.49 1.1 1.1v3.49c0 .61-.49 1.1-1.1 1.1C10.66 21.73 2.27 13.34 2.27 3.5c0-.61.49-1.1 1.1-1.1h3.5c.61 0 1.1.49 1.1 1.1 0 1.39.22 2.72.63 3.96.12.39.03.83-.28 1.13l-1.7 2.2Z"></path></svg>
          <span>Call</span>
        </a>`
      );
    }
  }
})();
