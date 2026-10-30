# Automatikus OG-képek

## Szerkesztőknek

A cikk és projekt **kiemelt képe** lesz a megosztási kép forrása. E két oldaltípusnál
ez elsőbbséget élvez a külön SEO OG-kép mezővel szemben. A képfájl eredetije és
az oldalon látható hero/listakártyák nem változnak.

A dedikált OG-változat JPEG, 1200×630 pixel, középre vágott és helyes tájolású.
Az arányra vágás az eredeti kép szélét levághatja; a cél az, hogy a LinkedInnek
ne kelljen további vágást végeznie. Kis forrásképnél nagyítás történik, új részlet
nem keletkezik. Áttetsző háttér fehérre kerül, animációnál az első képkocka szerepel.

A Media Library alternativeText mezője kerül az og:image:alt mezőbe. Üres alt
esetén a meta kimarad: nem helyettesítjük másik kép vagy a cikk címével.
Kép nélkül a meglévő opengraph.jpg valóban 1200×630-ra alakított változata szerepel,
hamis alt nélkül.

Publikálás/képcsere után a meglévő CMS → Website rebuild folyamat készíti el az új
képet. Az alt módosítása is az új buildben kerül az előrenderelt HTML-be.

## Fejlesztés és kiadás

A Vite buildStart hook az aktuális CMS-cache minden HU/EN cikkének és projektjének
képéből generál, mind a kliens-, mind az SSR-build előtt. Így a kiadási build
korábbi fetch-strapi-data lépése után már az új források kerülnek feldolgozásra,
akkor is, ha közvetlenül vite build fut és nem a package prebuild.

Ha STRAPI_URL meg van adva, a kép **mindig az aktuális CMS-ről** töltődik le, a
repóban esetleg meglevő azonos nevű régi feltöltést nem használjuk helyette.
STRAPI_URL nélkül a helyi uploads könyvtárból olvasunk. Nem engedünk tetszőleges
idegen URL-t vagy átirányítást; idegen CDN használata előtt annak forrásengedélyezését
külön kell kialakítani. Hibás/hiányzó megadott kép megszakítja a buildet.

A generált fájlok public/media/og alá kerülnek, Gitből és Replit forrásfeltöltésből
kizárva; a build állítja elő és másolja őket a kiszolgált distbe. Az URL a
forrásbájtokat és a transzformációt hash-eli. Azonos URL mögötti tartalomcsere
is új kimeneti URL-t kap. A kis manifest szövegfájl, a build újragenerálja.
A generátor nem ír át CMS-tartalmat.

Fejlesztésben a buildnél frissebb, élő CMS-válasz új, még nem generált képénél
a konzol rebuild szükségességét jelzi; az eredeti képhez nem állítunk be
hamis 1200×630 méreteket. A produkció a buildkor rögzített snapshotot használja.

**Csak a Website kiadása szükséges; nincs Strapi-sémaváltozás.**
E feladatban GitHub-push és éles deploy nem történt.

## Ellenőrzések

- `pnpm --filter @workspace/works-website test:og`
- Produkciós beállítású build után:
  `pnpm --filter @workspace/works-website verify:og`
- A képfeldolgozási tesztek középpontot jelölő forrással ellenőrzik a vágást,
  az EXIF-tájolást, a valódi JPEG-méretet, a friss CMS-forrás elsőbbségét és a hibákat.
- 92 HU/EN részletoldal kész HTML-je és 46 ténylegesen kiszolgált OG-képe
  átment a HTTP-ellenőrzésen. A tartalék képpel együtt 47 forrás generálódott.
- Altcsere és más oldaltípusra váltás törli az elavult alt/méret-metákat.
  A szerző- és dátumtesztek, valamint a meglévő szervertesztek is sikeresek.
- A jelenlegi HU cache-ben 21 projekt kiemelt képének nincs altja. Ezeket
  nem töltöttük ki kitalált szöveggel; a cikkek altjai rendelkezésre állnak.

## Éles elfogadási ellenőrzés

Kiadás után egy friss, nyilvános cikk URL-jét kell megnyitni a LinkedIn Post
Inspectorban. Ellenőrizendő a képes előnézet, a további nem kívánt vágás hiánya,
valamint a publikus HTML og:image és BlogPosting image URL-jének pontos azonossága.
Szükség esetén újraolvastatás kell a LinkedIn régi cache-ének frissítéséhez.

**LinkedIn Inspector-eredmény még nincs:** az új kód nem került élesbe, ezért
azt a külső szolgáltatásban most nem lehet érdemben ellenőrizni. A helyi HTTP-
és képméret-ellenőrzés nem helyettesíti ezt az elfogadási lépést.
