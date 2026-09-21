# Qripty — Landing Page (Astro)

The landing page, rebuilt on [Astro](https://astro.build). Same design and
animations as the static build, now split into components — each section is
its own file, styles/scripts are centralized, and there's a clean seam
already prepared for dropping in a Rive animation later.

```
qripty-astro/
├── src/
│   ├── layouts/
│   │   └── Layout.astro        (<head>, fonts, all global CSS, global JS)
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── QuantumScan.astro   ← the hero animation (see "Rive" below)
│   │   ├── TrustSection.astro
│   │   ├── ProblemSection.astro
│   │   ├── SolutionStepper.astro
│   │   ├── Capabilities.astro
│   │   ├── Pricing.astro
│   │   ├── FAQSection.astro
│   │   ├── FinalCTA.astro
│   │   └── Footer.astro
│   └── pages/
│       └── index.astro         (composes everything above)
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
- Same visual design, copy, and animations — this is a structural migration,
  not a redesign.
- Split into components so each section can be edited independently instead
  of scrolling one 900-line file.
- The hero animation now lives in its own component (`QuantumScan.astro`)
  specifically so a future Rive version is a contained swap.
- Added a subtle pointer-parallax tilt on the hero animation (desktop only,
  off for `prefers-reduced-motion`) as a small extra touch enabled by having
  a proper build step to bundle/minify the script.
- Still zero UI frameworks (no React/Vue) — Astro ships plain HTML/CSS with
  one small vanilla JS bundle, so it stays as fast as the static version.
