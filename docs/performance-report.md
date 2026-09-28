# Works. launch performance report

## Method

The pre-change snapshot was built with `VITE_STRAPI_ENABLED=false` before the
responsive-image changes and copied to a temporary dist directory. The
optimized snapshot was built with the same flag after the changes. Each
snapshot was served by the existing injectable production server through an
ordinary temporary local port (`createApp`/`startServer` with an explicit
`distDir`); the benchmark did not use the Vite development server.

`scripts/perf-browser.mjs` created a fresh Chromium context for every route,
blocked service workers, and measured both 390×844 mobile and 1440×900 desktop
viewports. Resource Timing `transferSize` (falling back to
`encodedBodySize`) was used for image, JavaScript, and total transferred
bytes. No CPU or network throttling was applied, so these are reproducible
local-lab comparisons rather than field-user timings.

The temporary benchmark server mirrored the repository's existing Strapi
upload snapshot into each temporary dist so the pre-change originals and the
optimized fallback paths were measured without external network variability.
That mirror is not required by the build: `optimize-images.mjs` skips CMS
variants when the snapshot is absent and preserves `/strapi/uploads/...`
URLs for the runtime Strapi proxy.

## Before → after (one cold run per route and viewport)

Bytes are KiB. Failures are `requestfailed` / HTTP responses ≥400.

| Viewport | Route | LCP (ms) | CLS | Image bytes | JS bytes | Total bytes | Failures |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | `/` | 464 → 424 | 0.000 → 0.000 | 655 → 74 | 1255 → 1307 | 3723 → 2556 | 0 / 0 |
| mobile | `/en` | 360 → 376 | 0.000 → 0.000 | 655 → 74 | 1255 → 1307 | 3710 → 2543 | 0 / 0 |
| mobile | `/szolgaltatasok/ux-kutatas` | 420 → 428 | 0.000 → 0.000 | 708 → 7 | 1263 → 1315 | 3277 → 2529 | 0 / 0 |
| mobile | `/projektek/ux-kutatassal-megalapozott-biztositasi-ugyfelportal` | 312 → 328 | 0.000 → 0.000 | 118 → 24 | 1397 → 1449 | 2652 → 2609 | 0 / 0 |
| mobile | `/blog/bizzuk-az-ai-ra-a-felhasznaloi-visszajelzesek-elemzeset` | 424 → 484 | 0.000 → 0.000 | 63 → 16 | 1397 → 1449 | 2609 → 2615 | 0 / 0 |
| mobile | `/karrier` | 312 → 316 | 0.000 → 0.000 | 1372 → 708 | 1242 → 1293 | 2831 → 2219 | 0 / 0 |
| desktop | `/` | 408 → 424 | 0.001 → 0.000 | 1390 → 153 | 1255 → 1307 | 4458 → 2636 | 0 / 0 |
| desktop | `/en` | 408 → 392 | 0.020 → 0.020 | 1390 → 153 | 1255 → 1307 | 4445 → 2622 | 0 / 0 |
| desktop | `/szolgaltatasok/ux-kutatas` | 504 → 432 | 0.000 → 0.030 | 1408 → 82 | 1263 → 1315 | 3977 → 2604 | 0 / 0 |
| desktop | `/projektek/ux-kutatassal-megalapozott-biztositasi-ugyfelportal` | 324 → 320 | 0.001 → 0.000 | 118 → 73 | 1397 → 1449 | 2652 → 2658 | 0 / 0 |
| desktop | `/blog/bizzuk-az-ai-ra-a-felhasznaloi-visszajelzesek-elemzeset` | 484 → 440 | 0.001 → 0.000 | 89 → 87 | 1397 → 1449 | 2635 → 2686 | 0 / 0 |
| desktop | `/karrier` | 320 → 328 | 0.001 → 0.001 | 2120 → 767 | 1242 → 1293 | 3579 → 2277 | 0 / 0 |

All measured LCP values remain below the 2.5 s target and all measured CLS
values remain below the 0.1 target. The largest consistent improvement is
image transfer: home fell by about 89% on both viewports and the career page
fell by 48% mobile / 64% desktop. The small JavaScript increase is the
responsive-image runtime and its compact local/CMS manifest (about 4% in this
uncompressed local server); no font or unrelated application JavaScript was
changed.

The mobile `/en` and blog LCP readings are slower in this single local run,
but remain below target; repeat runs should be used for statistical decisions
because no lab throttling is enabled.