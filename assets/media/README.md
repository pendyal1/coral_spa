# Coral Spa Media Asset Plan

`asset-manifest.json` is the production specification for the media pass. Check the production status below before referencing a planned filename from page markup.

## Production Status

Validated media currently available:

- `Home hero`: genuine landscape and portrait Pexels footage, transcoded to silent H.264 MP4 and VP9 WebM delivery files with posters extracted from the footage.
- `About hero`: genuine therapist-preparation footage, cropped below the face and transcoded to silent desktop and mobile H.264/VP9 files.
- `Services hero`: a genuine-motion sequence of massage, serum preparation and treatment-room preparation footage.
- `Contact hero`: genuine forward-moving corridor footage with visible frame-to-frame parallax; it is decorative hospitality footage and is not presented as Coral Spa's actual building.
- Source footage: [Professional Massage on Spa](https://www.pexels.com/video/professional-massage-on-spa-6187311/) and [Professional Massage](https://www.pexels.com/video/professional-massage-6186728/) by Tima Miroshnichenko, used under the Pexels license.

Poster-only media awaiting genuine footage:

- `Massages`, `Facials`, `Body Polish`, `Body Wraps`, `Hair Spa`, and `Manicure & Pedicure` have approved posters but no approved genuine video.
- Category preview video files remain rejected because they animate a single still image. They are not loaded by page markup.
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

Every filename listed in the manifest currently exists, but existence does not imply video approval. `video-audit.json` is the authority for whether a video may be loaded. Run both manifest validation and `ffprobe` after any replacement so case or codec problems do not reach GitHub Pages.

Before page implementation, validate the manifest with:

```sh
node -e "JSON.parse(require('fs').readFileSync('assets/media/asset-manifest.json', 'utf8')); console.log('manifest valid')"
```
