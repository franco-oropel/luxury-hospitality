# Luxury Hospitality Recruitment — Website

Static site (HTML + CSS + vanilla JS). No build step, no framework.
Upload the folder to any host (Hostinger, Netlify, Vercel, GitHub Pages).

## Files

```
index.html            Home
employers.html        Employers (B2B) + hiring brief form
candidates.html       Candidates (B2C) + application form
work-and-travel.html  International programs + enquiry form
about.html            Founder story
styles.css            Shared styles (design system + responsive)
script.js             Nav, mobile menu, scroll reveals, form handling
assets/
  brand/              logo.jpeg (nav) · logo-white.png (footer)
  home/               home.mp4 · home-mobile.mp4 · home-poster.jpg
  about/              matias.jpeg · team-meeting.jpeg
```

## Activate the forms (important)

Out of the box, every form **falls back to the visitor's email client**
(opens a pre-filled message to `luxuryhospitalityhiring@gmail.com`).
That works immediately but is not ideal. To receive submissions silently
by email, point each form at a no-backend service:

1. Sign up is not required for **FormSubmit** (https://formsubmit.co).
2. In each HTML file, find the `<form ... action="">` tag and set:

   ```html
   action="https://formsubmit.co/luxuryhospitalityhiring@gmail.com"
   ```

3. Submit each form once to confirm the address (FormSubmit emails a link
   the first time). After that, submissions arrive in the inbox and the
   site shows the inline "thank you" confirmation without leaving the page.

   - The candidate form includes a file (CV) upload — FormSubmit supports
     attachments on its paid tier; on the free tier the CV arrives as a
     link/skipped. Formspree (https://formspree.io) is an alternative with
     file support.

The success message, validation, and confirmation UI already work for all
three submission paths (service, fetch, mailto fallback).

## Design system

- Burgundy `#8B1A3A` · Gold `#C8A04A` · Charcoal `#1A1A2E` ·
  Off-white `#FAF7F2` · Gray `#666666`
- Display type: **Cormorant Garamond** · Body: **Inter** (Google Fonts)
- Fully responsive, subtle scroll fade-ins, lazy-loaded imagery,
  semantic HTML, meta descriptions and alt text for SEO.

## Home video hero

The Home hero plays `assets/home/home.mp4` with `assets/home/home-poster.jpg`
as the instant first paint. Two video files are used, chosen by viewport
in `script.js`:
- `home/home.mp4` — **full** clip (includes the seminar intro). Desktop.
  The intro's first ~5s is a landscape shot letterboxed into the vertical
  frame, so `.hero-video__media { object-position: center 55% }` biases the
  framing down to push that letterbox off the top edge on landscape screens.
- `home/home-mobile.mp4` — **trimmed** to start at 5.5s (skips the letterboxed
  intro). Served on screens ≤760px, where the full vertical frame is shown
  and the letterbox could not otherwise be hidden.

To regenerate after replacing the source, with ffmpeg installed:
```
# full (desktop)
ffmpeg -y -i SOURCE.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -preset slow -crf 22 -movflags +faststart assets/home/home.mp4
# trimmed (mobile) — adjust 5.5 to where the vertical footage begins
ffmpeg -y -ss 5.5 -i SOURCE.mp4 -an -c:v libx264 -profile:v high \
  -pix_fmt yuv420p -preset slow -crf 22 -movflags +faststart assets/home/home-mobile.mp4
# poster
ffmpeg -y -ss 7 -i SOURCE.mp4 -frames:v 1 -q:v 2 assets/home/home-poster.jpg
```

## Notes

- Founder portrait: `assets/about/matias.jpeg`; team photo: `assets/about/team-meeting.jpeg`.
- Logos: `assets/brand/logo.jpeg` (nav) and `assets/brand/logo-white.png` (footer).
- Phone/WhatsApp links use `+971 52 8130 039`.
- To add a favicon, drop a file in `assets/brand/` and add a
  `<link rel="icon" href="assets/brand/favicon.png">` to each page `<head>`.
