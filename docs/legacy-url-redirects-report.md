# Régi URL-ek — ellenőrzés

A feltöltött CSV első két oszlopa alapján 29 pontos útvonal szerepel a
redirecttérképben. A felhasználó döntése szerint az `/imprint` és `/terms`
nem a hiányzó `/impresszum` oldalra, hanem közvetlenül a magyar lábléc
aktuális CMS impresszum-PDF-jére vezet.

A prerender ugyanabból a `getLocaleFallback("legalDocuments", "hu")`
snapshotból készíti a szerveroldali `dist/legacy-redirects.json` manifestet,
mint amit a lábléc használ. A production szerver induláskor kötelezően
beolvassa és validálja; hiányzó vagy sérült manifest esetén hibát jelez.
A fájl nincs a publikus statikus könyvtárban. CMS-publikálás után a normál
website build frissíti a PDF-célt is, kérésenkénti CMS-függőség nélkül.

## Eredmények

- Élő javítás előtti `/user-research`: **404**.
- HTTP regresszió: mind a 29 pár GET/HEAD, záróperjeles és query-s
  változata **301**, pontos Location értékkel (232 kérés).
- A redirect a host-kanonizálás előtt fut, így közvetlen www végcélt ad.
- POST nem redirectel; ismeretlen, prefixben hasonló és hiányzó API-címek
  404-ek maradnak; HU/EN főoldal, healthcheckek, asset és média elérhető.
- A kilenc szerverteszt és a website typecheck sikeres.
- Production build: **123 prerenderelt oldal**, meglévő helyi cache és
  telepített függőségek alapján; nem új production CMS fetch/frozen install.
- Külön CSV-összevetés: 29/29 forrás egyezik; a 27 normál cél változatlan.
- Mind a 12 különböző élő HTML-cél HTTP200 és megfelelő H1 tartalom;
  az impresszum HTTP200 és valódi `%PDF-` szignatúra.
- A feloldott PDF: `https://www.worksdot.hu/strapi/uploads/impresszum_7050c5625f.pdf`.

Reprodukálható helyi ellenőrzések:

```sh
cd artifacts/works-website
node --test scripts/server.test.mjs
pnpm run typecheck
pnpm run build
node scripts/test-legacy-redirect-build.mjs
```

Ez helyi kód/build- és olvasásos céloldal-ellenőrzés. Nem állítja, hogy a
régi címek az éles szerveren már átirányítanak. A GitHub push és a későbbi
Railway-kiadás külön művelet; itt deploy, DNS- vagy CMS-módosítás nem történt.