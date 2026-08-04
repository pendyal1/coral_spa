# Coral Spa Website

Static, cinematic website for Coral Spa with Home, About Us, Services and Contact Us pages. It uses plain HTML, CSS and JavaScript and requires no production build step.

Run locally:

```sh
npm run dev
```

Then open `http://localhost:4173`.

## Architecture

- `index.html`, `about.html`, `services.html`, `contact.html`: deployable page entry points.
- `assets/css/styles.css`: shared responsive layout, visual system and motion tokens.
- `assets/js/services-data.js`: single source of truth for service categories and treatments.
- `assets/js/main.js`: navigation, service rendering/filtering and page interactions.
- `assets/js/media.js`: viewport-aware video loading, playback and fallbacks.
- `assets/js/motion.js`: progressive, reduced-motion-aware section reveals.
- `assets/media/asset-manifest.json`: canonical media inventory and delivery requirements.
- `assets/media/video-audit.json`: visual authenticity status for every video group.
- `assets/media/video-probe-report.json`: generated codec, dimensions, duration and audio audit for every video file.

Run production regression and media checks:

```sh
npm test
npm run audit:videos
```

Do not add private API keys to frontend files. The reviews component reads `assets/js/google-reviews-config.js` and accepts either a secure external `endpoint` or a Google Maps JavaScript API browser `apiKey`. The committed configuration is empty, so the public site safely falls back to a direct Google Reviews link without an error.

For production reviews, copy the shape documented in `assets/js/google-reviews-config.example.js`. Prefer a serverless endpoint. If a browser key is used, restrict it to `https://pendyal1.github.io/coral_spa/*`, restrict it to only the required Maps JavaScript and Places APIs, and monitor quota and billing. Never commit an unrestricted key.

## Deploy to GitHub Pages

This is a plain static site, so GitHub Pages can publish directly from the repository root.

1. Push changes to the `main` branch.
2. In GitHub, open the repository settings.
3. Go to `Pages`.
4. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
5. Set `Branch` to `main` and folder to `/(root)`.
6. Click `Save`.
7. The site will deploy at `https://pendyal1.github.io/coral_spa/`.

All links and asset references are relative so they work beneath the `/coral_spa/` GitHub Pages project path. Keep `.nojekyll` in the repository root and verify filename casing before publishing.

After deployment, check these URLs directly:

- `https://pendyal1.github.io/coral_spa/`
- `https://pendyal1.github.io/coral_spa/about.html`
- `https://pendyal1.github.io/coral_spa/services.html`
- `https://pendyal1.github.io/coral_spa/contact.html`
