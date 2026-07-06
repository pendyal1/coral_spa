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

  const preview = document.querySelector("[data-service-preview]");
  if (preview && window.CORAL_SERVICES) {
    const featured = [
      ["Massages", "Thai Oil Therapy"],
      ["Massages", "Deep Tissue Massage"],
      ["Facials", "Signature Facial"],
      ["Massages", "Hot Stone Massage"],
      ["Pedicure", "Spa Pedicure"],
      ["Hair Spa", "Repair and Restore Hair Spa"]
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
    const cardImage = tileImage.replace(/^assets\/images\//, "../images/");
    return `
      <article class="service-card" style="--card-image: url('${cardImage}')">
        <img src="${tileImage}" alt="${service.name}" loading="lazy">
        <div class="service-card-body">
          <h3>${service.name}</h3>
          <p>${service.description}</p>
          <div class="service-meta">
            <span>${service.duration}</span>
            <strong>${service.price}</strong>
          </div>
        </div>
      </article>
    `;
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
})();
