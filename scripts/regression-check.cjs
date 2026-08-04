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

const server = http.createServer((request, response) => {
  let pathname = decodeURIComponent(new URL(request.url, origin).pathname);
  if (!pathname.startsWith(basePath)) return respond(response, 404, "Not found");
  pathname = pathname.slice(basePath.length) || "index.html";
  const filename = path.resolve(root, pathname);
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    return respond(response, 404, "Not found");
  }
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
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
      const page = targets.find((target) => target.type === "page" && !target.url.startsWith("chrome-extension://"));
      if (page) return page.webSocketDebuggerUrl;
    } catch (error) {}
    await new Promise((resolve) => setTimeout(resolve, 100));
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
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
    listeners.forEach((listener) => listener(message));
  };
  const ready = new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
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

async function run() {
  const chrome = chromePath();
  if (!chrome) throw new Error("Chrome was not found. Set CHROME_PATH to run regression checks.");
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "coral-regression-"));
  const browser = spawn(chrome, ["--headless=new", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "--disable-gpu", "about:blank"], { stdio: "ignore" });
  const failures = [];
  const report = [];

  try {
    const client = cdp(await waitForDebugger());
    await client.ready;
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Network.enable");
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

    const navigate = async (url, { waitForVideo = false } = {}) => {
      await client.send("Page.navigate", { url });
      for (let attempt = 0; attempt < 80; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const state = JSON.parse(await evaluate(`JSON.stringify({ href: location.href, ready: document.readyState, videoReady: (() => { const video = document.querySelector('.home-hero video'); return !${waitForVideo} || !!(video && video.duration > 1 && video.videoWidth > 0 && video.videoHeight > 0); })() })`));
        if (state.href === url && state.ready === "complete" && state.videoReady) return;
      }
      throw new Error(`Timed out loading ${url}`);
    };

    for (const [width, height] of sizes) {
      for (const page of pages) {
        localFailures = [];
        consoleErrors = [];
        await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 430 });
        await navigate(`${origin}${basePath}${page}?qa=${width}x${height}`, { waitForVideo: page === "index.html" });
        const result = JSON.parse(await evaluate(`JSON.stringify((() => {
          const visible = (element) => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0; };
          const base = { url: location.href, bodyClass: document.body.className, overflow: document.documentElement.scrollWidth - innerWidth, sectionsZeroHeight: [...document.querySelectorAll("main > section")].filter((section) => section.getBoundingClientRect().height === 0).length };
          if (document.body.classList.contains("services-page")) {
            const rows = [...document.querySelectorAll("[data-service-item]")];
            return { ...base,
              serviceRows: rows.length,
              serviceDataCount: (window.CORAL_SERVICES || []).reduce((total, category) => total + category.services.length, 0),
              serviceGroups: document.querySelectorAll("[data-service-group]").length,
              serviceDataGroups: (window.CORAL_SERVICES || []).length,
              uniqueServiceIds: new Set(rows.map((row) => row.id)).size
            };
          }
          if (!document.body.classList.contains("home-page")) return base;
          const video = document.querySelector(".home-hero video");
          return { ...base,
            trendingVisible: visible(document.querySelector("#signature")), trendingCards: document.querySelectorAll("#signature .signature-card").length,
            trendingNames: [...document.querySelectorAll("#signature h3")].map((node) => node.textContent.trim()),
            overviewVisible: visible(document.querySelector("#treatments")), overviewCards: document.querySelectorAll("#treatments .overview-card").length,
            whyVisible: visible(document.querySelector("#why-coral-spa")), whyItems: document.querySelectorAll("#why-coral-spa .editorial-point").length,
            galleryVisible: visible(document.querySelector("#gallery")), galleryFigures: document.querySelectorAll("#gallery figure").length,
            reviewsVisible: visible(document.querySelector("#reviews")), locationVisible: visible(document.querySelector("#location")), footerVisible: visible(document.querySelector(".site-footer")),
            hiddenRequired: [...document.querySelectorAll("#signature, #treatments, #why-coral-spa, #gallery, #reviews, #location")].filter((element) => !visible(element)).length,
            videoTag: video && video.tagName, webm: !!video.querySelector('source[type="video/webm"]'), mp4: !!video.querySelector('source[type="video/mp4"]'),
            videoDuration: video.duration, videoWidth: video.videoWidth, videoHeight: video.videoHeight,
            posterVisible: visible(document.querySelector(".home-hero .media-background__poster"))
          };
        })())`));
        const label = `${page} ${width}x${height}`;
        if (result.overflow > 0) failures.push(`${label}: horizontal overflow ${result.overflow}px`);
        if (result.sectionsZeroHeight) failures.push(`${label}: ${result.sectionsZeroHeight} zero-height sections`);
        if (localFailures.length) failures.push(`${label}: failed assets ${localFailures.join(", ")}`);
        if (consoleErrors.length) failures.push(`${label}: console errors ${consoleErrors.join(", ")}`);
        if (page === "index.html") {
          const requiredNames = ["The Jet Lag Reset", "Lymphatic Drainage", "The Heat Ritual"];
          if (!result.trendingVisible || result.trendingCards !== 3 || requiredNames.some((name) => !result.trendingNames.includes(name))) failures.push(`${label}: trending assertion failed`);
          if (!result.overviewVisible || result.overviewCards !== 3) failures.push(`${label}: overview assertion failed`);
          if (!result.whyVisible || result.whyItems !== 4) failures.push(`${label}: Why Coral Spa assertion failed`);
          if (!result.galleryVisible || result.galleryFigures !== 5) failures.push(`${label}: gallery assertion failed`);
          if (!result.reviewsVisible || !result.locationVisible || !result.footerVisible || result.hiddenRequired) failures.push(`${label}: required section visibility failed`);
          if (result.videoTag !== "VIDEO" || !result.webm || !result.mp4 || !(result.videoDuration > 1) || !(result.videoWidth > 0) || !(result.videoHeight > 0)) failures.push(`${label}: genuine video metadata assertion failed`);
        }
        if (page === "services.html" && (result.serviceRows !== result.serviceDataCount || result.serviceGroups !== result.serviceDataGroups || result.uniqueServiceIds !== result.serviceRows)) {
          failures.push(`${label}: service data duplication or omission detected`);
        }
        report.push({ label, ...result });
      }
    }

    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(`${origin}${basePath}index.html?reveal-audit=1`, { waitForVideo: true });
    await evaluate(`new Promise(async (resolve) => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((wait) => setTimeout(wait, 90)); } scrollTo(0, document.body.scrollHeight); setTimeout(resolve, 500); })`);
    const revealAudit = JSON.parse(await evaluate(`JSON.stringify({ pending: document.querySelectorAll('[data-reveal-state="pending"]').length, hidden: [...document.querySelectorAll('[data-reveal]')].filter((element) => { const style = getComputedStyle(element); return style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0; }).length })`));
    if (revealAudit.pending || revealAudit.hidden) failures.push("Scroll reveal left content permanently invisible");

    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await navigate(`${origin}${basePath}index.html?reduced-motion=1`);
    const reducedMotion = JSON.parse(await evaluate(`JSON.stringify((() => { const video = document.querySelector('.home-hero video'); const poster = document.querySelector('.home-hero .media-background__poster'); const posterStyle = getComputedStyle(poster); return { videoPaused: video.paused, videoHidden: getComputedStyle(video).display === 'none', posterVisible: posterStyle.display !== 'none' && posterStyle.visibility !== 'hidden' && Number(posterStyle.opacity) > 0, hiddenReveals: [...document.querySelectorAll('[data-reveal]')].filter((element) => Number(getComputedStyle(element).opacity) === 0).length }; })())`));
    if (!reducedMotion.videoPaused || !reducedMotion.videoHidden || !reducedMotion.posterVisible || reducedMotion.hiddenReveals) failures.push("Reduced-motion behavior failed");
    await client.send("Emulation.setEmulatedMedia", { features: [] });

    await client.send("Network.setBlockedURLs", { urls: ["*.webm", "*.mp4"] });
    await navigate(`${origin}${basePath}index.html?blocked-video=1`);
    const posterFallback = JSON.parse(await evaluate(`JSON.stringify((() => { const image = document.querySelector('.home-hero .media-background__poster img'); if (!image) return { loaded: false, visible: false }; const style = getComputedStyle(image); return { loaded: image.naturalWidth > 0, visible: style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 }; })())`));
    if (!posterFallback.loaded || !posterFallback.visible) failures.push("Blocked-video poster fallback failed");
    await client.send("Network.setBlockedURLs", { urls: [] });

    await client.send("Emulation.setScriptExecutionDisabled", { value: true });
    await client.send("Page.navigate", { url: `${origin}${basePath}index.html?no-js=1` });
    await new Promise((resolve) => setTimeout(resolve, 750));
    await client.send("Emulation.setScriptExecutionDisabled", { value: false });
    const noJs = JSON.parse(await evaluate(`JSON.stringify({ trending: document.querySelectorAll('#signature .signature-card').length, overview: document.querySelectorAll('#treatments .overview-card').length, why: document.querySelectorAll('#why-coral-spa .editorial-point').length, gallery: document.querySelectorAll('#gallery figure').length, hidden: [...document.querySelectorAll('main > section')].filter((section) => { const style = getComputedStyle(section); return !section.getBoundingClientRect().height || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0; }).length })`));
    if (noJs.trending !== 3 || noJs.overview !== 3 || noJs.why !== 4 || noJs.gallery !== 5 || noJs.hidden) failures.push("No-JavaScript homepage assertion failed");

    client.close();
    console.log(JSON.stringify({ passed: failures.length === 0, checks: report.length, samples: report.filter((item) => item.label.startsWith("index.html")).slice(0, 2), revealAudit, reducedMotion, noJs, posterFallback, failures }, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    browser.kill("SIGTERM");
    server.close();
    await Promise.race([
      new Promise((resolve) => browser.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 1000))
    ]);
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch (error) {
      // A locked temporary browser cache must not mask regression results.
    }
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  server.close();
  process.exitCode = 1;
});
