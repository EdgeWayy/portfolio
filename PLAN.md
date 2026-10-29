# PLAN: Akbar portfolio ("Usta")

## Concept

**Usta** is Uzbek for "master craftsman". Akbar builds websites and Telegram bots for local
businesses the way a tile master builds a Samarkand wall: small precise pieces, one pattern.

Visual language: Samarkand tilework meets Swiss print poster.

- Flat colors only, no gradients:
  - Bone paper `#F3EEE4`, Ink `#121212`
  - Lapis (Registan cobalt) `#1B3BD1`
  - Saffron (bazaar vermilion-orange) `#FF5A1F`
- The 8-point star (khatam / girih) is the brand mark, the halftone dot shape, the loader and the cursor.
- Type: **Unbounded** (wide geometric display, Cyrillic), **Onest** (body), **JetBrains Mono** (labels).
- Layout: big poster typography, hard rules, numbered sections like a printed catalog.

## Hero (the wow in 3 seconds)

WebGL fragment shader renders Akbar's portrait as a grid of 8-point stars (lapis on bone).
Star size = darkness of the photo. Cursor (or finger) is a lens that reveals the original
photo, the grid ripples around it. Scrolling grows the stars until the portrait dissolves into
a tile pattern. Fallback: pre-rendered halftone WebP (no WebGL, reduced motion, Save-Data).

## Sections

1. Loader: star draws itself, counter, split reveal
2. Hero: name, offer, CTA "Write in Telegram", WebGL portrait
3. Marquee: services and stack
4. About: original photo vs pattern (drag slider), story, honest stat counters
5. Services: websites, Telegram bots, admin panels, payment integrations (with price ranges)
6. Work: stacked case-study cards for every demo (screenshot, problem, solution, tech, result, live demo)
7. Process: 5-step timeline drawn on scroll
8. Now building / changelog
9. FAQ
10. Contact: "Get a quote" form that opens Telegram with a prefilled message
11. Footer, easter egg, 404 page

RU default + EN toggle. Mobile-first. Reduced motion respected.

## Demos (copied, never moved)

| slug | source | type |
|---|---|---|
| brumelle-coffee | portfolio-new/leon-coffee | coffee shop site |
| vortaq-fitness | portfolio-new/profit-fitnessclub | gym site (lead form mocked) |
| nagiwa-sushi | portfolio-new/sushi-house-rest | sushi restaurant |
| lirevo-flowers | portfolio-new/flower-shop | flower shop with cart/checkout |
| lumina-mall | portfolio-new/lumina-mall/lumina-mall | interactive mall map + admin |
| skynavoi-flights | new-site-with-skill | flight booking flow |

Owner request: no Telegram bot projects on the portfolio site (bots are only mentioned as a service).

Every demo gets a fixed "Demo · back to portfolio" bar injected by `tools/copy-demos.mjs`.
No .env, api/, .git, backups or test dumps are copied. `tools/check-secrets.mjs` runs before commits.

## Stack

Vite (`base` from env, default `./`), vanilla JS, GSAP + ScrollTrigger, Lenis, raw WebGL
(lazy loaded; Three.js was tried first and dropped: 130 KB gz for one full-screen shader). Python + Pillow for photo stylization. Playwright for screenshots and link tests.

## Stages

1. Structure and content  2. Photo stylization  3. Demos integration  4. Design
5. Animations  6. Polish x3 (screenshots desktop + mobile, console, links)
