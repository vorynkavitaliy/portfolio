# portfolio

Personal portfolio of Vitalii Vorynka, full-stack developer: a procedurally generated voxel night world that the visitor flies a small plane through, with the same content as a complete server-rendered text version.

Live: [vorynka.dev](https://vorynka.dev)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-r186-000000?logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?logo=greensock&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## Contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Build](#build)
- [Docker](#docker)
- [Deployment](#deployment)
- [Project structure](#project-structure)
- [The 3D world](#the-3d-world)
- [Motion](#motion)
- [Contact form and security](#contact-form-and-security)
- [SEO and indexing](#seo-and-indexing)
- [Performance budget](#performance-budget)
- [Testing](#testing)
- [Code quality](#code-quality)
- [Working with Claude Code](#working-with-claude-code)
- [License](#license)

## Overview

The site has to do one job: a recruiter or a client understands in a few seconds who the author is and wants to write. It does that in two ways over the same content.

- **World view.** A night voxel world generated in the browser. The visitor takes off, flies with the keyboard, mouse or touch stick, or lets the autopilot fly. Nine amber beacons are stations; docking at one opens a panel with motion graphics. A road map, a station bar and a minimap show where everything is.
- **Text version** (`/#text`). The same nine stations as plain server-rendered HTML: no WebGL, no JavaScript required. It is what search engines, screen readers, old devices and anyone in a hurry get.

| # | Station | Content |
|---|---|---|
| 1 | Home base | Name, role, years in production, number of projects, CV, LinkedIn |
| 2 | Full cycle | From idea to production: research, spec, frontend, backend, MVP, AI |
| 3 | Frontend | React and Next.js, Vue and Nuxt, permissions-driven UI, SEO, accessibility |
| 4 | Backend | Node.js services: NestJS, Express, queues, PostgreSQL, Redis, integrations |
| 5 | AI | LLMs in the product, RAG, agents, Claude Code harness, MCP |
| 6 | Deploy | Docker, CI/CD, server, Cloudflare, mail |
| 7 | Systems | The working stack in one table |
| 8 | This world | How this site is built |
| 9 | Contact | Email, LinkedIn and a contact form |

Principles that shape every decision:

- **Progressive enhancement.** The page is complete without JavaScript and without WebGL. 3D and motion never hold content hostage.
- **`prefers-reduced-motion` is honoured** across the scene, the panels and the HUD.
- **No database.** All copy is typed data in `src/content/`. The only server work is one contact form that sends an email over SMTP.
- **Verified facts only.** The copy names no employers and no client projects; it describes skills and kinds of work.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack, React Compiler, `proxy.ts`), React 19.3 |
| Language | TypeScript 5.9, `strict` with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` |
| 3D | three.js r186, plain (no React Three Fiber), terrain generated in a module worker; bloom from three's own addons on capable GPUs only |
| Motion | GSAP 3.15 with `@gsap/react` (`useGSAP`) and SplitText; CSS transitions for hover and focus |
| Styling | Tailwind CSS 4.3, tokens in `@theme` (`src/core/styles/`), dark theme only; Pixelify Sans and Archivo through `next/font` |
| Validation | zod 4.6 at every runtime boundary (`zod/mini` where it reaches the client) |
| Mail | Nodemailer 10 over SMTP (Resend in production, Mailpit locally) |
| Anti-spam | Cloudflare Turnstile, honeypot, minimum fill time, in-memory rate limiter |
| Tests | Vitest 5 (Node and browser mode), Playwright 1.63, axe-core |
| Tooling | ESLint 9, Prettier 3.9, Docker, GitHub Actions (deploy only) |
| Runtime | Node.js 26, npm 11 |

## Getting started

Requirements: Node.js 26+, npm 11+, Docker (for the local mail catcher and the end-to-end tests).

```bash
git clone git@github.com:vorynkavitaliy/portfolio.git
cd portfolio
npm install                     # also points git at .githooks (pre-push tests)

cp .env.example .env.local      # fill in the values, see "Environment variables"
npm run mail:up                 # Mailpit: SMTP on 127.0.0.1:1025, inbox on http://localhost:8025

npm run dev                     # http://localhost:3000
```

For local mail use `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025` and any user and password; Mailpit accepts everything and shows the messages in its web inbox. For Turnstile use Cloudflare's test keys locally.

## Environment variables

Local values live in `.env.local`, which is never committed. The template is [`.env.example`](.env.example). In production the deploy workflow writes the server `.env` from the GitHub Environment on every deploy.

| Variable | Required | Purpose |
|---|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | yes | SMTP server. Port 465 uses implicit TLS; any other non-loopback port requires STARTTLS; loopback (Mailpit) is plain |
| `CONTACT_FROM` | yes | Fixed sender address of the contact mail |
| `CONTACT_TO` | yes | Fixed recipient address |
| `CLIENT_IP_HEADER` | yes | Header that carries the client IP for the rate limiter (`x-real-ip` behind Caddy) |
| `SITE_URL` | yes, also at build time | Canonical origin. Baked into metadata, `robots.txt` and `sitemap.xml`; decides whether the build is indexable |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | yes | Cloudflare Turnstile widget. Test keys are rejected on a public production host |
| `CV_URL` | no | Link behind the «Download CV» button |

Rules:

- Server variables are validated by zod in `src/core/config/server-env.ts` and read only through `getServerEnv()`, never from `process.env` directly. A missing value fails loudly on the server, never silently.
- Secrets never reach the client bundle, logs or error messages.
- A new variable is added to the schema and to `.env.example`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server (Turbopack, HMR) |
| `npm run build` | Production build (`output: 'standalone'`) |
| `npm run start` | Serve the production build |
| `npm run verify` | Full check before handing work over: typecheck, lint, format, build |
| `npm run typecheck` | `next typegen` and `tsc --noEmit` |
| `npm run lint` | ESLint, including layer boundaries |
| `npm run format` | Prettier check; writes and fails when something was unformatted |
| `npm run test:ui` | Component tests in Chromium (Vitest browser mode) |
| `npm run test:server` | Node tests: content, world generation, flight core, server modules |
| `npm run test:e2e` | Playwright, all four projects |
| `npm run test:smoke` | Playwright core subset (about 2 minutes), run by the pre-push hook |
| `npm run test:mutate` | Mutation run over the case catalogues: every mutation must be killed by a named case |
| `npm run budget` | Byte budget of the production build (first-load JS, three, GSAP, worker, fonts) |
| `npm run perf:world` | Frame-time and draw-call measurement of the world in a real browser |
| `npm run regress` | Runs the ui, server and e2e suites and writes one failure report to `.regression/` |
| `npm run mail:up`, `npm run mail:down` | Start and stop Mailpit |

## Build

```bash
npm run build
node .next/standalone/server.js
```

- `/` is dynamic: `src/proxy.ts` creates a per-request CSP nonce and Next.js applies it to every framework script. Icons, the Open Graph image, the manifest, `robots.txt` and `sitemap.xml` are static.
- `SITE_URL` is read at build time. A build for `https://vorynka.dev` is indexable; any other host (`dev.vorynka.dev`, `localhost`) gets `Disallow: /` and `X-Robots-Tag: noindex, nofollow`.
- three.js and GSAP are never in the first-load JavaScript. The world chunk is imported after first paint, when the device passes a capability check.
- Run `next build` with `NODE_ENV` unset or `production`.

## Docker

| File | Purpose |
|---|---|
| [`docker/Dockerfile`](docker/Dockerfile) | Multi-stage build on a pinned `node:26-slim`: `deps` (`npm ci`), `builder` (`next build`, `SITE_URL` build argument), `runner` (standalone server, non-root user, health check on `/api/health`) |
| [`docker/compose.app.yml`](docker/compose.app.yml) | One app container per environment: read-only root file system, all capabilities dropped, memory and PID limits, bound to `127.0.0.1` |
| [`docker/compose.edge.yml`](docker/compose.edge.yml) | Caddy in front of both environments |
| [`docker/caddy/Caddyfile`](docker/caddy/Caddyfile) | TLS with a Cloudflare Origin certificate, real client IP only from Cloudflare ranges, body size limit, `www` redirect, `noindex` on dev |
| [`docker/compose.local.yml`](docker/compose.local.yml) | Mailpit for local development and the end-to-end tests |

## Deployment

One DigitalOcean droplet behind Cloudflare (proxy, Full strict TLS, Turnstile; Cloudflare Access on dev). GitHub Actions only builds and deploys ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

| Environment | Domain | Trigger | Image tag |
|---|---|---|---|
| dev | dev.vorynka.dev | push to `dev` | `dev-sha-<sha>` |
| prod | vorynka.dev | manual run from `main` | `prod-sha-<sha>` |

The workflow refuses prod from any branch except `main`, builds the image with the environment's `SITE_URL`, pushes it to GHCR, writes the server `.env` from the GitHub Environment, deploys over SSH and waits for the health check. Old images are pruned after 7 days.

Server bootstrap, Cloudflare and GitHub Environment setup, day-to-day commands: [`deploy/README.md`](deploy/README.md).

## Project structure

```text
portfolio/
├── src/
│   ├── proxy.ts                 Per-request CSP with a nonce
│   ├── app/                     Routes and metadata files: page, layout, icons, manifest, OG image, robots, sitemap, /api/health
│   ├── sections/                One folder per screen part
│   │   ├── home-base/           Station 1
│   │   ├── mission-brief/       Stations 2-6 and 8
│   │   ├── systems/             Station 7
│   │   ├── contact/             Station 9, form and its Server Action
│   │   └── world/               World shell, loader, HUD, header controls
│   ├── scene/                   three.js world (lazy, never imported by app/)
│   │   ├── world/               Pure generation: noise, heightmap, blocks, mesher, worker
│   │   ├── flight/              Pure flight core: steering, docking, camera
│   │   ├── runtime/             Renderer, frame loop, quality tiers, controller
│   │   ├── visuals/             Terrain, environment, actors
│   │   ├── input/ nav/ audio/   Controls, minimap and labels, Web Audio
│   │   └── stage/               Canvas owner and lifecycle
│   ├── motion/                  GSAP timelines, tokens, reduced-motion switch
│   ├── shared/                  Small components used by several sections
│   ├── content/                 All copy as typed data
│   ├── core/                    Config, styles, fonts, world store, brand icon
│   └── server/                  mail, rate-limit, request, turnstile (server-only)
├── tests/
│   ├── back/                    Vitest in Node
│   └── front/                   ui/ (Vitest browser mode) and e2e/ (Playwright)
├── scripts/                     budget, mutate, perf-world, regress
├── docker/                      Dockerfile, compose files, Caddyfile
├── deploy/                      Server bootstrap and deploy scripts
└── .githooks/pre-push           Tests before every push
```

### Layers

```text
app → sections → scene | motion | shared | content → core
server ← sections/*/actions only
```

| Layer | May import | Must not import |
|---|---|---|
| `app` | `sections`, `shared`, `core`, `content` | `scene` (only through the section's lazy loader), `server` |
| `sections/<name>` | `scene` (only `scene-loader.client`), `motion`, `shared`, `content`, `core`, its own `actions/` | another section, `app` |
| `scene` | `three`, `motion` tokens, `core` | `sections`, `content`, `server` |
| `motion` | `gsap`, `@gsap/react`, `core` | `sections`, `scene`, `server` |
| `content` | `core` types | everything else |
| `core` | nothing above it | everything above it |
| `server` | `core`, `zod`, `nodemailer` | anything client; every file imports `server-only` |

The DOM and the scene talk through one external store in `src/core/world/` read with `useSyncExternalStore`. Per-frame data (position, speed, camera) never enters it. All imports use the `@/` alias, and ESLint enforces the table above.

## The 3D world

- **Generation in a worker.** Heightmap, blocks, trees, structures, the meshed terrain and the floating letters are built in a module worker from a seed, so the main thread stays free. The worker chunk is about 11 KB gzipped.
- **Pure cores.** `scene/world/` and `scene/flight/` import neither three nor the DOM, so Node tests run them on the production code.
- **Quality tiers** `high`, `medium`, `low`, `off`, chosen by a capability probe and lowered at runtime when the frame rate stays under the floor. Bloom runs on capable GPUs only.
- **Loop gate.** The frame loop runs only in the world view, after boot, while the tab is visible and the WebGL context is alive.
- **Fallback.** No WebGL 2, a lost context or a failed worker sends the visitor to the text version with a short notice; nothing is lost.
- **No assets.** No models, no textures, no decoders: everything is procedural.

## Motion

- Panel entrance (wipe, tag, title letters, items, stats with a number roll, chips, result), the «Link established» title card and the button magnet run on GSAP inside `useGSAP` with scoped cleanup.
- All durations and easings are tokens in `src/motion/motion.tokens.ts`, mirrored as CSS custom properties.
- Only `transform` and `opacity` are animated. Text is visible in the server HTML; the hidden-then-reveal state is applied by JavaScript only when motion is allowed.
- Under `prefers-reduced-motion: reduce` the panels change instantly, the title card, flash, shake and particles are off, and Home base docks at once. Flight stays, because the visitor drives it.

## Contact form and security

The form works without JavaScript (a plain `POST` to a Server Action) and is enhanced with inline validation when scripts load. The action runs a fixed order:

1. **Rate limiter** per client IP (token bucket: 3, refill one per 10 minutes) and a site-wide bucket (20, refill one per 3 minutes), before any parsing.
2. **Anti-bot:** a hidden honeypot field and a minimum fill time. Both are answered with a silent success.
3. **Turnstile** token verified with Cloudflare.
4. **zod** schema shared with the client: name 1-80, email ≤ 254, message 10-4000, control characters stripped from single-line fields.
5. **One mail call:** fixed `from` and `to` from env, the visitor only in `replyTo`, a newline-free subject, a text body. SMTP connect and greeting time out after 10 seconds, so a blocked port fails fast.

The client gets a result code, never a provider error. Server logs carry codes only, never the visitor's message or address.

HTTP headers on every response: `Content-Security-Policy` with a per-request nonce and `'strict-dynamic'` (no third-party origin except Turnstile), `Strict-Transport-Security` (2 years), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone, geolocation and payment. Server Action bodies are capped at 16 KB.

## SEO and indexing

- Metadata from typed content: title, description, keywords, canonical, Open Graph and Twitter cards, a generated 1200×630 Open Graph image.
- Structured data: a `ProfilePage` with a `Person` as `mainEntity` (name, job title, description, image, LinkedIn, `knowsAbout`, city).
- Icons: SVG, PNG 192 and 512, an Apple touch icon and a web manifest, all generated from one design.
- One `h1` (the name) and an `h2` per station, in the world view and in the text version.
- `robots.txt` and `sitemap.xml` (with `lastmod`) are built for the production host only. Every other host is `noindex`.

Lighthouse mobile on the production build: Accessibility 100, Best Practices 100, SEO 100.

## Performance budget

Measured by `npm run budget` on the production build (KB = 1000 bytes):

| Item | Measured | Budget |
|---|---|---|
| First-load JS for `/` | 123.9 KB brotli | ≤ 130 KB |
| three.js chunk (lazy) | 155.5 KB gzip | ≤ 200 KB target, 250 KB cap |
| GSAP chunk with the HUD (lazy) | 39.5 KB gzip | ≤ 45 KB |
| World worker | 11.4 KB gzip | ≤ 15 KB |
| three.js or GSAP in first load | 0 chunks | 0 |
| Font families and files | 2 and 2 | ≤ 2 and ≤ 2 |
| Models, textures, audio files | 0 | 0 |

The largest contentful paint is text in the server HTML, never the canvas, and the canvas container reserves its space, so the layout does not shift.

## Testing

| Suite | Runner | What it covers |
|---|---|---|
| `tests/back/` | Vitest, Node | Content facts and forbidden words, world generation, flight and docking, camera, quality tiers, motion timelines, store actions, server modules (mail, limiter, client IP, Turnstile), indexing |
| `tests/front/ui/` | Vitest browser mode, Chromium | Sections, HUD, contact form, scene overlays |
| `tests/front/e2e/` | Playwright | First screen, flight and autopilot, HUD, text version, contact flow against Mailpit, SEO, security headers, axe accessibility checks |

Playwright runs four projects: `desktop-1440`, `mobile-390`, `no-webgl` and `reduced-motion`.

Tests follow a no-fitting pattern: every suite has a case catalogue whose expected values come from the spec, the security rules or the owner's decisions, never from the product's own output. Each case has exactly one test, and a mutation file lists code changes that a named case must catch (`npm run test:mutate`).

The pre-push hook (`.githooks/pre-push`) runs `test:ui`, `test:server` in shuffled order and `test:smoke`. A failing step cancels the push.

## Code quality

Run `npm run verify` before handing over any change.

### ESLint

Configuration: [`eslint.config.mjs`](eslint.config.mjs), flat config on `eslint-config-next` with `eslint-config-prettier` and the TypeScript import resolver.

| Rule | Requirement |
|---|---|
| `@typescript-eslint/no-explicit-any` | No `any`; unknown data is `unknown` and parsed with zod |
| `@typescript-eslint/no-non-null-assertion` | No `!` |
| `@typescript-eslint/consistent-type-definitions` | `type`, not `interface` |
| `@typescript-eslint/consistent-type-imports` | Type-only imports in a separate `import type` |
| `@typescript-eslint/ban-ts-comment` | No `@ts-ignore`; `@ts-expect-error` only with a reason |
| `curly: all`, `arrow-body-style: always` | Braces everywhere, block bodies with an explicit `return` |
| `no-console` | Only `console.warn` and `console.error` |
| `import/no-default-export` | Named exports only, except Next.js convention files |
| `no-restricted-imports` | `@/` alias only, and the layer table above |

### Prettier

Configuration: [`.prettierrc`](.prettierrc). Single quotes, semicolons, trailing commas, width 100, LF, `prettier-plugin-tailwindcss` sorting classes against `src/core/styles/globals.css`.

### Conventions enforced by review

- No comments in code. Names and types carry the meaning.
- Discriminated unions for states, `as const` objects instead of enums, explicit return types on exports.
- File names are kebab-case with a role suffix: `.component.tsx`, `.client.tsx`, `.action.ts`, `.types.ts`, `.constants.ts`.
- Colours, sizes and durations come from tokens; no arbitrary Tailwind values.

## Working with Claude Code

The site was built by one developer with Claude Code, through an agent workflow: a spec first, then a plan, then implementation by specialist agents, then a two-stage code review and an independent audit of the tests. Guard hooks stop agents from reading secrets or writing to git, and evals check that the guards hold. That harness (agents, rules, skills, hooks, the task board) lives only on the author's machine and is not part of this repository.

## License

[MIT](LICENSE)
