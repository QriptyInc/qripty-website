# Qripty — Landing Page (Astro)

The landing page, rebuilt on [Astro](https://astro.build). Same design and
animations as the static build, now split into components — each section is
its own file, styles/scripts are centralized, and there's a clean seam
already prepared for dropping in a Rive animation later.

```
qripty-astro/
├── src/
│   ├── layouts/
│   │   └── Layout.astro        (<head>, fonts, all global CSS, script import)
│   ├── scripts/
│   │   └── animations.js       (Lenis smooth scroll + all GSAP scroll animations
│   │                             + the live demo + reusable form-success logic)
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── QuantumScan.astro   ← the hero animation (see "Rive" below)
│   │   ├── TrustSection.astro
│   │   ├── ProblemSection.astro
│   │   ├── SolutionStepper.astro
│   │   ├── LiveDemo.astro      ← the "Try It Live" scanner section (see below)
│   │   ├── Capabilities.astro
│   │   ├── Pricing.astro
│   │   ├── FAQSection.astro
│   │   ├── FinalCTA.astro
│   │   └── Footer.astro
│   └── pages/
│       ├── index.astro         (composes everything above)
│       ├── about.astro
│       ├── contact.astro
│       └── blog.astro
├── public/
│   ├── favicon.svg
│   └── assets/
│       ├── wordmark-ink.png    (your logo wordmark — light backgrounds)
│       └── wordmark-white.png  (your logo wordmark — dark backgrounds, spare)
├── astro.config.mjs
├── package.json
└── vercel.json
```

## Run it locally
```bash
cd qripty-astro
npm install
npm run dev
```
Opens at `http://localhost:4321` with hot reload — edit any `.astro` file
and the browser updates instantly.

## Build & preview a production build
```bash
npm run build      # outputs static files to dist/
npm run preview    # serves dist/ locally so you can check the real build
```
This build has already been run once end-to-end during development to
confirm every section compiles and renders — `npm run build` completed
cleanly with no errors.

## Deploy to Vercel (free)
Astro projects need zero config on Vercel — it detects `astro.config.mjs`
automatically and runs `npm run build` for you.

**Easiest — GitHub + Vercel:**
1. Push this folder to a new GitHub repo.
2. In Vercel: **Add New → Project → Import Git Repository**, pick the repo.
3. Leave every setting on its default (Framework Preset auto-fills
   "Astro"). Click **Deploy**.
4. Every future `git push` auto-deploys a preview; merging to `main`
   updates production.

**Or the CLI, without GitHub:**
```bash
npm install -g vercel
cd qripty-astro
vercel          # first deploy, follow the prompts
vercel --prod   # promote to your production URL
```

## Editing
- Copy/content changes: open the relevant file in `src/components/`.
- Shared styles (colors, spacing, animation keyframes): `src/layouts/Layout.astro`,
  inside the `<style is:global>` block — it's global on purpose, since
  section components share classes like `.btn-primary` and `.reveal`.
- Shared interactivity (scroll reveal, FAQ accordion, the stepper's
  scroll-linked line, the hero's count-up stats, the parallax tilt):
  same file, inside `<script>`.

## The scroll experience
The page now runs on [GSAP](https://gsap.com) + `ScrollTrigger` for the
animations and [Lenis](https://lenis.darkroom.engineering) for smooth-scroll
momentum — the combination most "premium-feeling" marketing sites use. All
of it lives in one file, `src/scripts/animations.js`, so it's easy to find
and tune.

What's animated, section by section:
- **Hero** — badge, headline, copy, buttons, and trust line stagger in on
  load; the scan animation scales/fades in slightly after; the background
  glow and the floating quantum notation drift at different speeds as you
  scroll past (parallax).
- **Every section headline** — eyebrow, title, and subhead fade and
  sharpen into focus (from a slight blur) as they cross into view.
- **Cards** (trust, bento, pricing) — batched and staggered, with a touch
  of scale and blur on entry rather than a flat fade.
- **"Why Now"** — the timeline items, stat pills, and CISO-question list
  each trickle in independently.
- **The 4-step process** — the progress line and traveling dot are now
  scrubbed directly to scroll position (not just triggered), so it tracks
  your scroll 1:1 instead of estimating.
- **Pricing** — the featured card gets a slightly springier entrance to
  draw the eye.
- **Footer** — the circuit trace fades up ("powers on") as it enters view.
- **Readiness stats** — the count-up and score ring now trigger when
  scrolled into view rather than on page load.
- **Hero visual pointer-tilt** — same idea as before, now eased through
  GSAP for a smoother follow.

All of it is registered once, in `initAnimations()`, called from a small
`<script>` in `Layout.astro`.

**Accessibility:** if the visitor has `prefers-reduced-motion` set, Lenis
never initializes (native scroll stays in charge) and every GSAP entrance
is skipped — content is simply present, not animated in. There's also a
`<noscript>` fallback so nothing stays invisible if JavaScript fails to
load at all.

**Bundle size:** GSAP + ScrollTrigger + Lenis + the animation code bundle
to roughly 52 KB gzipped, loaded as a single deferred module script. That's
a deliberate trade — it's the standard toolkit for this quality of motion
— but worth knowing if you're tracking performance budgets closely.

## The live demo section (`#demo`)
All three "Get Risk Assessment" buttons (nav, hero, final CTA) scroll to
`LiveDemo.astro`, which is wired to the real public scanner at
`scan.qripty.com` (a separate service — see `qripty-scanner`):

1. Someone enters a domain and hits **Scan for Quantum Risk**.
   `initLiveDemo()` (`src/scripts/animations.js`) normalizes and validates it,
   `POST`s it to `${SCANNER_URL}/scan`, and polls `GET /scan/{id}` every 2.5s
   showing the scanner's own `progress` text.
2. When the scan is done the page shows **only a summary** from the scan's
   `summary` (hosts discovered, endpoints inspected, not-PQC-ready vs
   PQC-ready counts, services detected). The scanner's public scan JSON
   deliberately leaves out the host list.
3. Below the summary, a "Get the complete report" form collects name, work
   email, company (required), job title and phone (optional) and a consent
   checkbox (required), and `POST`s it to `/scan/{id}/request-report`. The
   scanner stores the lead and **emails** a tokenised link to the HTML/PDF
   report. The report is never shown on the site — its endpoints return 404
   without that token. Errors (invalid domain, rate limit, failed scan,
   invalid details) show inline.

`SCANNER_URL` (`https://scan.qripty.com`) is a constant near the top of
`animations.js`, overridable with `PUBLIC_SCANNER_URL`: `.env` sets it to the hosted scanner
for every mode and `.env.development` overrides it to `http://localhost:8080` so `npm run dev` talks to a local scanner
(`docker compose up` in `qripty-scanner/services/scanner`) — delete that file to
dev against the hosted scanner. The scanner allows this site's origin via CORS (see its
`internal/handler/cors.go`) — update the allowlist there if this site's
domain changes. The scanner is public and unauthenticated but rate-limits
by IP; a submission past that limit surfaces as an inline error. Scanning a
domain that was scanned in the last 24h simply returns that scan, so two
colleagues asking about the same domain share one scan and each gets their own
emailed report.

## Multiple pages
The site is no longer a single page — `/`, `/about`, `/contact`, and `/blog`
all share the same `Nav` and `Footer` components (and therefore the global
styles and scroll animations for free, since `.reveal` and `.section-header`
work the same on every page).

A couple of things worth knowing:
- Nav and footer links to homepage sections use `/#platform`-style hrefs
  (not bare `#platform`) so they resolve correctly no matter which page
  you're on. The smooth-scroll click handler in `animations.js` only
  intercepts a hash link when it actually points at an element on the
  *current* page — otherwise it lets the browser navigate normally.
- `/contact` and `/blog` both use the same reusable pattern as the demo's
  email capture: a `<form data-success="...">` that swaps itself for a
  success message on submit (see `initSimpleForms()` in
  `animations.js`). No backend behind either yet — same "interaction is
  real, result is a placeholder" approach as the live demo.
- `/blog` is a "coming soon" page with a notify-me form and three topic
  teasers rather than fabricated posts — feel free to replace it with a
  real index once you have content to put there.

## Swapping in a Rive animation
`src/components/QuantumScan.astro` is deliberately isolated so the current
CSS/SVG hero animation can be replaced without touching anything else on the
page. When your `.riv` file is ready:

1. `npm install @rive-app/canvas`
2. Drop the exported file at `public/animations/qripty-scan.riv`
3. In `QuantumScan.astro`, replace the `.scan-stage` markup with a canvas
   and mount the animation in a small script, e.g.:
   ```astro
   <canvas id="quantum-canvas" class="scan-stage"></canvas>
   <script>
     import { Rive } from '@rive-app/canvas';
     new Rive({
       src: '/animations/qripty-scan.riv',
       canvas: document.getElementById('quantum-canvas'),
       autoplay: true,
       stateMachines: 'State Machine 1', // match whatever you name it in Rive
     });
   </script>
   ```
4. Keep (or restyle) `.scan-caption` and `.scan-stats-row` below it — those
   are plain HTML/CSS and don't need to change.

Everything else on the page (layout, other sections, deploy setup) is
unaffected by this swap.

## What changed vs. the single-file version
- Same visual design and copy at the core — this was a structural migration
  first, then an animation upgrade, then a content/interaction pass; not a
  full redesign.
- Split into components so each section can be edited independently instead
  of scrolling one 900-line file.
- The hero animation lives in its own component (`QuantumScan.astro`)
  specifically so a future Rive version is a contained swap.
- Scroll animation moved from a hand-rolled `IntersectionObserver` + CSS
  transitions to GSAP `ScrollTrigger` + Lenis smooth scroll — see
  "The scroll experience" above.
- Two new runtime dependencies as a result: `gsap` and `lenis` (both
  installed via npm, both included in the production bundle — nothing to
  install manually on deploy).
- Removed the nav's "Sign in" button (this isn't going to be a webapp).
- FAQ now uses a two-column grid instead of a narrow single column, a real
  GSAP height animation instead of CSS `max-height`, a plus/minus icon
  instead of a static triangle, and better answer-text contrast plus a
  highlighted open state.
- Added `/about`, `/contact`, and `/blog` pages; removed the footer's
  "Careers" link.
- Added the live scanner demo section (`#demo`) — see above — and pointed
  every "Get Risk Assessment" button at it.

