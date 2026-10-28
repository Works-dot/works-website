# Temporary old-URL sitemap

The user approved using all verified non-www counterparts of the live Hungarian
blog sitemap entries, instead of waiting for the original 15 Search Console URLs.
The static snapshot contains 26 URLs, taken from the live www sitemap. Every
listed non-www URL was checked to return 308 to its www counterpart, whose final
response was 200. This is not a Search Console export.

`public/sitemap-old.xml` is copied to `/sitemap-old.xml` by Vite. The main sitemap
generator, main sitemap and robots.txt are not modified. Do not regenerate this
historical snapshot automatically from later content changes.

After Railway deployment, verify HTTP 200 and XML content at
`https://www.worksdot.hu/sitemap-old.xml`, then submit that URL to Search Console.
No new Vercel redirects or DNS changes are needed.

After 4–6 weeks, review indexing before deleting the public XML file and deploying
again. Remove its Search Console submission as appropriate. There is no automatic
expiry; the XML can be removed independently of the main sitemap.
