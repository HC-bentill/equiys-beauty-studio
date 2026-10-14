# Equiy's Beauty Studio

Scroll-driven website for a nail, hair-extension and makeup studio.

## Run it

```bash
npm install
npm run dev      # local dev server at http://localhost:7173
npm run build    # production build into dist/
npm run preview  # serve the built site
```

## Where things live

- `index.html` – page content (hero, story chapters, shade bar, menu, hair, booking)
- `src/style.css` – design tokens and styles
- `src/main.js` – Three.js bottle + UV lamp, GSAP ScrollTrigger story, looping scroll-snap shade rail, Lottie sparkle, booking message
- `public/favicon.svg` – tab icon

## To fill in

- Studio address, hours, WhatsApp and Instagram: search `[ ` in `index.html`
- WhatsApp button: set `WHATSAPP` near the top of `src/main.js` (digits with country code, e.g. `233201234567`)
- Shade moods: edit the `shades` array in `src/main.js`

## Gallery photos

Placeholders live in `public/gallery/`. To use a real photo, drop it in that folder (e.g. `nails-chrome.jpg`)
and change the matching `src="/gallery/nails-chrome.svg"` in `index.html`. Update the `alt` text to describe the photo,
and keep `data-cat` as one of: Nails, Hands & feet, Hair, Makeup.
