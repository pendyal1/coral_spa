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
const sizes = [[1440, 900], [1280, 800], [1024, 768], [430, 932], [390, 844], [375, 812], [320, 568]];
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
    await client.send("Page.addScriptToEvaluateOnNewDocument", { source: `if (location.search.includes("reviews-live")) window.CORAL_GOOGLE_REVIEWS = { endpoint: "${basePath}__test/reviews", mapsUrl: "${reviewFixture.mapsUrl}" };` });
    let localFailures = [];
    let consoleErrors = [];
    client.on((message) => {
      if (message.method === "Network.responseReceived") {
        const response = message.params.response;
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

    const navigate = async (url, { video = true } = {}) => {
      await client.send("Page.navigate", { url });
      for (let attempt = 0; attempt < 100; attempt += 1) {
        await delay(100);
        const state = JSON.parse(await evaluate(`JSON.stringify({ href: location.href, ready: document.readyState, media: (() => { const node = document.querySelector('[data-video-background] video'); return !${video} || !!(node && node.duration > 1 && node.videoWidth > 0 && node.videoHeight > 0); })() })`));
        if (state.href === url && state.ready === "complete" && state.media) return;
      }
      throw new Error(`Timed out loading ${url}`);
    };

    for (const [width, height] of sizes) {
      for (const page of pages) {
        localFailures = [];
        consoleErrors = [];
        await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 430 });
        await navigate(`${origin}${basePath}${page}?qa=${width}x${height}`);
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
            posterVisible: visible(hero && hero.querySelector('.media-background__poster')),
            toggleVisible: visible(document.querySelector('[data-video-toggle]'))
          };
          if (document.body.classList.contains('home-page')) return { ...base,
            trendingVisible: visible(document.querySelector('#signature')), trendingCards: document.querySelectorAll('#signature .signature-card').length,
            trendingNames: [...document.querySelectorAll('#signature h3')].map((node) => node.textContent.trim()),
            overviewVisible: visible(document.querySelector('#treatments')), overviewCards: document.querySelectorAll('#treatments .overview-card').length,
            whyVisible: visible(document.querySelector('#why-coral-spa')), whyItems: document.querySelectorAll('#why-coral-spa .editorial-point').length,
            galleryVisible: visible(document.querySelector('#gallery')), galleryFocus: document.querySelectorAll('[data-gallery-focus]').length, galleryThumbs: document.querySelectorAll('[data-gallery-thumb]').length,
            galleryUnique: new Set([...document.querySelectorAll('[data-gallery-focus], [data-gallery-thumb]')].map((node) => node.dataset.gallerySrc)).size,
            reviewsVisible: visible(document.querySelector('#reviews')), reviewState: document.querySelector('[data-google-reviews]')?.dataset.reviewState,
            locationVisible: visible(document.querySelector('#location')), footerVisible: visible(document.querySelector('.site-footer'))
          };
          if (document.body.classList.contains('services-page')) {
            const rows = [...document.querySelectorAll('[data-service-item]')];
            const groups = [...document.querySelectorAll('[data-service-group]')];
            const tiles = [...document.querySelectorAll('.service-nav-tile')];
            return { ...base, serviceRows: rows.length, serviceDataCount: (window.CORAL_SERVICES || []).reduce((sum, category) => sum + category.services.length, 0), serviceGroups: groups.length, serviceDataGroups: (window.CORAL_SERVICES || []).length, uniqueServiceIds: new Set(rows.map((row) => row.id)).size, serviceTiles: tiles.length, tileColumns: getComputedStyle(document.querySelector('.service-nav-grid')).gridTemplateColumns.split(' ').length, tileTargetsValid: tiles.every((tile) => document.querySelector(tile.getAttribute('href'))), categoryImagesCover: groups.every((group) => getComputedStyle(group.querySelector('.category-media img')).objectFit === 'cover'), categoryRatios: groups.map((group) => { const media = group.querySelector('.category-media'); return Number((media.clientWidth / media.clientHeight).toFixed(2)); }) };
          }
          if (document.body.classList.contains('contact-page')) {
            const phones = [...document.querySelectorAll('.contact-card__phone')];
            return { ...base, contactCards: document.querySelectorAll('.contact-grid > .contact-card').length, separateMap: !!document.querySelector('.contact-map-section'), phonesNoWrap: phones.every((phone) => getComputedStyle(phone).whiteSpace === 'nowrap'), phonesFit: phones.every((phone) => phone.scrollWidth <= phone.clientWidth), mapUsable: !!document.querySelector('.contact-card--map iframe') && !!document.querySelector('.contact-card--map a[href*="google.com/maps"]') };
          }
          return base;
        })())`));
        const label = `${page} ${width}x${height}`;
        if (result.overflow > 0) failures.push(`${label}: horizontal overflow ${result.overflow}px`);
        if (result.sectionsZeroHeight) failures.push(`${label}: ${result.sectionsZeroHeight} zero-height sections`);
        if (result.texturedSections !== result.nonHeroSections) failures.push(`${label}: explicit surface class coverage failed`);
        if (localFailures.length) failures.push(`${label}: failed local assets ${localFailures.join(', ')}`);
        if (consoleErrors.length) failures.push(`${label}: console errors ${consoleErrors.join(', ')}`);
        if (result.heroValid !== 'true' || result.heroAutoplay !== 'true' || result.videoTag !== 'VIDEO' || !result.webm || !result.mp4 || !(result.videoDuration > 1) || !(result.videoWidth > 0) || !(result.videoHeight > 0) || !result.videoSourcesRelative || !result.posterVisible || !result.toggleVisible) failures.push(`${label}: hero media assertion failed`);
        if (page === 'index.html') {
          const names = ['The Jet Lag Reset', 'Lymphatic Drainage', 'The Heat Ritual'];
          if (!result.trendingVisible || result.trendingCards !== 3 || names.some((name) => !result.trendingNames.includes(name))) failures.push(`${label}: trending assertion failed`);
          if (!result.overviewVisible || result.overviewCards !== 3 || !result.whyVisible || result.whyItems !== 4) failures.push(`${label}: overview or credibility assertion failed`);
          if (!result.galleryVisible || result.galleryFocus !== 1 || result.galleryThumbs !== 4 || result.galleryUnique !== 5) failures.push(`${label}: gallery structure assertion failed`);
          if (!result.reviewsVisible || result.reviewState !== 'fallback' || !result.locationVisible || !result.footerVisible) failures.push(`${label}: reviews, location or footer assertion failed`);
        }
        if (page === 'services.html') {
          const expectedColumns = width >= 1280 ? 10 : width >= 720 ? 5 : 2;
          const expectedRatio = width <= 720 ? 4 / 3 : 16 / 9;
          if (result.serviceRows !== result.serviceDataCount || result.serviceGroups !== result.serviceDataGroups || result.uniqueServiceIds !== result.serviceRows) failures.push(`${label}: service omission or duplication detected`);
          if (result.serviceTiles !== 10 || result.tileColumns !== expectedColumns || !result.tileTargetsValid) failures.push(`${label}: service category tile assertion failed`);
          if (!result.categoryImagesCover || result.categoryRatios.some((ratio) => Math.abs(ratio - expectedRatio) > 0.04)) failures.push(`${label}: category image crop assertion failed`);
        }
        if (page === 'contact.html' && (result.contactCards !== 5 || result.separateMap || !result.phonesNoWrap || !result.phonesFit || !result.mapUsable)) failures.push(`${label}: unified contact grid assertion failed`);
        report.push({ label, ...result });
      }
    }

    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const page of pages) {
      await navigate(`${origin}${basePath}${page}?reveal-audit=1`);
      await evaluate(`new Promise(async (resolve) => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((wait) => setTimeout(wait, 70)); } scrollTo(0, document.body.scrollHeight); setTimeout(resolve, 400); })`);
      await evaluate(`new Promise(async (resolve) => { for (const node of [...document.querySelectorAll('[data-reveal-state="pending"]')]) { node.scrollIntoView({ block: 'center' }); await new Promise((wait) => setTimeout(wait, 90)); } setTimeout(resolve, 250); })`);
      const reveal = JSON.parse(await evaluate(`JSON.stringify((() => { const pending = [...document.querySelectorAll('[data-reveal-state="pending"]')]; const hidden = [...document.querySelectorAll('[data-reveal]')].filter((node) => Number(getComputedStyle(node).opacity) === 0); const identify = (node) => node.id || node.className || node.tagName; return { pending: pending.length, hidden: hidden.length, nodes: [...new Set([...pending, ...hidden].map(identify))].slice(0, 8) }; })())`));
      if (reveal.pending || reveal.hidden) failures.push(`${page}: reveal system left content hidden (${reveal.nodes.join(', ')})`);
    }

    await navigate(`${origin}${basePath}index.html?gallery-manual=1`);
    for (let index = 0; index < 4; index += 1) {
      const changed = await evaluate(`new Promise((resolve) => { const before = document.querySelector('[data-gallery-focus]').dataset.gallerySrc; document.querySelectorAll('[data-gallery-thumb]')[${index}].click(); setTimeout(() => resolve(before !== document.querySelector('[data-gallery-focus]').dataset.gallerySrc), 220); })`);
      if (!changed) failures.push(`Gallery thumbnail ${index + 1} did not change the focused image`);
    }

    await navigate(`${origin}${basePath}index.html?reviews-live=1`, { video: true });
    const liveReviews = JSON.parse(await evaluate(`new Promise((resolve) => { const finish = () => { const root = document.querySelector('[data-google-reviews]'); if (root.dataset.reviewState === 'ready') resolve(JSON.stringify({ state: root.dataset.reviewState, cards: root.querySelectorAll('.review-card').length, stars: [...root.querySelectorAll('.review-card__stars')].every((node) => node.textContent === '★★★★★'), filtered: !root.textContent.includes('QA review four') })); else setTimeout(finish, 50); }; finish(); })`));
    if (liveReviews.state !== 'ready' || liveReviews.cards !== 5 || !liveReviews.stars || !liveReviews.filtered) failures.push('Configured live reviews assertion failed');

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
    const noJs = JSON.parse(await evaluate(`JSON.stringify({ trending: document.querySelectorAll('#signature .signature-card').length, overview: document.querySelectorAll('#treatments .overview-card').length, why: document.querySelectorAll('#why-coral-spa .editorial-point').length, galleryItems: document.querySelectorAll('[data-gallery-focus], [data-gallery-thumb]').length, reviewLoadingVisible: getComputedStyle(document.querySelector('[data-review-loading]')).display !== 'none', hidden: [...document.querySelectorAll('main > section')].filter((section) => !section.getBoundingClientRect().height || getComputedStyle(section).display === 'none' || getComputedStyle(section).visibility === 'hidden').length })`));
    if (noJs.trending !== 3 || noJs.overview !== 3 || noJs.why !== 4 || noJs.galleryItems !== 5 || !noJs.reviewLoadingVisible || noJs.hidden) failures.push('No-JavaScript homepage assertion failed');

    const css = fs.readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
    if (/\.section:nth-of-type\s*\(/.test(css)) failures.push('Generic section:nth-of-type background rule remains');
    const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    if (!homepage.includes('data-review-loading')) failures.push('Initial reviews loading state is missing');

    client.close();
    console.log(JSON.stringify({ passed: failures.length === 0, checks: report.length, liveReviews, reducedGallery: reducedGalleryState, noJs, failures }, null, 2));
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
