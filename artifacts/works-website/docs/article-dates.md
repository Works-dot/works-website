# Automatikus cikkdátumok

- `dateModified` és `article:modified_time`: kizárólag a Strapi `updatedAt`
  értéke, UTC ISO 8601 alakban (`...T...Z`). Hiányzó dátumot nem helyettesítünk
  build-idővel vagy mai dátummal.
- `datePublished` és `article:published_time`: a belső `originalPublishedAt` mező.
  Ezt a CMS publikáláskor rögzíti, és szerkesztés/újrapublikálás nem írja felül.
  Az adminban nem szerkeszthető, és a nyers API-ból kapott felülírást sem fogadja el.
- Meglévő cikkeknél az eredeti szerkesztői `date` mezőt használjuk; ha csak nap
  ismert, az ISO-reprezentáció UTC éjfél. Ez nem állítás az eredeti pontos óráról.
  Hiányzó szerkesztői dátumnál a korábbi publikált verzió `publishedAt` értéke
  őrződik meg. Teljesen új, dátum nélküli cikknél az első publikálás ideje rögzül.
- Újrapublikálás előtt a látogatók a korábbi publikált verzió dátumait látják.
  A visszavonás és ismételt publikálás is megtartja az első megjelenési időt.
- Azonos feloldás működik a HU/EN előrenderelt HTML-ben, a JSON-LD-ben és a
  kliensoldali navigáció során. Más oldalra navigálás eltávolítja a cikk-metákat.

A Strapi és Website frissítése szükséges. A Website a régi CMS-válasszal is
működik; a publikálási idő tartós megőrzését az új CMS garantálja.
Nincs tartalmat újrapublikáló vagy cikkek frissítési idejét átíró tömeges migráció.

Ellenőrzés:

```sh
node --test artifacts/works-website/scripts/article-dates.test.mjs
cd artifacts/strapi
NODE_ENV=development node --require dotenv/config scripts/article-publication-dates.test.mjs
```

A CMS-teszt valódi dokumentumot publikál, szerkeszt és újrapublikál egy teljesen
visszagörgetett fejlesztési tranzakcióban. Éles adatbázist elutasít; a teszttartalom
nem válik láthatóvá és nem marad meg.
