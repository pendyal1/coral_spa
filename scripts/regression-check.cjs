const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const port = 4175;
const debugPort = 9333;
const origin = `http://127.0.0.1:${port}`;
const basePath = "/coral_spa/";
const sizes = [[2560, 1440], [1920, 1080], [1536, 1024], [1440, 900], [1280, 800], [1024, 768], [768, 1024], [430, 932], [390, 844], [375, 812], [320, 568]];
const pages = ["index.html", "about.html", "services.html", "contact.html"];
const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm"
};

const reviewFixture = {
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Coral%20Spa%20Kanpur",
  reviews: [
    { rating: 5, text: "QA review five", authorName: "QA Five", relativeTime: "today", publishTime: "2026-08-05T10:00:00Z" },
    { rating: 4, text: "QA review four", authorName: "QA Four", relativeTime: "today", publishTime: "2026-08-05T09:00:00Z" },
    { rating: 5, text: "QA review recent", authorName: "QA Recent", relativeTime: "1 day ago", publishTime: "2026-08-04T10:00:00Z" },
    { rating: 5, text: "QA review three", authorName: "QA Three", relativeTime: "2 days ago", publishTime: "2026-08-03T10:00:00Z" },
    { rating: 5, text: "QA review two", authorName: "QA Two", relativeTime: "3 days ago", publishTime: "2026-08-02T10:00:00Z" },
    { rating: 5, text: "QA review one", authorName: "QA One", relativeTime: "4 days ago", publishTime: "2026-08-01T10:00:00Z" },
    { rating: 5, text: "QA review older", authorName: "QA Older", relativeTime: "5 days ago", publishTime: "2026-07-31T10:00:00Z" }
  ]
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, origin);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === `${basePath}__test/reviews`) {
    const body = JSON.stringify(reviewFixture);
    response.writeHead(200, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
    response.end(body);
    return;
  }
  if (!pathname.startsWith(basePath)) return respond(response, 404, "Not found");
  pathname = pathname.slice(basePath.length) || "index.html";
  const filename = path.resolve(root, pathname);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) return respond(response, 404, "Not found");
  const stat = fs.statSync(filename);
  const headers = { "Content-Type": mime[path.extname(filename).toLowerCase()] || "application/octet-stream", "Accept-Ranges": "bytes" };
  const range = request.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match && match[1] ? Number(match[1]) : 0;
    const end = match && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    response.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    fs.createReadStream(filename, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, { ...headers, "Content-Length": stat.size });
  fs.createReadStream(filename).pipe(response);
});

function respond(response, status, body) {
  response.writeHead(status, { "Content-Type": "text/plain" });
  response.end(body);
}

function chromePath() {
  const candidates = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      const page = targets.find((target) => target.type === "page" && !target.url.startsWith("chrome-extension://"));
      if (page) return page.webSocketDebuggerUrl;
    } catch (error) {}
    await delay(100);
  }
  throw new Error("Chrome debugging endpoint did not start");
}

function cdp(socketUrl) {
  const socket = new WebSocket(socketUrl);
  let sequence = 0;
  const pending = new Map();
  const listeners = [];
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    listeners.forEach((listener) => listener(message));
  };
  const ready = new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  return {
    ready,
    on: (listener) => listeners.push(listener),
    send(method, params = {}) {
      return new Promise((resolve) => {
        const id = ++sequence;
        pending.set(id, resolve);
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close: () => socket.close()
  };
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function run() {
  const chrome = chromePath();
  if (!chrome) throw new Error("Chrome was not found. Set CHROME_PATH to run regression checks.");
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "coral-regression-"));
  const artifactDir = path.join(root, "artifacts", "regression");
  fs.mkdirSync(artifactDir, { recursive: true });
  const browser = spawn(chrome, [
    "--headless=new", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
    "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "about:blank"
  ], { stdio: "ignore" });
  const failures = [];
  const report = [];

  try {
    const client = cdp(await waitForDebugger());
    await client.ready;
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Network.enable");
    await client.send("Page.addScriptToEvaluateOnNewDocument", { source: `
      if (location.search.includes("reviews-live")) window.CORAL_GOOGLE_REVIEWS = { endpoint: "${basePath}__test/reviews", mapsUrl: "${reviewFixture.mapsUrl}" };
      if (location.search.includes("team-fixture")) window.CORAL_TEAM = Array.from({ length: 6 }, (_, index) => ({ firstName: "Therapist " + (index + 1), certifications: ["Verified modality"], specializations: ["Guest comfort"], experienceYears: index + 2, photo: "", showPhoto: false }));
    ` });
    let localFailures = [];
    let consoleErrors = [];
    let networkStatus = new Map();
    client.on((message) => {
      if (message.method === "Network.responseReceived") {
        const response = message.params.response;
        networkStatus.set(response.url, response.status);
        if (response.url.startsWith(origin) && response.status >= 400) localFailures.push(`${response.status} ${response.url}`);
      }
      if (message.method === "Network.loadingFailed" && !message.params.canceled) localFailures.push(message.params.errorText);
      if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") consoleErrors.push("console.error");
    });

    const evaluate = async (expression) => {
      const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.result.exceptionDetails) {
        const detail = result.result.exceptionDetails.exception && result.result.exceptionDetails.exception.description;
        throw new Error(detail || result.result.exceptionDetails.text);
      }
      return result.result.result.value;
    };

    const navigate = async (url) => {
      networkStatus = new Map();
      await client.send("Page.navigate", { url });
      for (let attempt = 0; attempt < 100; attempt += 1) {
        await delay(100);
        const state = JSON.parse(await evaluate(`JSON.stringify({ href: location.href, ready: document.readyState })`));
        if (state.href === url && (state.ready === "interactive" || state.ready === "complete")) return;
      }
      throw new Error(`DOM readiness timed out after 10 seconds for ${url}`);
    };

    const inspectVideo = async (page) => {
      let diagnostic = {};
      for (let attempt = 0; attempt < 120; attempt += 1) {
        diagnostic = JSON.parse(await evaluate(`JSON.stringify((() => { const root = document.querySelector('[data-video-background]'); const video = root && root.querySelector('video'); return video ? { approved: root.dataset.videoValid === 'true', currentSrc: video.currentSrc, readyState: video.readyState, networkState: video.networkState, errorCode: video.error && video.error.code, duration: Number.isFinite(video.duration) ? video.duration : 0, videoWidth: video.videoWidth, videoHeight: video.videoHeight } : { missing: true }; })())`));
        if (diagnostic.approved === false) return { page, passed: true, posterOnly: true, ...diagnostic, networkStatus: null };
        if (diagnostic.duration > 1 && diagnostic.videoWidth > 0 && diagnostic.videoHeight > 0) return { page, passed: true, ...diagnostic, networkStatus: networkStatus.get(diagnostic.currentSrc) || null };
        await delay(100);
      }
      return { page, passed: false, ...diagnostic, networkStatus: networkStatus.get(diagnostic.currentSrc) || null };
    };

    const captureSection = async (selector, filename) => {
      await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "center" })`);
      await delay(1100);
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      fs.writeFileSync(path.join(artifactDir, filename), Buffer.from(screenshot.result.data, "base64"));
    };

    for (const [width, height] of sizes) {
      for (const page of pages) {
        const label = `${page} ${width}x${height}`;
        localFailures = [];
        consoleErrors = [];
        await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 430 });
        await navigate(`${origin}${basePath}${page}?qa=${width}x${height}`);
        const videoDiagnostic = await inspectVideo(page);
        if (!videoDiagnostic.passed) failures.push(`${label}: hero metadata failed ${JSON.stringify(videoDiagnostic)}`);
        const result = JSON.parse(await evaluate(`JSON.stringify((() => {
          const visible = (element) => { if (!element) return false; const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0; };
          const hero = document.querySelector('[data-video-background]');
          const video = hero && hero.querySelector('video');
          const sourceUrls = video ? [...video.querySelectorAll('source')].map((source) => source.src) : [];
          const nonHeroSections = [...document.querySelectorAll('main > section:not(.cinematic-hero)')];
          const base = {
            overflow: document.documentElement.scrollWidth - innerWidth,
            sectionsZeroHeight: [...document.querySelectorAll('main > section')].filter((section) => section.getBoundingClientRect().height === 0).length,
            texturedSections: nonHeroSections.filter((section) => [...section.classList].some((name) => name.startsWith('surface-'))).length,
            nonHeroSections: nonHeroSections.length,
            heroValid: hero && hero.dataset.videoValid,
            heroAutoplay: hero && hero.dataset.autoplay,
            videoTag: video && video.tagName,
            webm: !!(video && video.querySelector('source[type="video/webm"]')),
            mp4: !!(video && video.querySelector('source[type="video/mp4"]')),
            videoDuration: video && video.duration,
            videoWidth: video && video.videoWidth,
            videoHeight: video && video.videoHeight,
            videoSourcesRelative: sourceUrls.every((url) => url.includes('${basePath}assets/videos/')),
            deferredVideoSourcesRelative: video ? [...video.querySelectorAll('source[data-src]')].every((source) => source.dataset.src.startsWith('assets/videos/')) : false,
            posterVisible: visible(hero && hero.querySelector('.media-background__poster')),
            toggleVisible: visible(document.querySelector('[data-video-toggle]')),
            backToTop: !!document.querySelector('[data-back-to-top]'),
            headingPeriods: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((heading) => heading.textContent.trim().endsWith('.')).length
          };
          if (document.body.classList.contains('home-page')) return { ...base,
            trendingVisible: visible(document.querySelector('#signature')), trendingCards: document.querySelectorAll('#signature .signature-card').length,
            trendingNames: [...document.querySelectorAll('#signature h3')].map((node) => node.textContent.trim()),
            overviewVisible: visible(document.querySelector('#treatments')), overviewCards: document.querySelectorAll('#treatments .overview-card').length,
            overviewTitleTops: [...document.querySelectorAll('#treatments .overview-card h3')].map((node) => Number(node.getBoundingClientRect().top.toFixed(1))),
            whyVisible: visible(document.querySelector('#why-coral-spa')), whyItems: document.querySelectorAll('#why-coral-spa .why-statement').length, whyFocal: !!document.querySelector('#why-coral-spa .why-media img'),
            galleryVisible: visible(document.querySelector('#gallery')), galleryFocus: document.querySelectorAll('[data-gallery-focus]').length, galleryThumbs: document.querySelectorAll('[data-gallery-thumb]').length,
            galleryUnique: new Set([...document.querySelectorAll('[data-gallery-focus], [data-gallery-thumb]')].map((node) => node.dataset.gallerySrc)).size,
            galleryFocusWidth: document.querySelector('[data-gallery-focus]')?.getBoundingClientRect().width || 0,
            galleryFocusHeight: document.querySelector('[data-gallery-focus]')?.getBoundingClientRect().height || 0,
            galleryImageNaturalWidth: document.querySelector('[data-gallery-focus-image]')?.naturalWidth || 0,
            galleryImageOpacity: Number(getComputedStyle(document.querySelector('[data-gallery-focus-image]')).opacity),
            reviewsVisible: visible(document.querySelector('#reviews')), reviewRoot: !!document.querySelector('[data-google-reviews]'), reviewState: document.querySelector('[data-google-reviews]')?.dataset.reviewState,
            locationVisible: visible(document.querySelector('#location')), footerVisible: visible(document.querySelector('.site-footer'))
          };
          if (document.body.classList.contains('about-page')) return { ...base,
            whyVisible: visible(document.querySelector('#why-coral-spa')),
            whyItems: document.querySelectorAll('#why-coral-spa .why-statement').length,
            whyFocal: !!document.querySelector('#why-coral-spa .why-media img')
          };
          if (document.body.classList.contains('services-page')) {
            const rows = [...document.querySelectorAll('[data-service-item]')];
            const groups = [...document.querySelectorAll('[data-service-group]')];
            const tiles = [...document.querySelectorAll('.service-nav-tile')];
            const eligible = rows.filter((row) => ['Specials', 'Massages', 'Foot Reflexology', 'Head Massage'].includes(row.closest('[data-service-group]').dataset.serviceGroup));
            return { ...base, serviceRows: rows.length, serviceDataCount: (window.CORAL_SERVICES || []).reduce((sum, category) => sum + category.services.length, 0), serviceGroups: groups.length, serviceDataGroups: (window.CORAL_SERVICES || []).length, uniqueServiceIds: new Set(rows.map((row) => row.id)).size, serviceTiles: tiles.length, tileColumns: getComputedStyle(document.querySelector('.service-nav-grid')).gridTemplateColumns.split(' ').length, tileTargetsValid: tiles.every((tile) => document.querySelector(tile.getAttribute('href'))), categoryImagesCover: groups.every((group) => getComputedStyle(group.querySelector('.category-media img')).objectFit === 'cover'), categoryRatios: groups.map((group) => { const media = group.querySelector('.category-media'); return Number((media.clientWidth / media.clientHeight).toFixed(2)); }), benefitCounts: eligible.map((row) => row.querySelectorAll('.service-tags span').length), subtitles: [...document.querySelectorAll('.service-row__subtitle')].map((node) => node.textContent.trim()), interestForm: !!document.querySelector('[data-interest-form]') };
          }
          if (document.body.classList.contains('contact-page')) {
            const phones = [...document.querySelectorAll('.contact-card__phone')];
            return { ...base, contactCards: document.querySelectorAll('.contact-grid > .contact-card').length, separateMap: !!document.querySelector('.contact-map-section'), phonesNoWrap: phones.every((phone) => getComputedStyle(phone).whiteSpace === 'nowrap'), phonesFit: phones.every((phone) => phone.scrollWidth <= phone.clientWidth), mapUsable: !!document.querySelector('.contact-card--map iframe') && !!document.querySelector('.contact-card--map a[href*="google.com/maps"]') };
          }
          return base;
        })())`));
        if (result.overflow > 1) failures.push(`${label}: horizontal overflow ${result.overflow}px`);
        if (result.headingPeriods) failures.push(`${label}: ${result.headingPeriods} headings end with a full stop`);
        if (!result.backToTop) failures.push(`${label}: shared back-to-top is missing`);
        if (result.sectionsZeroHeight) failures.push(`${label}: ${result.sectionsZeroHeight} zero-height sections`);
        if (result.texturedSections !== result.nonHeroSections) failures.push(`${label}: explicit surface class coverage failed`);
        if (localFailures.length) failures.push(`${label}: failed local assets ${localFailures.join(', ')}`);
        if (consoleErrors.length) failures.push(`${label}: console errors ${consoleErrors.join(', ')}`);
        const validVideoHero = result.heroValid === 'true' && result.heroAutoplay === 'true' && result.videoTag === 'VIDEO' && result.webm && result.mp4 && result.videoDuration > 1 && result.videoWidth > 0 && result.videoHeight > 0 && result.videoSourcesRelative && result.posterVisible && !result.toggleVisible;
        const validPosterOnlyContact = page === 'contact.html' && result.heroValid === 'false' && result.heroAutoplay === 'false' && result.videoTag === 'VIDEO' && result.webm && result.mp4 && result.deferredVideoSourcesRelative && result.posterVisible && !result.toggleVisible;
        if (!validVideoHero && !validPosterOnlyContact) failures.push(`${label}: hero media assertion failed ${JSON.stringify({ heroValid: result.heroValid, heroAutoplay: result.heroAutoplay, videoTag: result.videoTag, webm: result.webm, mp4: result.mp4, videoSourcesRelative: result.videoSourcesRelative, deferredVideoSourcesRelative: result.deferredVideoSourcesRelative, posterVisible: result.posterVisible, toggleVisible: result.toggleVisible })}`);
        if (page === 'index.html') {
          const names = ['The Jet Lag Reset', 'Lymphatic Drainage', 'The Heat Ritual'];
          if (!result.trendingVisible || result.trendingCards !== 3 || names.some((name) => !result.trendingNames.includes(name))) failures.push(`${label}: trending assertion failed`);
          const overviewSpread = Math.max(...result.overviewTitleTops) - Math.min(...result.overviewTitleTops);
          if (!result.overviewVisible || result.overviewCards !== 3 || (width > 920 && overviewSpread > 2) || !result.whyVisible || result.whyItems !== 4 || !result.whyFocal) failures.push(`${label}: overview alignment or branded credibility assertion failed`);
          if (!result.galleryVisible || result.galleryFocus !== 1 || result.galleryThumbs !== 4 || result.galleryUnique !== 5 || !(result.galleryFocusWidth > 0) || !(result.galleryFocusHeight > 0) || !(result.galleryImageNaturalWidth > 0) || !(result.galleryImageOpacity > 0.95)) failures.push(`${label}: gallery structure or focus-image assertion failed`);
          if (!result.reviewsVisible || !result.reviewRoot || !result.locationVisible || !result.footerVisible) failures.push(`${label}: reviews, location or footer assertion failed`);
        }
        if (page === 'about.html' && (!result.whyVisible || result.whyItems !== 4 || !result.whyFocal)) failures.push(`${label}: About Why Coral Spa composition assertion failed`);
        if (page === 'services.html') {
          const expectedColumns = width >= 1280 ? 10 : width >= 720 ? 5 : 2;
          const expectedRatio = width <= 720 ? 4 / 3 : 16 / 9;
          if (result.serviceRows !== result.serviceDataCount || result.serviceGroups !== result.serviceDataGroups || result.uniqueServiceIds !== result.serviceRows) failures.push(`${label}: service omission or duplication detected`);
          if (result.serviceTiles !== 10 || result.tileColumns !== expectedColumns || !result.tileTargetsValid) failures.push(`${label}: service category tile assertion failed`);
          if (!result.categoryImagesCover || result.categoryRatios.some((ratio) => Math.abs(ratio - expectedRatio) > 0.04)) failures.push(`${label}: category image crop assertion failed`);
          if (result.benefitCounts.some((count) => count < 2 || count > 3)) failures.push(`${label}: massage benefit chip assertion failed`);
          if (!['Slow Down', 'Reset & Release', 'Knot Fixer', 'The Heat Ritual'].every((subtitle) => result.subtitles.includes(subtitle)) || !result.interestForm) failures.push(`${label}: service subtitle or request-form assertion failed`);
        }
        if (page === 'contact.html' && (result.contactCards !== 5 || result.separateMap || !result.phonesNoWrap || !result.phonesFit || !result.mapUsable)) failures.push(`${label}: unified contact grid assertion failed`);
        report.push({ label, videoDiagnostic, ...result });
      }
    }

    await client.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await navigate(`${origin}${basePath}services.html?search-regression=1`);
    await evaluate(`document.querySelector('[data-service-search]').scrollIntoView({ block: 'start' })`);
    const serviceSearch = JSON.parse(await evaluate(`new Promise((resolve) => {
      const input = document.querySelector('[data-service-search]');
      input.value = 'Potli Massage';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const rows = [...document.querySelectorAll('[data-service-item]:not([hidden])')];
        const first = rows[0];
        const firstGroup = first && first.closest('[data-service-group]');
        resolve(JSON.stringify({
          visibleRows: rows.length,
          status: document.querySelector('[data-filter-status]').textContent.trim(),
          filtering: document.querySelector('.services-menu').classList.contains('is-filtering'),
          firstHeight: first ? first.getBoundingClientRect().height : 0,
          firstOpacity: first ? Number(getComputedStyle(first).opacity) : 0,
          categoryMediaHidden: firstGroup ? getComputedStyle(firstGroup.querySelector('.category-media')).display === 'none' : false
        }));
      }));
    })`));
    if (serviceSearch.visibleRows !== 1 || serviceSearch.status !== '1 treatment found' || !serviceSearch.filtering || serviceSearch.firstHeight <= 0 || serviceSearch.firstOpacity < 0.95 || !serviceSearch.categoryMediaHidden) failures.push(`Service search results are not visibly rendered: ${JSON.stringify(serviceSearch)}`);

    const whyCaptureSizes = new Set(["2560x1440", "1920x1080", "1536x1024", "1440x900", "1024x768", "768x1024", "430x932", "390x844", "320x568"]);
    for (const [width, height] of sizes.filter(([w, h]) => whyCaptureSizes.has(`${w}x${h}`))) {
      await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 430 });
      await navigate(`${origin}${basePath}index.html?why-visual=${width}x${height}`);
      await evaluate(`document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#why-coral-spa').offsetTop - 72)`);
      await delay(1250);
      const whyVisual = JSON.parse(await evaluate(`JSON.stringify((() => {
        const section = document.querySelector('#why-coral-spa');
        const heading = section.querySelector('.section-heading');
        const media = section.querySelector('.why-media');
        const statements = [...section.querySelectorAll('.why-statement')];
        const personalized = section.querySelector('.why-statement--personalized h3');
        const quick = document.querySelector('.floating-actions');
        const visible = (node) => { const style = getComputedStyle(node); const rect = node.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > .95; };
        const overlaps = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const mediaRect = media.getBoundingClientRect();
        const statementRects = statements.map((node) => node.getBoundingClientRect());
        const styleIsBoxless = (node) => { const style = getComputedStyle(node.querySelector('.why-statement__motion')); return style.backgroundImage === 'none' && style.backgroundColor === 'rgba(0, 0, 0, 0)' && parseFloat(style.borderTopWidth) === 0 && parseFloat(style.borderBottomWidth) === 0 && style.boxShadow === 'none'; };
        const lineHeight = parseFloat(getComputedStyle(personalized).lineHeight);
        const personalizedLines = Math.round(personalized.getBoundingClientRect().height / lineHeight);
        const quickRect = quick.getBoundingClientRect();
        const contentRects = [mediaRect, ...statements.flatMap((node) => [...node.querySelectorAll('h3, p')].map((part) => part.getBoundingClientRect()))];
        return {
          headingVisible: visible(heading), statements: statements.length, mediaWidth: mediaRect.width,
          widestStatement: Math.max(...statementRects.map((rect) => rect.width)), boxless: statements.every(styleIsBoxless),
          personalizedLines, forcedBreaks: statements.some((node) => node.querySelector('h3 br')),
          mediaOverlap: statementRects.some((rect) => overlaps(rect, mediaRect)), quickOverlap: contentRects.some((rect) => overlaps(rect, quickRect)),
          outerTransformsStable: statements.every((node) => getComputedStyle(node).transform === 'none'),
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      })())`));
      if (!whyVisual.headingVisible || whyVisual.statements !== 4 || !whyVisual.boxless || whyVisual.forcedBreaks || whyVisual.mediaOverlap || whyVisual.quickOverlap || !whyVisual.outerTransformsStable || whyVisual.overflow > 1) failures.push(`Why composition ${width}x${height} failed: ${JSON.stringify(whyVisual)}`);
      if (width > 1100 && (whyVisual.personalizedLines > 2 || whyVisual.mediaWidth <= whyVisual.widestStatement)) failures.push(`Why desktop hierarchy ${width}x${height} failed: ${JSON.stringify(whyVisual)}`);
      const screenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      fs.writeFileSync(path.join(artifactDir, `why-coral-spa-${width}x${height}.png`), Buffer.from(screenshot.result.data, "base64"));
    }

    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const page of pages) {
      await navigate(`${origin}${basePath}${page}?reveal-audit=1`);
      await evaluate(`new Promise(async (resolve) => { document.documentElement.style.scrollBehavior = 'auto'; for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((wait) => setTimeout(wait, 70)); } scrollTo(0, document.body.scrollHeight); setTimeout(resolve, 400); })`);
      await evaluate(`new Promise(async (resolve) => { for (const node of [...document.querySelectorAll('[data-reveal-state="pending"]')]) { node.scrollIntoView({ block: 'center' }); await new Promise((wait) => setTimeout(wait, 90)); } setTimeout(resolve, 1100); })`);
      const reveal = JSON.parse(await evaluate(`JSON.stringify((() => { const pending = [...document.querySelectorAll('[data-reveal-state="pending"]')]; const hidden = [...document.querySelectorAll('[data-reveal]')].filter((node) => Number(getComputedStyle(node).opacity) === 0); const identify = (node) => node.id || node.className || node.tagName; return { pending: pending.length, hidden: hidden.length, nodes: [...new Set([...pending, ...hidden].map(identify))].slice(0, 8) }; })())`));
      if (reveal.pending || reveal.hidden) failures.push(`${page}: reveal system left content hidden (${reveal.nodes.join(', ')})`);
    }

    await navigate(`${origin}${basePath}services.html?disclosure-motion=1`);
    const serviceDisclosure = JSON.parse(await evaluate(`new Promise((resolve) => { const row = document.querySelector('.service-row'); const summary = row.querySelector('summary'); const panel = row.querySelector('.service-row__detail'); summary.click(); setTimeout(() => { const opening = { open: row.open, state: row.dataset.disclosureState, animations: panel.getAnimations().length, height: panel.getBoundingClientRect().height }; setTimeout(() => { const opened = { open: row.open, state: row.dataset.disclosureState, animations: panel.getAnimations().length, height: panel.getBoundingClientRect().height }; summary.click(); setTimeout(() => { const closing = { open: row.open, state: row.dataset.disclosureState, animations: panel.getAnimations().length, height: panel.getBoundingClientRect().height }; setTimeout(() => resolve(JSON.stringify({ opening, opened, closing, closed: { open: row.open, state: row.dataset.disclosureState, animations: panel.getAnimations().length } })), 600); }, 120); }, 600); }, 120); })`));
    if (!serviceDisclosure.opening.open || serviceDisclosure.opening.state !== 'opening' || serviceDisclosure.opening.animations !== 1 || !(serviceDisclosure.opening.height > 0) || !serviceDisclosure.opened.open || serviceDisclosure.opened.state !== 'open' || serviceDisclosure.opened.animations !== 0 || !serviceDisclosure.closing.open || serviceDisclosure.closing.state !== 'closing' || serviceDisclosure.closing.animations !== 1 || serviceDisclosure.closed.open || serviceDisclosure.closed.state !== 'closed' || serviceDisclosure.closed.animations !== 0) failures.push(`Service disclosure animation failed: ${JSON.stringify(serviceDisclosure)}`);

    await navigate(`${origin}${basePath}index.html?stagger-order=1`);
    const staggerBefore = JSON.parse(await evaluate(`new Promise((resolve) => { const root = document.querySelector('#why-coral-spa [data-stagger-group]'); setTimeout(() => resolve(JSON.stringify({ state: root.dataset.staggerState, revealed: [...root.querySelectorAll('[data-stagger-item]')].filter((item) => item.dataset.revealedAt).length })), 500); })`));
    if (staggerBefore.revealed !== 0 || staggerBefore.state !== 'pending') failures.push(`Off-screen stagger group started too early: ${JSON.stringify(staggerBefore)}`);
    await evaluate(`document.querySelector('#why-coral-spa [data-stagger-group]').scrollIntoView({ block: 'center' })`);
    const staggerAfter = JSON.parse(await evaluate(`new Promise((resolve) => { setTimeout(() => { const root = document.querySelector('#why-coral-spa [data-stagger-group]'); const times = [...root.querySelectorAll('[data-stagger-item]')].map((item) => Number(item.dataset.revealedAt || 0)); resolve(JSON.stringify({ state: root.dataset.staggerState, times })); }, 1600); })`));
    if (staggerAfter.state !== 'complete' || staggerAfter.times.length !== 5 || staggerAfter.times.some((time, index) => !time || (index && time <= staggerAfter.times[index - 1]))) failures.push(`Stagger order assertion failed: ${JSON.stringify(staggerAfter)}`);

    await navigate(`${origin}${basePath}index.html?gallery-manual=1`);
    for (let index = 0; index < 4; index += 1) {
      const manualGallery = JSON.parse(await evaluate(`new Promise((resolve) => { const focus = document.querySelector('[data-gallery-focus]'); const before = focus.dataset.gallerySrc; const deadline = Date.now() + 10000; document.querySelectorAll('[data-gallery-thumb]')[${index}].click(); const inspect = () => { const image = document.querySelector('[data-gallery-focus-image]'); if (before !== focus.dataset.gallerySrc && image && image.complete && image.naturalWidth > 0) return setTimeout(() => resolve(JSON.stringify({ changed: true, naturalWidth: image.naturalWidth, opacity: Number(getComputedStyle(image).opacity), width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height, currentSrc: image.currentSrc })), 400); if (Date.now() >= deadline) resolve(JSON.stringify({ changed: false, naturalWidth: image?.naturalWidth || 0, currentSrc: image?.currentSrc || '' })); else setTimeout(inspect, 50); }; inspect(); })`));
      if (!manualGallery.changed || !(manualGallery.naturalWidth > 0) || !(manualGallery.opacity > 0.95) || !(manualGallery.width > 0) || !(manualGallery.height > 0) || !manualGallery.currentSrc) failures.push(`Gallery thumbnail ${index + 1} did not render a visible focused image: ${JSON.stringify(manualGallery)}`);
    }

    await navigate(`${origin}${basePath}index.html?gallery-auto=1`);
    await evaluate(`document.querySelector('[data-gallery-showcase]').scrollIntoView({ block: 'center' })`);
    await delay(400);
    const rotatingGallery = JSON.parse(await evaluate(`new Promise((resolve) => { const focus = document.querySelector('[data-gallery-focus]'); const before = focus.dataset.gallerySrc; const deadline = Date.now() + 10000; const inspect = () => { const image = document.querySelector('[data-gallery-focus-image]'); const state = { before, after: focus.dataset.gallerySrc, naturalWidth: image?.naturalWidth || 0, opacity: image ? Number(getComputedStyle(image).opacity) : 0, width: image?.getBoundingClientRect().width || 0, height: image?.getBoundingClientRect().height || 0, currentSrc: image?.currentSrc || '', mediaLayers: focus.querySelectorAll(':scope > picture, :scope > img.gallery-showcase__focus-image').length }; const stable = state.before !== state.after && state.naturalWidth > 0 && state.opacity > 0.95 && state.width > 0 && state.height > 0 && state.currentSrc && state.mediaLayers === 1; if (stable || Date.now() >= deadline) resolve(JSON.stringify(state)); else setTimeout(inspect, 50); }; inspect(); })`));
    if (rotatingGallery.before === rotatingGallery.after || !(rotatingGallery.naturalWidth > 0) || !(rotatingGallery.opacity > 0.95) || !(rotatingGallery.width > 0) || !(rotatingGallery.height > 0) || !rotatingGallery.currentSrc || rotatingGallery.mediaLayers !== 1) failures.push(`Gallery did not auto-advance to one visible decoded image: ${JSON.stringify(rotatingGallery)}`);
    await captureSection('#gallery', 'home-gallery-rotated.png');

    await client.send("Network.clearBrowserCache");
    await client.send("Network.setBlockedURLs", { urls: ["*coral-spa-therapy-suite-1200.webp", "*coral-spa-therapy-suite-640.webp", "*coral-spa-therapy-suite.jpeg"] });
    await navigate(`${origin}${basePath}index.html?gallery-failure=1`);
    const failedGallerySwap = JSON.parse(await evaluate(`new Promise((resolve) => { const focus = document.querySelector('[data-gallery-focus]'); const image = document.querySelector('[data-gallery-focus-image]'); const before = focus.dataset.gallerySrc; document.querySelector('[data-gallery-thumb]').click(); setTimeout(() => resolve(JSON.stringify({ unchanged: focus.dataset.gallerySrc === before, naturalWidth: image.naturalWidth, opacity: Number(getComputedStyle(image).opacity), width: focus.getBoundingClientRect().width, height: focus.getBoundingClientRect().height })), 800); })`));
    if (!failedGallerySwap.unchanged || !(failedGallerySwap.naturalWidth > 0) || !(failedGallerySwap.opacity > 0.95) || !(failedGallerySwap.width > 0) || !(failedGallerySwap.height > 0)) failures.push(`Gallery replacement failure hid the focus image: ${JSON.stringify(failedGallerySwap)}`);
    await client.send("Network.setBlockedURLs", { urls: [] });

    await navigate(`${origin}${basePath}index.html?reviews-live=1`);
    const liveReviews = JSON.parse(await evaluate(`new Promise((resolve) => { const deadline = Date.now() + 10000; const finish = () => { const root = document.querySelector('[data-google-reviews]'); if (root.dataset.reviewState === 'ready') resolve(JSON.stringify({ state: root.dataset.reviewState, busy: root.getAttribute('aria-busy'), cards: root.querySelectorAll('.review-card:not([data-carousel-clone])').length, fourStarVisible: [...root.querySelectorAll('.review-card:not([data-carousel-clone]) .review-card__stars')].some((node) => node.textContent === '★★★★☆'), includesFourStarReview: root.textContent.includes('QA review four'), fallback: !!root.querySelector('.review-card--fallback') })); else if (Date.now() >= deadline) resolve(JSON.stringify({ state: root.dataset.reviewState || 'timeout', cards: root.querySelectorAll('.review-card:not([data-carousel-clone])').length })); else setTimeout(finish, 50); }; finish(); })`));
    if (liveReviews.state !== 'ready' || liveReviews.busy !== 'false' || liveReviews.cards !== 5 || !liveReviews.fourStarVisible || !liveReviews.includesFourStarReview || liveReviews.fallback) failures.push(`Configured live reviews assertion failed: ${JSON.stringify(liveReviews)}`);
    await evaluate(`document.querySelector('.review-carousel').scrollIntoView({ block: 'center' })`);
    await delay(400);
    const reviewCarousel = JSON.parse(await evaluate(`new Promise((resolve) => { const carousel = document.querySelector('.review-carousel'); const before = carousel.dataset.carouselIndex; setTimeout(() => resolve(JSON.stringify({ before, after: carousel.dataset.carouselIndex, ready: carousel.dataset.carouselReady })), 5700); })`));
    if (reviewCarousel.ready !== 'true' || reviewCarousel.before === reviewCarousel.after) failures.push(`Review carousel did not auto-advance: ${JSON.stringify(reviewCarousel)}`);

    for (const [width, expected] of [[1440, 4], [1024, 3], [768, 2], [390, 1]]) {
      await client.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      await navigate(`${origin}${basePath}about.html?team-fixture=1&width=${width}`);
      await evaluate(`document.querySelector('[data-team-section]').scrollIntoView({ block: 'center' })`);
      await delay(300);
      const teamState = JSON.parse(await evaluate(`JSON.stringify((() => { const root = document.querySelector('[data-team-section]'); const cards = [...root.querySelectorAll('.team-card:not([data-carousel-clone])')]; const renderedCards = [...root.querySelectorAll('.team-card')]; const viewport = root.querySelector('.content-carousel__viewport').getBoundingClientRect(); const visibleCards = renderedCards.filter((card) => { const rect = card.getBoundingClientRect(); return rect.left < viewport.right - 1 && rect.right > viewport.left + 1; }).length; return { cards: cards.length, visibleCards, columns: Number(getComputedStyle(root).getPropertyValue('--carousel-columns')), emptyHidden: document.querySelector('[data-team-empty]').hidden, sampleLabels: cards.filter((card) => card.textContent.includes('Sample profile') || card.textContent.includes('details to be confirmed')).length, specialistTitles: cards.filter((card) => !!card.querySelector('.team-card__status')).length }; })())`));
      if (teamState.cards !== 8 || teamState.columns !== expected || teamState.visibleCards !== expected || !teamState.emptyHidden || teamState.sampleLabels !== 0 || teamState.specialistTitles !== 8) failures.push(`Team carousel ${width}px assertion failed: ${JSON.stringify(teamState)}`);
    }
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(`${origin}${basePath}about.html?team-autoplay=1`);
    await evaluate(`document.querySelector('[data-team-section]').scrollIntoView({ block: 'center' })`);
    await delay(400);
    const teamAutoplay = JSON.parse(await evaluate(`new Promise((resolve) => { const root = document.querySelector('[data-team-section]'); const before = root.dataset.carouselIndex; setTimeout(() => resolve(JSON.stringify({ before, after: root.dataset.carouselIndex, playing: root.dataset.carouselPlaying })), 6500); })`));
    if (teamAutoplay.before === teamAutoplay.after || teamAutoplay.playing !== 'true') failures.push(`Team carousel did not auto-advance: ${JSON.stringify(teamAutoplay)}`);

    for (const page of pages) {
      await navigate(`${origin}${basePath}${page}?back-top=1`);
      const backTop = JSON.parse(await evaluate(`new Promise((resolve) => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 900); window.dispatchEvent(new Event('scroll')); setTimeout(() => { const button = document.querySelector('[data-back-to-top]'); resolve(JSON.stringify({ exists: !!button, visible: button?.classList.contains('is-visible'), scrollY })); }, 250); })`));
      if (!backTop.exists || !backTop.visible) failures.push(`${page}: back-to-top did not appear after scrolling`);
    }

    await navigate(`${origin}${basePath}index.html?reviews-live=1&screenshot=1`);
    await evaluate(`new Promise((resolve) => { const wait = () => document.querySelector('[data-google-reviews]').dataset.reviewState === 'ready' ? resolve() : setTimeout(wait, 50); wait(); })`);
    await captureSection('#reviews', 'google-reviews.png');
    await captureSection('#gallery', 'home-gallery.png');
    await captureSection('#signature', 'surface-warm-wood.png');
    await captureSection('#why-coral-spa', 'surface-smoked-glass.png');
    await captureSection('#reviews', 'surface-pebble.png');
    await navigate(`${origin}${basePath}about.html?team-fixture=1&screenshot=1`);
    await evaluate(`document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.therapists-section').scrollIntoView({ block: 'start' })`);
    await delay(300);
    const teamScreenshot = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    fs.writeFileSync(path.join(artifactDir, 'therapist-carousel.png'), Buffer.from(teamScreenshot.result.data, "base64"));
    await navigate(`${origin}${basePath}services.html?screenshot=1`);
    await captureSection('#massages', 'massage-benefits.png');
    await navigate(`${origin}${basePath}contact.html?screenshot=1`);
    await captureSection('.cinematic-hero', 'contact-hero.png');

    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    for (const page of pages) {
      await navigate(`${origin}${basePath}${page}?reduced-motion=1`, { video: false });
      const reduced = JSON.parse(await evaluate(`JSON.stringify((() => { const video = document.querySelector('[data-video-background] video'); const poster = document.querySelector('.media-background__poster'); return { paused: video.paused, videoHidden: getComputedStyle(video).display === 'none', posterVisible: getComputedStyle(poster).display !== 'none', hiddenReveals: [...document.querySelectorAll('[data-reveal]')].filter((node) => Number(getComputedStyle(node).opacity) === 0).length }; })())`));
      if (!reduced.paused || !reduced.videoHidden || !reduced.posterVisible || reduced.hiddenReveals) failures.push(`${page}: reduced-motion assertion failed`);
    }
    await navigate(`${origin}${basePath}index.html?reduced-gallery=1`, { video: false });
    const reducedGallery = await evaluate(`new Promise((resolve) => { const before = document.querySelector('[data-gallery-focus]').dataset.gallerySrc; setTimeout(() => resolve(JSON.stringify({ before, after: document.querySelector('[data-gallery-focus]').dataset.gallerySrc })), 6000); })`);
    const reducedGalleryState = JSON.parse(reducedGallery);
    if (reducedGalleryState.before !== reducedGalleryState.after) failures.push('Reduced motion did not disable gallery rotation');
    await navigate(`${origin}${basePath}index.html?reviews-live=1&reduced-carousel=1`, { video: false });
    const reducedReviewCarousel = JSON.parse(await evaluate(`new Promise((resolve) => { const root = document.querySelector('.review-carousel'); const waitReady = () => { if (root.dataset.carouselReady === 'true') { const before = root.dataset.carouselIndex; setTimeout(() => resolve(JSON.stringify({ before, after: root.dataset.carouselIndex })), 5700); } else setTimeout(waitReady, 50); }; waitReady(); })`));
    if (reducedReviewCarousel.before !== reducedReviewCarousel.after) failures.push('Reduced motion did not disable review carousel autoplay');
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    await client.send("Network.setBlockedURLs", { urls: ["*.webm", "*.mp4"] });
    for (const page of pages) {
      await navigate(`${origin}${basePath}${page}?blocked-video=1`, { video: false });
      const fallback = JSON.parse(await evaluate(`JSON.stringify((() => { const image = document.querySelector('.media-background__poster img'); const style = getComputedStyle(image); return { loaded: image.naturalWidth > 0, visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 }; })())`));
      if (!fallback.loaded || !fallback.visible) failures.push(`${page}: blocked-video poster fallback failed`);
    }
    await client.send("Network.setBlockedURLs", { urls: [] });

    await client.send("Emulation.setScriptExecutionDisabled", { value: true });
    await client.send("Page.navigate", { url: `${origin}${basePath}index.html?no-js=1` });
    await delay(800);
    await client.send("Emulation.setScriptExecutionDisabled", { value: false });
    const noJs = JSON.parse(await evaluate(`JSON.stringify((() => { const focus = document.querySelector('[data-gallery-focus]'); const image = document.querySelector('[data-gallery-focus-image]'); return { trending: document.querySelectorAll('#signature .signature-card').length, overview: document.querySelectorAll('#treatments .overview-card').length, why: document.querySelectorAll('#why-coral-spa .why-statement').length, galleryItems: document.querySelectorAll('[data-gallery-focus], [data-gallery-thumb]').length, galleryWidth: focus.getBoundingClientRect().width, galleryHeight: focus.getBoundingClientRect().height, galleryNaturalWidth: image.naturalWidth, galleryOpacity: Number(getComputedStyle(image).opacity), reviewLoadingVisible: getComputedStyle(document.querySelector('[data-review-loading]')).display !== 'none', hidden: [...document.querySelectorAll('main > section')].filter((section) => !section.getBoundingClientRect().height || getComputedStyle(section).display === 'none' || getComputedStyle(section).visibility === 'hidden').length }; })())`));
    if (noJs.trending !== 3 || noJs.overview !== 3 || noJs.why !== 4 || noJs.galleryItems !== 5 || !(noJs.galleryWidth > 0) || !(noJs.galleryHeight > 0) || !(noJs.galleryNaturalWidth > 0) || !(noJs.galleryOpacity > 0.95) || !noJs.reviewLoadingVisible || noJs.hidden) failures.push('No-JavaScript homepage assertion failed');

    const css = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
    if (/\.section:nth-of-type\s*\(/.test(css)) failures.push('Generic section:nth-of-type background rule remains');
    const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    if (!homepage.includes('data-review-loading')) failures.push('Initial reviews loading state is missing');

    client.close();
    console.log(JSON.stringify({ passed: failures.length === 0, checks: report.length, liveReviews, reviewCarousel, rotatingGallery, reducedGallery: reducedGalleryState, noJs, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    browser.kill("SIGTERM");
    server.close();
    await Promise.race([new Promise((resolve) => browser.once("exit", resolve)), delay(1000)]);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch (error) {}
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  server.close();
  process.exitCode = 1;
});
