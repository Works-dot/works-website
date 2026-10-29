# Magyar blogcímek – két kiadásos átállás

## Első kiadás: csak előkészítés

A kilenc pontos pár forrása: `src/lib/blog-slug-transition.js`.
Az új HU URL-ek ugyanazt a magyar cikket adják 200-zal, mint a régi URL-ek.
A canonical, hreflang, belső linkek és sitemap még a régiek. A külön
sitemap-old.xml változatlan. Az EN URL-ekhez nem nyúlunk. Nem változik CMS-adat,
SEO-mező, dokumentumazonosító vagy publikációs állapot.

Csak a weboldal-szolgáltatást kell kiadni Railwayen; Strapi-deploy nem kell.
Ebben a fázisban a CMS-ben a kilenc slugot ne írjuk át kézzel.
A magyar SEO-mezők ettől függetlenül szerkeszthetők.
A Vercel-párok elő vannak készítve, de ebben a fázisban még nem aktiválandók.

## Ellenőrzés az első kiadás után

Mind a kilenc régi és új www-s cím legyen 200. Az új cím HTML-je magyar
cikket tartalmazzon, régi canonical URL-lel. A fő sitemap ne tartalmazza
az új aliasokat. Az EN pár maradjon elérhető a saját, akár eltérő slugján.

## Második kiadás: külön lépés, csak éles ellenőrzés után

A második kiadás még nincs ebben a változtatásban. A HU CMS-slugok átírását
publikált/draft állapotot és a többi mezőt megőrző, egyszer futó migrációval
kell elkészíteni; a weboldali feloldást a migráció sorrendjére fel kell készíteni.
Canonical, HU hreflang, fő sitemap és belső linkek az új URL-ekre váltanak.
Régi HU URL -> új HU URL közvetlen 301, a meglévő normalizálásba integrálva.
Az EN dokumentumok és URL-ek változatlanok. A sitemap-old.xml régi URL-jei
maradnak, mert a történeti címek újrafeltérképezését szolgálják.

A végleges kiadás előtti összefoglalóban szerepeljen mind a kilenc
régi -> új pár, a táblázattól való esetleges eltérés és a „DNS-teendő: nincs”.
A végleges Railway-kiadás után a felhasználó jelez a Vercel-kezelőnek,
aki aktiválja az előkészített párokat. Ezután kell a nem-www régi címek
egylépéses célba érését is ellenőrizni. Addig átmenetileg két lépés lehetséges.
