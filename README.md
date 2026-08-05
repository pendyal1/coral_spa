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

Do not add private or unrestricted API keys to frontend files. The reviews component reads `assets/js/google-reviews-config.js` and accepts either a secure external `endpoint` or a Google Maps JavaScript API browser `apiKey`. The committed local configuration is empty, so local and unconfigured deployments safely fall back to a direct Google Reviews link without an error.

For production reviews, add `GOOGLE_MAPS_BROWSER_KEY` as a GitHub Actions repository secret. The key must be a browser key restricted to the `https://pendyal1.github.io/*` website referrer and only the **Maps JavaScript API** and **Places API (New)**. Monitor its quota and billing. The Pages workflow injects the key into the deployment artifact; never commit the generated value or reuse an unrestricted key exposed in Git history.

The key present in commit `04a9cdf` was verified to accept an unrelated referrer. Revoke or rotate it in Google Cloud before enabling production reviews.

## Deploy to GitHub Pages

This is a plain static site. GitHub Actions publishes the repository root after generating the production reviews configuration.

1. Push changes to the `main` branch.
2. In GitHub, open the repository settings.
3. Go to `Pages`.
4. Add the restricted browser key as the repository secret `GOOGLE_MAPS_BROWSER_KEY` under `Secrets and variables` → `Actions`.
5. Under `Build and deployment`, set `Source` to `GitHub Actions`.
6. Push `main` or run the `Deploy Coral Spa to GitHub Pages` workflow manually.
7. The site will deploy at `https://pendyal1.github.io/coral_spa/`.

All links and asset references are relative so they work beneath the `/coral_spa/` GitHub Pages project path. Keep `.nojekyll` in the repository root and verify filename casing before publishing.

After deployment, check these URLs directly:

- `https://pendyal1.github.io/coral_spa/`
- `https://pendyal1.github.io/coral_spa/about.html`
- `https://pendyal1.github.io/coral_spa/services.html`
- `https://pendyal1.github.io/coral_spa/contact.html`
