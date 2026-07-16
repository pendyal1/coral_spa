(function () {
  const header = document.getElementById("siteHeader") || document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const year = document.querySelector("[data-year]");
  const serviceNav = document.querySelector("[data-service-nav]");

  const phoneIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .5 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.5-1 1-1h3.5c.5 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z"/></svg>';
  const serviceLongDescriptions = {
    "The Jet Lag Reset": "A recovery-focused Coral Spa ritual for guests arriving tired, heavy or out of rhythm. Swedish-style oil work eases the body first, followed by focused head massage to settle screen fatigue, travel stress and post-flight stiffness.",
    "Lymphatic Drainage": "A light-to-medium rhythmic massage designed to support fluid movement, ease heaviness and help the body feel less stagnant. Pressure is selected by the therapist after a short consult, especially for guests coming in with travel fatigue, heavy legs or water retention.",
    "The Heat Ritual": "Hot Stone Massage combines traditional massage with therapeutic warmth from basalt stones. The stones are placed and moved across energy points to melt muscle tension, unblock tired areas and create a deeply grounded reset.",
    "The Nervous System Reset": "A calming Thai aromatherapy ritual that blends Thai-style pressure, assisted stretching and flowing oil strokes. Seasonal relaxing essential oils help the treatment feel slower, warmer and more restorative.",
    "Swedish Massage": "The most common and best-known Western massage. Ideal for first-time spa guests or anyone who does not get massage often, it helps relieve muscle soreness, stimulate overall circulation and create a relaxing, healing experience.",
    "Thai Oil Therapy": "A blend of Eastern and Western techniques combining Thai-style deep tissue work, yoga-inspired stretching and flowing Swedish oil strokes. Performed with a seasonal blend of relaxing essential oils for body stiffness and long workday fatigue.",
    "Thai Dry Massage": "Also known as Thai yoga massage, this traditional therapy uses passive stretching with gentle and firm pressure along Sen lines to unblock energy flow. No oil is used and loose cotton clothing is provided during the session.",
    "Balinese Massage": "Balinese Massage uses kneading, pressure-point work and stretching along meridian lines. The hands-on treatment helps release soft tissue, reduce stress, support mobility and leave the body feeling lighter.",
    "Deep Tissue Massage": "Deep Tissue Massage is similar to Swedish massage, but uses deeper pressure to release chronic muscle tension. It focuses on the deeper layers of muscle tissue, tendons and fascia to support circulation and deep relaxation.",
    "Hot Stone Massage": "Traditional massage techniques are combined with warmed basalt stones placed on specific energy points. The heat helps release muscle tension, energize the body and create one of the spa's most grounding therapies.",
    "Potli Massage": "Heated herbal pouches are pressed and rolled across the body to support pain relief, muscle relaxation, circulation, detoxification and stress reduction. The warmth and herbal aroma help ease stiffness while encouraging a feeling of overall rejuvenation.",
    "Anti Acne Facial": "Anti Acne Facial supports skin affected by pimples, acne, blackheads and blemishes. The mask helps reduce inflammation caused by acne bacteria, supports clearer-looking skin and helps prevent visible scar formation.",
    "Anti-Ageing Facial": "This facial replenishes the skin with ingredients often lost during natural ageing, including collagen, vitamin C and hyaluronic acid. It helps soften fine lines, improve firmness and give mature skin a rested look.",
    "Brightening Party Glow Facial": "Recommended for tanned or dull skin, this facial uses brightening botanicals such as liquorice, dandelion and carrot. It helps nourish the skin, soothe the complexion and create a radiant event-ready glow.",
    "Gold Facial": "Gold-infused products are used to support skin radiance and firmness. This ritual is chosen for occasion prep, visible glow and a polished finish.",
    "Signature Facial": "A custom facial tailored to the guest's skin needs. The therapist may combine different techniques, masks and products depending on the condition of the skin and the result desired.",
    "Clean-up": "A mini cleanup facial to lighten, refresh and remove impurities from the face. It is suitable for all skin types and works well as regular monthly maintenance.",
    "Apple and Honey Scrub": "Apple fruit acids gently exfoliate while honey draws moisture into the skin. Rich in antioxidants and enzymes, this scrub buffs away dead cells, unclogs pores and leaves the skin smooth, radiant and refreshed.",
    "Sandalwood": "Recommended for oily and acne-prone skin, sandalwood has a de-tanning and antibacterial effect. The fragrance is calm and holistic, leaving the body feeling purified and refreshed.",
    "Chocolate Scrub": "Chocolate is rich in antioxidants, vitamins and minerals. This scrub supports exfoliation, circulation, skin softness and a mood-lifting sense of indulgence without heaviness.",
    "Lavender Scrub": "Lavender gently hydrates and soothes irritated skin. Its antimicrobial nature supports acne-prone skin, while the aroma is known for calming the mind and easing stress.",
    "Chocolate Wrap": "A warm chocolate body mask rich in antioxidants to soften, moisturize and give the skin a silky glow. The treatment feels indulgent while supporting radiance and comfort.",
    "Clay Wrap": "A mineral-rich mask made with pure clay and marine mud to improve texture and tone. The body is wrapped to support warmth, circulation and mineral absorption.",
    "Thai Foot": "Traditional Thai foot therapy using manual and stick techniques to ease tension in the feet and calves. Guests settle into reclining foot chairs and leave with a lighter step.",
    "Thai Foot Spa": "An extended Thai foot therapy using manual and stick techniques for the foot and calf area. It is a Coral Spa speciality for tired feet, standing work and travel fatigue.",
    "Head Massage": "Head Massage, or Champi, is rooted in India's traditional healing arts. Strong strokes and pressure on head trigger points help quickly ease stress and bring a focused reset.",
    "De-stress Massage": "A focused therapy for shoulder, neck and back tension. It is suited to corporate guests, long drives and extended computer work where trigger-point relief is needed quickly.",
    "Face": "A focused face de-tan treatment for skin affected by sunlight and pollution. It helps refresh dullness and support a clearer, more even look.",
    "Face, Neck and Arms": "A de-tan package for the areas most exposed to sun and pollution. It works well when tanning is visible across the face, neck and arms.",
    "Whole Body": "A full-body de-tan therapy that helps skin affected by sun exposure and pollution. It is designed as a value-led option for uneven tone across the body.",
    "Regular Manicure": "A classic manicure with nail trimming, shaping, cuticle care, hand soak, hand massage and polish if desired.",
    "Spa Manicure": "A richer hand ritual with exfoliation, hydrating mask or wrap, extended massage and aromatherapy for added relaxation and indulgence.",
    "Regular Pedicure": "A classic pedicure with warm soak, nail trimming and shaping, cuticle care, exfoliation, callus removal, foot massage and polish if desired.",
    "Spa Pedicure": "A luxury pedicure with additional aromatherapy, hot towel wraps and extended massage for tired feet and a more relaxed finish.",
    "Intense Hydrating Spa": "A hair and scalp treatment focused on deep hydration and moisturization. It benefits dry, damaged or frizzy hair that needs softness and comfort.",
    "Repair and Restore Hair Spa": "Protein-rich products help rebuild and fortify the hair shaft, reducing breakage and improving resilience, elasticity and overall hair health.",
    "Smoothing Hair Spa": "A deep smoothing spa enriched with conditioning protein to nourish the hair, improve elasticity and create a softer finish.",
    "Volumizing Hair Spa": "A volume-focused hair spa aimed at adding body, thickness and lift. It supports flat hair with product-led care and styling techniques for fuller-looking hair."
  };

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
      ["Signature Rituals", "Lymphatic Drainage"],
      ["Bodywork", "The Knot Fixer"],
      ["Skin Rituals", "The Glass Skin Facial"],
      ["Hair Spa", "Moroccan Oil Hair Reset"]
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

  if (serviceNav && window.CORAL_SERVICES) {
    serviceNav.innerHTML = window.CORAL_SERVICES.map(serviceNavTile).join("");
  }

  initGoogleReviews();

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      if (target.matches(".svc-item")) {
        target.open = true;
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        navToggle && navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target && target.matches(".svc-item")) {
      target.open = true;
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  function serviceNavTile(category) {
    const image = category.image || serviceImage(category.services[0]);
    return `
      <a class="service-nav-tile" href="#${slug(category.category)}" style="--tile-image:url('${escapeHtml(image)}')">
        <span>${escapeHtml(category.category)}</span>
      </a>
    `;
  }

  function categorySection(category, categoryIndex) {
    const image = category.image || serviceImage(category.services[0]);
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
    const tags = keywordTags(service).slice(0, 3);
    const longDescription = service.longDescription || serviceLongDescriptions[service.name] || service.description;

    return `
      <details class="svc-item" id="${slug(service.name)}" ${open ? "open" : ""}>
        <summary>
          <div class="svc-title-block">
            <h3>
              ${escapeHtml(service.name)}
              ${service.tag ? `<span class="${tagClass(service.tag)}">${escapeHtml(service.tag)}</span>` : ""}
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
          <details class="know-more">
            <summary>Know More</summary>
            <p>${escapeHtml(longDescription)}</p>
          </details>
        </div>
      </details>
    `;
  }

  function keywordTags(service) {
    if (Array.isArray(service.keywords) && service.keywords.length) return service.keywords;
    if (service.goodFor) {
      return String(service.goodFor)
        .replace(/\.$/, "")
        .split(/,\s*|\s+and\s+/i)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return [service.technique || service.tag || "Spa Care"].filter(Boolean);
  }

  function legacyServiceCard(service, fallbackImage) {
    const image = serviceImage(service, fallbackImage);
    return `
      <article class="ritual-card reveal in">
        <span class="ritual-cat">${escapeHtml(service.technique)}</span>
        <h3>${escapeHtml(service.name)}</h3>
        <p>${escapeHtml(service.description)}</p>
        <span class="${tagClass(service.tag || "Signature")}">${escapeHtml(service.price)}</span>
        <span class="scene-tag" style="display:none">${escapeHtml(image)}</span>
      </article>
    `;
  }

  function priceBlock(price, duration) {
    return `
      <div class="p">
        <strong>${escapeHtml(formatPrice(price))}</strong>
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

  function tagClass(value) {
    const normalized = String(value).toLowerCase();
    if (normalized.includes("new")) return "new-tag";
    if (normalized.includes("trending")) return "service-tag";
    return "signature-tag";
  }

  function formatPrice(value) {
    const text = String(value || "-").trim();
    if (!text || text === "-") return "-";
    if (/^na$/i.test(text)) return "NA";
    if (/^₹/.test(text)) return text;
    if (/^\d/.test(text)) return `₹${text}`;
    return text;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function initGoogleReviews() {
    const reviewRoots = document.querySelectorAll("[data-google-reviews]");
    if (!reviewRoots.length) return;

    const config = window.CORAL_GOOGLE_REVIEWS || {};
    const mapsUrl = config.mapsUrl || "https://www.google.com/maps/search/?api=1&query=Coral%20Spa%20Kanpur";

    if (config.endpoint) {
      try {
        const response = await fetch(config.endpoint, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Reviews endpoint failed");
        const payload = await response.json();
        const reviews = normalizeReviews(payload.reviews || payload).filter(isFiveStarReview).sort(newestFirst).slice(0, 5);
        renderGoogleReviews(reviewRoots, reviews, mapsUrl);
        return;
      } catch (error) {
        renderGoogleReviewNotice(reviewRoots, mapsUrl);
        return;
      }
    }

    if (!config.apiKey) {
      renderGoogleReviewNotice(reviewRoots, mapsUrl);
      return;
    }

    try {
      await loadGoogleMaps(config.apiKey);
      const place = await resolveGooglePlace(config);
      await place.fetchFields({ fields: ["displayName", "googleMapsURI", "rating", "userRatingCount", "reviews"] });
      const liveMapsUrl = place.googleMapsURI || mapsUrl;
      const reviews = normalizeReviews(place.reviews || []).filter(isFiveStarReview).sort(newestFirst).slice(0, 5);
      renderGoogleReviews(reviewRoots, reviews, liveMapsUrl);
    } catch (error) {
      renderGoogleReviewNotice(reviewRoots, mapsUrl);
    }
  }

  function loadGoogleMaps(apiKey) {
    if (window.google && window.google.maps && window.google.maps.importLibrary) {
      return Promise.resolve();
    }

    if (window.__coralGoogleMapsPromise) {
      return window.__coralGoogleMapsPromise;
    }

    window.__coralGoogleMapsPromise = new Promise((resolve, reject) => {
      const callbackName = `coralGoogleMapsReady_${Date.now()}`;
      window[callbackName] = () => {
        delete window[callbackName];
        resolve();
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        delete window[callbackName];
        reject(new Error("Google Maps could not load"));
      };
      document.head.appendChild(script);
    });

    return window.__coralGoogleMapsPromise;
  }

  async function resolveGooglePlace(config) {
    const { Place } = await window.google.maps.importLibrary("places");
    if (config.placeId) {
      return new Place({ id: config.placeId });
    }

    const query = config.placeQuery || "Coral Spa Kanpur";
    const result = await Place.searchByText({
      textQuery: query,
      fields: ["id", "displayName", "googleMapsURI"],
      maxResultCount: 1
    });
    const place = result.places && result.places[0];
    if (!place) throw new Error("Google place not found");
    return place;
  }

  function normalizeReviews(reviews) {
    if (!Array.isArray(reviews)) return [];
    return reviews.map((review) => {
      const author = review.authorAttribution || review.author || {};
      const text = typeof review.text === "object" && review.text ? review.text.text : review.text;
      return {
        authorName: author.displayName || review.authorName || "Google reviewer",
        authorUrl: author.uri || review.authorUrl || "",
        rating: Number(review.rating || 0),
        text: text || "",
        publishTime: review.publishTime || review.relativePublishTimeDescription || review.time || "",
        relativeTime: review.relativePublishTimeDescription || review.relativeTime || ""
      };
    });
  }

  function isFiveStarReview(review) {
    return Number(review.rating) === 5;
  }

  function newestFirst(a, b) {
    return reviewTimeValue(b.publishTime) - reviewTimeValue(a.publishTime);
  }

  function reviewTimeValue(value) {
    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
  }

  function renderGoogleReviews(reviewRoots, reviews, mapsUrl) {
    const reviewCards = reviews.map(reviewCard);
    const cards = reviewCards.length
      ? [...reviewCards, ...reviewCards].join("")
      : googleReviewNoticeCard(mapsUrl);
    reviewRoots.forEach((root) => {
      root.innerHTML = cards;
      root.classList.toggle("is-scrollable", reviewCards.length > 1);
    });
  }

  function renderGoogleReviewNotice(reviewRoots, mapsUrl) {
    reviewRoots.forEach((root) => {
      root.innerHTML = googleReviewNoticeCard(mapsUrl);
      root.classList.remove("is-scrollable");
    });
  }

  function googleReviewNoticeCard(mapsUrl) {
    return `
      <article class="review-card google-review-empty">
        <div class="stars" aria-label="5 stars">★★★★★</div>
        <p>Live Google reviews will appear here once the Coral Spa Google Places connection is configured.</p>
        <a class="google-badge" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noreferrer">Open Google Reviews</a>
      </article>
    `;
  }

  function reviewCard(review) {
    const author = review.authorUrl
      ? `<a href="${escapeHtml(review.authorUrl)}" target="_blank" rel="noreferrer">${escapeHtml(review.authorName)}</a>`
      : escapeHtml(review.authorName);
    return `
      <article class="review-card">
        <div class="stars" aria-label="5 stars">★★★★★</div>
        <p>${escapeHtml(trimReview(review.text))}</p>
        <span>${author}${review.relativeTime ? ` · ${escapeHtml(review.relativeTime)}` : ""}</span>
      </article>
    `;
  }

  function trimReview(text) {
    const clean = String(text || "Five-star Coral Spa guest review.").trim();
    return clean.length > 190 ? `${clean.slice(0, 187).trim()}...` : clean;
  }

  document.querySelectorAll(".btn.call-btn").forEach((button) => {
    if (!button.querySelector("svg")) {
      button.insertAdjacentHTML("afterbegin", phoneIcon);
    }
  });
})();
