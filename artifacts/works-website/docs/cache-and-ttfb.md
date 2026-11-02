# Cache és budapesti TTFB

## Kiadás

Csak Website build/deploy szükséges, Strapi- vagy DNS-módosítás nem.
A Railway Website régiója az ellenőrzéskor `europe-west4-drams3a`.

A build végén készül az `asset-cache.json`. A benne szereplő hash-elt
JS/CSS/font/kép URL-ek egy évig immutable cache-t kapnak. A public könyvtár
nem verziózott képei (például favicon) tartalomhash-es másolatot kapnak;
eredeti URL-jük rövid, újraellenőrzött 307-es átirányítás a verziózott URL-re.
SVG és animált képek változatlan bájtokkal kerülnek verziózott médiafájlba.

Normál HTML: `public, max-age=60, stale-while-revalidate=300`.
Ez legfeljebb hat percnyi cache-frissítési ablak, nem CDN-szolgáltatás.
API, hibák, healthcheck, cache-manifeszt és a karrier élő válaszai no-store.
Sitemap/karrier frissessége nem lazítható a gyorsítás kedvéért.

Railway buildben az előző éles kiadás asset-manifesztje a már ellenőrzött
`https://www.worksdot.hu` originről érkezik. Az új buildből hiányzó korábbi
fájlokat SHA-256 ellenőrzéssel letöltjük és 24 órán át megőrizzük a következő
buildekben is. Az első átálláskor a manifeszt 404 megengedett, mert a korábbi
kiadás HTML-je még no-cache. Egyéb HTTP-, méret- és integritáshiba leállítja
a buildet. Nincs külön tárhely: ezek a Website kiadás fájljai.
A megőrzés nem jelent korlátlan támogatást napokig nyitva hagyott régi lapoknak.

## Ellenőrzés

`pnpm --filter @workspace/works-website run test:cache`

`node artifacts/works-website/scripts/measure-budapest.mjs`

A második parancs tíz budapesti Globalping-mérőpontból mér. A TTFB a DNS,
TCP, TLS és firstByte fázisok összege, nem csak a firstByte fázis.
A mediánt és a p95-öt is közli. Új kapcsolatok, nem böngésző-cache-találatok;
a DNS-cache állapota nem kontrollált. A hiányos mérést nem minősíti sikeresnek.

Előzetes mérés (2026-11-02, a cache-változás előtti éles verzió):
10/10 HTTP 200, Budapest; TTFB minták ms-ban:
130, 127, 131, 104, 211, 124, 132, 153, 118, 119.
Medián **128,5 ms**, p95 **211 ms**. Egy minta meghaladta a 200 ms-ot;
ez nem minden látogatásra vonatkozó garancia.
Globalping mérésazonosító: `2m6YvKMgjEIdOBtt800021Qem`.
A mediáncél már teljesült, ezért CDN bevezetése jelenleg nem indokolt.

Az új kiadás éles fejléceit és a deploy utáni budapesti mérést még ellenőrizni
kell a felhasználó Website-deploya után. A lokális build nem éles elfogadás.
