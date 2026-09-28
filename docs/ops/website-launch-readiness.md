# Works. — indulás előtti ellenőrzés

## Állapot

A fejlesztői változtatások **nem kerültek élesbe**. DNS-beállítás, domainátkapcsolás és új előfizetés nem történt.

**A végleges indulás még feltételes:** külső kiesésriasztás nincs bekapcsolva, az elsődleges domaint és a régi URL-ek átirányításait még jóvá kell hagyni. A helyi teszt nem igazolja a majdani domain TLS-, cache-, tömörítés- vagy beküldési működését.

## Healthcheck és hibakezelés

- `GET` / `HEAD /healthz`: fut a website-szerver; JSON, 200, nem gyorsítótárazható.
- `GET` / `HEAD /readyz`: használható HU/EN statikus build és hivatkozott helyi erőforrások; JSON, 200 vagy 503, nem gyorsítótárazható.
- A Railway kiadási próba a `/readyz` végpontot használja. Ez **nem folyamatos uptime-monitor és nem riasztás**.
- CMS, Mailchimp vagy Resend kiesése nem állítja le az önmagában kiszolgálható statikus oldalt. A formokat és CV-feltöltést külön kell figyelni.
- Hibás JSON, túl nagy kérés és váratlan API-hiba nem ad vissza stack trace-t vagy szolgáltatói titkot.
- Külső szolgáltatóhívások időkorlátosak. Egy lejárt időkorlát önmagában nem bizonyítja, hogy a távoli művelet nem történt meg; a beküldéseket ne próbáljuk korlátlanul újra.

## Külső figyelés — nem aktív

A Better Stack csatlakoztatása nem történt meg; nincs létrehozott monitor vagy címzett. Későbbi bekapcsoláshoz szükséges:

1. Jóváhagyott szolgáltatás és értesítési címzett/csatorna.
2. Az éles, nem fejlesztői URL `/readyz` ellenőrzése, a JSON és státusz vizsgálatával.
3. Külön ellenőrzés az űrlapokat kiszolgáló Replit szolgáltatás és a CV-t fogadó Strapi számára.
4. Kiesés és helyreállás értesítési tesztje kontrollált tesztmonitorral, az éles szolgáltatás leállítása nélkül.

A rendelkezésre álló külön API `/api/healthz` végpontja csak liveness; nem igazolja a levélküldést vagy a Mailchimp-hozzáférést. A passzív ellenőrzés nem küldhet e-mailt, nem irathat fel és nem tölthet fel CV-t.

## Saját domain — jóváhagyás után

- Erősítsük meg a pontos elsődleges HTTPS origint és a `www` használatát; a kódbeli engedélyezett domainek nem helyettesítik ezt a döntést.
- A buildben a `SITE_URL` az elsődleges, a `VITE_SITE_URL` kompatibilitási beállítás. A böngésző és a prerender ugyanazt az origint használja. Az alapérték egyelőre a meglévő Railway-cím.
- A `CANONICAL_ORIGIN` futásidejű átirányítás külön kapcsoló: most nincs aktiválva. Csak a TLS/DNS és az azonos originre épült HTML ellenőrzése után állítható be.
- Az alternatív hostról a path és query megőrzésével történik 308-as átirányítás. A healthcheckek kivételek; a proxy HTTPS-átirányítását külön ellenőrizni kell. A szerver nem bízik meg tetszőleges kliens által küldött forwarded hostban.
- Ellenőrizendő: canonical, OG URL, sitemap és robots originek; HU/EN hreflang kölcsönössége csak valóban létező fordításoknál; valódi 404 ismeretlen útvonalon; nincs átirányítási hurok.
- Nincs jóváhagyott régi Squarespace URL → új URL térkép. A régi sitemap/export és fontos külső linkek alapján kell elkészíteni; ismeretlen régi címeket nem szabad mind a főoldalra irányítani.
- Kiadás előtt rögzíteni kell a korábbi működő release-t és a visszaállítás módját. A DNS-váltás és a website/CMS kiadása külön művelet.
- A képoptimalizálás új buildfüggősége miatt a gyökér `pnpm-lock.yaml` is a kiadás része. A kizárólag website-könyvtárat publikáló helper önmagában nem elég ehhez a kiadáshoz: szűk, külön ellenőrzött engedélyezési listával kell a lockfile-t is vinni, a régi Strapi-médiamentések bevonása nélkül.

## Beküldési útvonalak

| Funkció | Jelenlegi éles útvonal | Indulási ellenőrzés |
|---|---|---|
| Kapcsolat | Replit-hostolt `/api/contact/send` | A végleges frontend origin engedélyezése, Resend konfiguráció és jóváhagyott tesztlevél |
| Hírlevél | Replit-hostolt `/api/newsletter/subscribe` | Mailchimp OAuth-bridge elérhető, végleges origin engedélyezett, egyeztetett tesztfeliratkozás |
| CV | `VITE_STRAPI_PUBLIC_URL` esetén közvetlen Strapi, egyébként website `/strapi/api/cv-upload` proxy | TLS/origin/proxy helyes, fájllimit és hibaüzenet, a levélben kapott fájlhivatkozás elérhetősége, tesztfájl törlése |

Az űrlapok Replit-hostolt végpontja **szándékos**, különösen a hírlevél OAuth-hozzáférése miatt. Nem cserélhető automatikusan a Railway vagy a végleges domain azonos útvonalára. A CORS csak böngészős origin-szabály; nem spamvédelem.

## Kapcsolódó, külön kezelendő indulási kockázatok

- Publikus űrlapok spamvédelme: már külön feladat, itt nem valósult meg.
- Támogatott Strapi Node-verzió: külön feladat.
- CMS/média kiadási sorrend és megszakított tartalomfrissítés biztonsága: külön feladatok.
- A teljes biztonsági audit és valós felhasználói Core Web Vitals-adatok gyűjtése nem része ennek a célzott felkészítésnek.