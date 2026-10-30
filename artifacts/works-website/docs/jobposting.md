# JobPosting és az állások lezárása

## Adminteendő

Strapi → Career positions → a hirdetés HU és EN változata:

- Jelentkezési határidő (`validThrough`): valós határidő dátummal és időponttal.
- Foglalkoztatás típusa (`employmentType`): például FULL_TIME, PART_TIME, CONTRACTOR.
- Munkavégzés – város (`addressLocality`) és országkód (`addressCountry`, például HU).
- Ha ismert: utca/házszám, irányítószám, megye/régió.

Az eredeti közzététel automatikus. Meglévő hirdetésnél az első módosításkor a korábbi publikálási időből rögzül, új hirdetésnél az első publikáláskor. A dátumot az újrapublikálás nem írja felül.

A jelenleg ellenőrzött fejlesztési UX Researcher rekordból hiányzik a határidő, a foglalkoztatási típus, a város és az országkód. Az értékeket nem találjuk ki. A hiányos állásoldal megmarad, de hibás/részleges JobPosting helyett a jelölés kimarad. A build és a CMS publikálás naplója felsorolja a hiányzó mezőket.

## Működés

- Kizárólag aktív, publikált, nem lejárt állások kapnak jelölést, ha az adatok teljesek.
- A karrierlista és a részletoldalak a production Express szerveren minden kérésnél friss CMS-adatokból készülnek. A HTML-ben már benne van a teljes JSON-LD, JavaScript futtatása nélkül is.
- Lezárás, visszavonás, törlés vagy lejárat után a részletoldal 404, schema nélkül; a karrierlista és ajánló friss. A sitemap a kiszolgáláskor is szűri a megszűnt hirdetéseket.
- CMS-kieséskor ezek az oldalak és a sitemap 503 + Retry-After választ adnak, nem téves 404-et és nem elavult állásajánlatot. A honlap többi oldala továbbra is statikus.
- A böngészőben a karrieradatok navigáláskor, fókuszváltáskor és percenként frissülnek, production módban is.
- A Vite fejlesztési előnézet SPA; a valódi HTTP 404/503 ellenőrzése a production Express szerveren történik.
- A runtime a már használt STRAPI_URL (vagy STRAPI_PROXY_TARGET) beállítást használja, új secret nem kell. A dist/server és a dist/career-template.html a build része; ezeket a deploymentnek meg kell tartania.

## Ellenőrzések

- `node --test scripts/job-posting.test.mjs scripts/career-empty.test.mjs scripts/structured-data.test.mjs`
- Website typecheck, client és SSR build, prerender.
- Fejlesztési DB-n tranzakciós, visszagörgetett teszt: `NODE_ENV=development NODE_OPTIONS='--require dotenv/config' node scripts/career-publication.test.mjs` (a Strapi mappából).
- A buildelt rendererrel HU és EN teljes adatos fixture ellenőrzése; nem kerül fixture az éles CMS-be.
- Valódi fejlesztési CMS-sel production HTTP ellenőrzés: lista/részlet 200, hiányzó állás 404, sitemap 200.

## Kiadás és külső elfogadás

Strapi és Website frissítés is szükséges. Előbb a Strapi új mezői kerüljenek élesbe, majd a Website; a későbbi tartalomlezárás/lejárat nem igényel kézi website-deployt.

A Rich Results Test élő elfogadási feltétele még függő: az éles kiadás és egy valós hirdetés adatainak kitöltése után az adott részletoldal URL-jén kell ellenőrizni. A helyi JSON-LD/HTML tesztek nem helyettesítik ezt, és nem jelentenek Google-ellenőrzést.
