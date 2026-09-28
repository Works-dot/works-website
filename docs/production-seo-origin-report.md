# Éles SEO-domain és Railway indexelés

## Változtatás

- A közös SEO-origin alapértéke `https://www.worksdot.hu`, SSR és kliens
  ugyanazt a buildkor beégetett értéket használja.
- Régi Railway `SITE_URL` / `VITE_SITE_URL` értéknél a build explicit
  hibával megáll, nem készít észrevétlenül hibás canonicalokat. Ha mindkét
  változó be van állítva, egyezniük kell. Az általános origin-validáció és
  a helyi fejlesztés loopback támogatása megmarad.
- A pontosan ismert website Railway Host GET/HEAD oldalkérései 308-cal
  a www domainre kerülnek, útvonal és query megtartásával. Nem bízunk
  felhasználó által beállítható forwarded-host fejlécben. A www host nem
  irányul önmagára; ismeretlen és helyi hostokat nem irányítunk át
  automatikusan.
- Health/readiness, API, POST, Strapi-proxy, uploads, assets és media
  kivételek. Az átirányítás no-store, Host szerint változó válasz.
- Strapi HTML és admin válaszok `X-Robots-Tag: noindex` fejlécet kapnak.
  Az API JSON és a kép/SVG upload nem, így a publikus weboldal proxyzott
  médiáját nem tiltjuk ki. A middleware a prefix-kezelő előtt van, ezért
  annak admin-átirányítása is védett. Nincs robots.txt crawl-tiltás,
  amely elrejtené a noindex vagy átirányítás jelzését a kereső elől.

## Valóban megfigyelt címek (2026-09-28, csak olvasás)

| Cím | Kiadás előtti válasz |
|---|---|
| `https://workspaceworks-website-production.up.railway.app/` | 200 HTML, nincs X-Robots-Tag |
| `https://workspacestrapi-production.up.railway.app/` | 302 → `https://admin.worksdot.hu/strapi/admin`, nincs X-Robots-Tag |
| `https://workspacestrapi-production.up.railway.app/strapi/admin` | 200 HTML, nincs X-Robots-Tag |
| `https://admin.worksdot.hu/strapi/admin` | 200 HTML, nincs X-Robots-Tag |
| `https://www.worksdot.hu/` | 200 HTML, Railway-hikari kiszolgálás |

Ezek a kódból és nyilvános HTTP-válaszokból igazolt hostok, nem a Railway
fiók összes domainjének hiteles listája. Titkot vagy Railway változóértéket
nem olvastunk. További nem ismert tesztszolgáltatások kizárását nem állítjuk.

## Ellenőrzés

- 12/12 origin/server/CMS middleware teszt sikeres.
- Website TypeScript ellenőrzés sikeres; Strapi `tsc --noEmit` is sikeres
  (a meglévő, nem kapcsolódó Node-verzió figyelmeztetés megmarad).
- Production build sikeres a meglévő helyi CMS-cache és függőségek
  használatával (`VITE_STRAPI_ENABLED=false pnpm run build`).
  Nem történt friss éles CMS-lekérés vagy tiszta frozen-lockfile telepítés.
- A kész build összes 122 sitemap URL-je és 122 canonical HTML oldala,
  a hreflang/og:url értékek, JSON-LD és robots sitemap hivatkozása
  ellenőrzött: `pnpm run test:seo-origin`.
- A default-origin regresszió pontosan a www címet várja, így a korábbi
  Railway-alapértékkel elbukna; a régi override visszaállítását teszt tiltja.
- Raw HTTP Host-integrációteszt igazolja a www/helyi/ismeretlen host
  változatlanságát, a Railway 308-at, a query megőrzését, a GET/HEAD
  viselkedést, a health/API/media kivételeket és a POST megtartását.
- A már futó 390px preview képernyőképe ép megjelenést mutatott.
  Ez önmagában nem SEO- vagy éles deployment-verifikáció.
- Külön Chromium-próba a **buildelt prerender HTML/JS/CSS** fájlokkal,
  a meglévő preview URL kéréseinek fájlválaszos intercepciójával történt.
  Nem Vite dev bundle-t teszteltünk és nem indítottunk új szervert.
  A HU főoldal hidratációja → tényleges blogkártya-kattintás →
  EN nyelvváltó-kattintás mindhárom állapotában pontosan **1 canonical,
  1 og:url és 3 hreflang** maradt a headben, a www originre és a
  megfelelő aktuális útvonalra mutatva. A HU/EN cikkpár visszahivatkozása
  és az x-default HU-egyezése is sikeres. A HU blogkattintás ugyanabban
  a dokumentumban történt (JS markerrel igazolt kliensnavigáció).
  Betöltés: **2 buildelt HTML-dokumentum, 54 buildelt asset,
  0 JavaScript pageerror**. JSON-LD elemszám: főoldal 2, HU/EN cikk 4/4,
  minden JSON-LD parse-olható, a main tartalom minden állapotban jelen van.
- A szülő agent újraindította a website és Strapi workflow-kat.
  Ezt követően valódi HTTP GET: `/strapi/admin` **200 HTML,
  X-Robots-Tag: noindex**; `/strapi/uploads/Abacus_505ec49332.png`
  **200 image/png, X-Robots-Tag nélkül**. Ez az új middleware futó
  preview-szolgáltatáson, proxyútvonalon történő ellenőrzése, nem pusztán
  middleware unit teszt.

## Külső konfiguráció és kiadás

1. Railway website **build** változóknál `SITE_URL` és `VITE_SITE_URL`
   legyen törölve (a helyes defaultot használva), vagy mindkettő
   `https://www.worksdot.hu`. Régi értéknél a build szándékosan leáll.
2. `CANONICAL_ORIGIN` elhagyható: a konkrét website Railway-host
   átirányítása így is működik. Ha már beállították, értéke legyen
   `https://www.worksdot.hu`; Railway-originre állítva a kiszolgáló
   explicit hibával megáll, elkerülve a redirect hurkot.
3. A Strapi headerhez a **Strapi szolgáltatás** kódját is ki kell adni,
   nem elegendő csak a website buildje. Új env változó ehhez nem kell.
4. Az új build kiadása után a www és a Railway-host valós válaszain
   ellenőrizendő a teljes lánc, a sitemap és a CMS noindex. A local
   Host-teszt nem bizonyítja a külső proxy tényleges runtime Host értékét.
5. Ne töröljünk Railway-domaint a `STRAPI_URL` / `STRAPI_PROXY_TARGET`,
   buildlekérés, kép-URL-ek, admin, webhookok és monitoring függőségeinek
   üzemeltetői ellenőrzése előtt. A kód továbbra is támogatja ezeket.
   A website régi címének megtartása átirányítással megőrzi a régi linkeket.

Nem indítottunk deployt, nem módosítottunk DNS-t, Railway konfigurációt
vagy adatbázist. A noindex nem hozzáférés-védelem, és a keresőből való
eltűnés újrafeltérképezést igényel, nem azonnali.