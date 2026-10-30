# Reszponzív képek

A Railway website build először lekéri a CMS tartalmát, majd a prebuild
WebP-változatokat készít. Az eredeti fájlok a meglévő Strapi-tárhelyen
maradnak; a változatok a website `dist/public/media` könyvtárába kerülnek.
Nem kell új tárhely, média-migráció vagy kézi fájlmásolás.

Beállított `STRAPI_URL` esetén a generátor mindig az élő CMS-ből olvas,
nem a repó régi uploads-másolatából. Hibás/hiányzó forrás meghiúsítja a
buildet, nem készül csendben hiányos kiadás. A fájlnevek a képtartalomtól
és a transzformációtól függnek, így azonos URL-en cserélt kép is új változatot
kap. A régi generált változatok csak sikeres generálás után törlődnek.
SVG-k és animációk eredetiek maradnak, valódi méretadatokkal.

A fejlesztői `dev` előnézet az eredeti képeket használja, a manifestből
származó méretadatokkal. Így tiszta munkapéldányban sem függ a Gitből
kizárt WebP-fájloktól. A reszponzív WebP-k az éles buildben aktívak.

A meglévő CMS rebuild folyamat az új feltöltéseket is feldolgozza. A
dinamikus álláshirdetés frissen feltöltött tartalmi képe a következő website
buildig az eredeti URL-t és a CMS méreteit használja; utána reszponzív lesz.

## Ellenőrzés

- `pnpm --filter @workspace/works-website run test:images`
- `pnpm --filter @workspace/works-website run typecheck`
- `VITE_STRAPI_ENABLED=false pnpm --filter @workspace/works-website run build`
- `pnpm --filter @workspace/works-website run verify:images`

Az utolsó parancs minden generált HTML-ben ellenőrzi a képméreteket,
a loading attribútumot, srcset/sizes párt és a hivatkozott WebP fájlok
jelenlétét. Kiírja a médiafájlok számát és összméretét.

A fejlesztési adatkészlettel 122 oldal 1172 képeleme megfelelt az
ellenőrzésnek. A teljes generált médiacsomag (OG képekkel együtt) kb.
88,5 MiB. Az első képgenerálás néhány perc; meglévő tartalomazonosított
változatokkal a teljes build itt 36 másodperc volt. Railwayen az idő a
CMS-letöltéstől és az elérhető build-erőforrástól is függ.

## Kiadás

Ehhez a változáshoz csak a **Website** deploy szükséges; nincs Strapi
sémamódosítás. Push és deploy külön jóváhagyással történik.
Az éles PageSpeed Insights bloglista-mérés csak a deploy után végezhető el;
a helyi HTML- és böngészőteszt nem helyettesíti ezt.
