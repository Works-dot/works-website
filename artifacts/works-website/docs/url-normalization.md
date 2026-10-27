# URL normalization release

The website server merges trailing-slash removal, `format` removal, the approved
legacy redirects (including `/home` → `/`), and the B2B project slug correction
before sending one redirect. It preserves the raw ordering, encoding and duplicate
values of other query parameters. GET/HEAD content routes only; API, uploads,
assets and health probes are excluded.

Content mapping exposes the corrected project slug in SSR, sitemap generation,
cached content and live CMS queries. The CMS record can retain its old slug:
the detail query accepts either spelling, but public links use the lowercase one.

## Required external configuration

Railway code cannot fix a 404 that Vercel returns before a request reaches Railway.
The apex `worksdot.hu` currently has that problem. Either:

1. Configure its existing Vercel project to compute the final destination in one
   response, including `/home`, trailing slash, `format` and the project alias.
   A blanket redirect to the identical www path is insufficient: it creates a chain.
2. With owner approval, attach `worksdot.hu` as an additional custom domain on the
   existing Railway website service and apply Railway's exact DNS requirements.
   Leave `www.worksdot.hu` as canonical. The included server middleware then handles
   host and path normalization together. Do not change mail MX/TXT records.

Neither external change is performed by a GitHub push. Complete verification
requires checking the real apex domain after the owner applies the chosen setup.

Verify each acceptance URL with `curl -I` (no `-L`), inspect Location and status,
then request that destination to ensure there is no second redirect. Include
`?gclid=TEST`, repeated UTM values and combined `format` plus trailing slash cases.
