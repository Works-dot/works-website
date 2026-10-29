# Magyar blogcímek – végleges kiadás

Az első kiadás élesben ellenőrizve: kilenc régi és kilenc új HU URL 200,
régi canonical. A végleges kiadás a HU webes címeket az új slugokra váltja.
A párlista: `src/lib/blog-slug-transition.js`; a CMS dokumentumazonosítókat
a Strapi `src/hu-blog-slugs.ts` rögzíti. Teszt ellenőrzi, hogy a párok egyeznek.

## Kiadási sorrend

1. Railway: `@workspace/works-website`, Deploy Latest Commit.
   A weboldal mind a régi, mind az új CMS-slugokból az új nyilvános URL-eket
   készíti. Régi HU URL -> új HU URL közvetlen 301, query-megőrzéssel és
   perjel/format normalizálással egy menetben. Az EN slugok változatlanok.
2. Railway: Strapi CMS szolgáltatás, Deploy Latest Commit.
   Bootstrapkor automatikusan, külön változó nélkül, egy tranzakcióban csak
   az azonosított kilenc dokumentum HU draft/published sorainak slug oszlopa
   változik. Nincs publish művelet, nincs szöveg/SEO/média/reláció-módosítás.
   A korábbi és új CMS-slugot a weboldal egyaránt tudja olvasni, ezért nincs
   szükség a két szolgáltatás egyidejű kiadására.
3. A végleges weboldal kiadása után értesítendő a Vercel-kezelő az előkészített
   kilenc pár aktiválásáról. DNS-teendő nincs. Vercel-aktiválás előtt a nem-www
   címek átmenetileg két átirányítást adhatnak; csak utána igazolható a teljes
   egylépéses követelmény.

A CMS-migráció ütköző cél vagy időközben szerkesztett más slug esetén hibával
megáll és visszagörget; nem írja felül az eltérést. Újraindításkor nem ismétli
meg a befejezett migrációt, megszakadt jelölés esetén idempotensen folytatható.
A szándékosan törölt magyar változatot nem hozza létre.

## SEO és ellenőrzés

Canonical, HU hreflang, fő sitemap és belső linkek az új magyar URL-ekre
mutatnak. A nyelvi pár documentId alapján kapcsolódik, nem slug-egyezéssel.
A külön sitemap-old.xml régi URL-jei megmaradnak az újrafeltérképezéshez.
A HU SEO-mezők szerkesztői tartalmát nem írjuk át: a jóváhagyott magyar
SEO-szövegeket később töltik ki. Üres mezőnél magyar cikkcím/bevezető a fallback,
angol cikkből nem másolunk. Egy explicit angol szöveg a HU SEO-mezőben
szerkesztendő tartalom, nem automatikus nyelvi fallback.

Éles ellenőrzés: minden régi HU cím 301 közvetlenül az új www URL-re;
új oldal 200, új canonical; EN pár 200 változatlan címen, új HU hreflang;
fő sitemapban régi HU loc nincs; gclid és utm paraméterek megmaradnak.
A végleges összefoglalóban adjuk át a kilenc pontos párt és jelöljük, hogy
nincs eltérés a jóváhagyott táblázattól.
