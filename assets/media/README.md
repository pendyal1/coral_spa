# Coral Spa Media Asset Plan

`asset-manifest.json` is the production specification for the media pass. Check the production status below before referencing a planned filename from page markup.

## Production Status

Generated and integrated media currently available:

- `Massages`: 4K desktop/mobile source masters, 8-second WebM/MP4 delivery loops and a WebP poster.
- `Facials`: 4K desktop/mobile source masters, 8-second WebM/MP4 delivery loops and a WebP poster.
- `Body Polish` and `Body Wraps`: one shared body-care presentation set, while both canonical service categories remain separate.
- `Hair Spa`: 4K desktop/mobile source masters, 8-second WebM/MP4 delivery loops and a WebP poster.
- `Manicure & Pedicure`: hands-and-feet 4K desktop/mobile source masters, 8-second WebM/MP4 delivery loops and a WebP poster.
- `About hero`: 4K desktop/mobile source masters, 10-second WebM/MP4 delivery loops and responsive WebP posters.
- `Services hero`: 4K desktop/mobile source masters, 9-second WebM/MP4 delivery loops and responsive WebP posters.
- `Contact hero`: 4K desktop/mobile source masters, 8-second WebM/MP4 delivery loops and responsive WebP posters.
- `About story` and `coral-botanical-texture`: optimized WebP images ready for integration.

Local generation masters are retained in `assets/media/source/` and excluded from Git deployment. Browser delivery uses optimized desktop and mobile files to keep GitHub Pages transfer sizes practical.

## Canonical Categories

The exact categories were read from `assets/js/services-data.js`:

1. Specials
2. Massages
3. Facials
4. Body Polish
5. Body Wraps
6. Foot Reflexology
7. Head Massage
8. De-tanning
9. Manicure & Pedicure
10. Hair Spa

These labels are business-data identifiers. Do not silently rename them in the data source. Broader editorial groupings may be used in page copy or filters, but they must map back to these exact categories.

## Global Creative Direction

Every generated image, poster and video master must follow this direction:

> Premium Indian urban wellness spa, cinematic editorial photography, dark espresso and charcoal shadows, warm amber candlelight, muted coral accents, brushed gold details, natural stone, dark wood, linen, subtle steam, soft reflections, refined and intimate rather than flashy, realistic skin and materials, sophisticated hospitality advertising, shallow depth of field, gentle camera movement, calm pacing, no text, no logos, no watermarks, no exaggerated luxury cliches, no neon colors, no fantasy architecture.

Negative direction:

> Avoid visible brand names, malformed hands, extra fingers, distorted faces, plastic skin, overly sexualized massage imagery, medical-clinic appearance, bright white salon lighting, clutter, excessive flowers, stock-photo smiles, floating objects, rapid motion, camera shake, harsh contrast, oversaturated orange, readable labels, captions or signage.

## Naming Conflicts

- `Massage` in some page copy maps to the canonical `Massages` category.
- `Skin` or `Facial / skin` is an editorial grouping, not a category. The canonical category is `Facials`; `De-tanning` remains separate.
- `Body care` is not one category. The service source has separate `Body Polish` and `Body Wraps` categories.
- `Hands and feet` is not one canonical category. `Manicure & Pedicure` covers grooming, while `Foot Reflexology` is separate.
- `Head Massage` is both a category name and a treatment name. The current slugging logic turns both into `head-massage`, producing duplicate DOM IDs. Future markup should use a namespaced category ID such as `category-head-massage` while preserving a compatibility link for existing URLs.
- `Specials` contains signature and newer rituals but must remain `Specials` in the service data unless the client approves a formal rename.

## Video Delivery Rules

Every cinematic background requires:

- WebM as the first source and MP4/H.264 as fallback.
- Separate desktop and mobile crops.
- `muted`, `autoplay`, `playsinline` and `loop` behavior.
- No audio track in the encoded file.
- A WebP poster loaded before playback.
- Poster-only behavior for `prefers-reduced-motion: reduce` and data-saving conditions.
- A calm seamless loop with no abrupt camera movement or edit: 10-14 seconds for heroes and 8 seconds for category media.
- No visible words, signs, watermarks, UI, brand marks or logos baked into generated media.

Background video is decorative and should be hidden from assistive technology. Its poster record carries descriptive alternative text for contexts where the image is presented as meaningful content.

## Image Production Rules

- Create crops from the same approved master whenever possible so desktop and mobile color and subject matter remain consistent.
- Export WebP initially; add AVIF only after browser and visual QA confirms that it provides a useful size reduction.
- Keep the focal point specified in the manifest inside the crop.
- Use a restrained warm grade that matches Coral Spa's wood, stone, espresso and coral palette without crushing shadow detail.
- Do not add generated text, certificates, staff, products or treatment equipment that the business has not confirmed.
- Decorative textures must remain subtle, seamless and non-semantic. Their alt text is intentionally empty.
- Do not upscale weak source images merely to meet the recommended resolution. Replace or reshoot them instead.

## Loading Priorities

- `critical`: hero poster and the selected hero video only. The poster should receive high fetch priority.
- `high`: above-the-fold service navigation and signature experience imagery.
- `normal`: media likely to enter the next viewport.
- `lazy`: gallery, lower-page imagery and optional surface textures.

All content images require intrinsic width and height, responsive `srcset`/`sizes`, and `decoding="async"`. Below-fold content images use `loading="lazy"`. Background videos should not be preloaded beyond metadata unless testing shows that the hero needs it.

## Existing Fallbacks

Every filename listed in the manifest currently exists. Hero videos and posters, responsive category and signature imagery, real-location gallery crops, about imagery and decorative textures are integrated or retained as ready fallbacks. Run the manifest validation after any replacement so case mismatches do not reach GitHub Pages.

Before page implementation, validate the manifest with:

```sh
node -e "JSON.parse(require('fs').readFileSync('assets/media/asset-manifest.json', 'utf8')); console.log('manifest valid')"
```
