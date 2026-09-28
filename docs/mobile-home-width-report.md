# Mobil főoldal szélességi hiba — ellenőrzés

## Kiváltó ok

2026-09-28-án a `https://worksdot.hu/` élő oldalán és a már futó helyi preview-n
is reprodukálódott a hiba mobil Chromiumban. A viewport meta mindkét helyen
jelen van. Az élő és a helyi build fő CSS-fájlja bájtra egyezett, de a JS
assetek neve eltért, tehát a preview-t nem tekintettük az éles kiadás
azonos másolatának.

390 CSS px széles mobilnézetben az élő oldalon a látható viewport és a
főoldal tartalma 390 px, de `window.innerWidth` és a dokumentum
`scrollWidth` **1018 px** lett; a fix fejléc 1018 px-re nyúlt. 320 px-es
nézetben ugyanez **773 px** volt. A teljes `#blog` szakasz, illetve azon
belül a mobil blogkártyák görgethető sávjának eltávolítása visszaállította
az elrendezési viewportot 390 px-re. A három blogkártya közül egyenként
eltávolított elem csökkentette a hibát. Ez a carousel belső,
képernyőn kívüli kártyáinak festési túllógása volt, nem hiányzó viewport
meta és nem a hero háttérképe. A globális `overflow-x-hidden` már jelen
volt, de nem akadályozta meg a mobil böngésző viewport-tágulását.

A javítás **kizárólag a mobil carousel görgethető sávjára** ad
`contain: paint` értéket; a kártyák továbbra is a saját sávjukban
görgethetők. A hero képe, szövege, magassága és breakpointjai nem változtak.
Az élő oldal még nem kapta meg a javítást.

## Reprodukálható ellenőrzés

A `scripts/test-mobile-width.mjs` a már futó oldal ellen fut, nem indít
szervert. Az ellenőrzés a látható és az elrendezési viewportot, a dokumentum,
body, root, fejléc, hero, main és minden főoldali szakasz szélességét méri;
végiggörgeti a szakaszokat, oldalirányú görgetést próbál, kinyitja a
mobilmenüt és a szolgáltatáslistát, valamint ellenőrzi a blog carousel
belső görgetését.

```sh
cd artifacts/works-website
MOBILE_WIDTH_TEST_URL=http://localhost:80 \
  MOBILE_WIDTH_SCREENSHOT_DIR=../../screenshots \
  node scripts/test-mobile-width.mjs
```

Chromium: HU/EN 320, 360, 390, 412 és 430 CSS px, továbbá 844×390
fekvő és 1440×900 desktop — **12/12 sikeres** a javított preview-n.
Ugyanez a teszt a változatlan élő oldal 320 px-es HU esetén
megbukott (`layout=773`, `visual=320`), tehát a regresszióteszt kimutatja
a jelentett hibát. A typecheck és production build sikeres; az utóbbi
123 oldalt prerenderelt.

A kész `dist/public` production HTML/JS/CSS HU és EN változata 390 px-es
Chromium-nézetben is ellenőrzött: a viewport, dokumentum és hero egyaránt
390 px, a carousel belső scrollLeft értéke 350 px, JavaScript pageerror nem
volt. Ehhez a preview-kérésekre a buildelt fájlokat szolgáltattuk vissza
böngészős kérésintercepcióval; ez nem éles szerverteszt.

A build elkészült `dist/public` állományait (HTML, JS, CSS és képek)
Chromiumban külön ellenőriztük a már futó preview URL-hez rendelt helyi
fájlválaszokkal, új szerver indítása nélkül. HU és EN 390 px-en a production
HTML/JS betöltésekor `visualViewport.width = innerWidth =
document.documentElement.scrollWidth = hero.width = 390`, a blog carousel
önálló görgetése mindkét nyelven működött (`scrollLeft = 350`), és nem volt
JavaScript oldalhiba. Ez két célzott, production-asset böngészőpróba;
nem azonos a teljes Railway production szerver tesztjével.

Az elkészült mobil HU/EN képernyőképek:
`screenshots/task236-chromium-hu-390.jpg`,
`screenshots/task236-chromium-en-390.jpg`. Az élő javítás előtti
Chromium-kép: `screenshots/task236-live-before-chromium-390.jpg`.
A viewport belső méreteit a képernyőkép önmagában nem bizonyítja;
a fenti DOM-mérés és a bukó élő regresszióteszt az összehasonlítás alapja.

**Korlát:** valódi Android- vagy iPhone-készüléken nem történt próba.
A Playwright WebKit böngészője letölthető volt, de az itteni hoston
a futásához szükséges rendszertárak hiányoznak (többek között
`libgstreamer-1.0.so.0`, `libgtk-4.so.1`, `libvulkan.so.1`,
`libgraphene-1.0.so.0`, `libicudata.so.74`, `libicui18n.so.74`,
`libatomic.so.1`, `libicuuc.so.74`), ezért Safari/WebKit
ellenőrzés nem állítható. Kiadás után érdemes valódi iPhone Safariban
és Android Chrome-ban is ellenőrizni a főoldalt, az alsó blogszakaszt,
a menüt és az oldalirányú görgetést.