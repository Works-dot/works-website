# Mobil carousel: függőleges belső görgetés

## Bizonyított ok

A meglévő localhost:80 preview-n, mobil Chromium 390×844 nézetben,
natív CDP `Input.dispatchTouchEvent` bemenettel reprodukálódott a hiba.
Nem hover-animáció: a mobil BlogCard animációja ki van kapcsolva,
a kártyák számított transzformációja `none`.

Az `overflow-x:auto` mellett az implicit `overflow-y:visible` számított
értéke **auto**. A háromsorosra vágott szövegben lévő, képernyőolvasóknak
szánt abszolút pozicionált `.sr-only` elemek megnövelik a track függőleges
görgetési tartományát. Az eredeti track `clientHeight=525`,
`scrollHeight=690`. Kizárólag a `.sr-only` leszármazottak diagnosztikai
DOM-eltávolítása ugyanabban a nézetben `scrollHeight=525` értéket adott.
Ez csak izolációs próba volt: a javítás **nem távolít el akadálymentes
szöveget**, és nem változtatja a kártyák megjelenését.

## Kontrollált előtte–utána mérés

A regresszióteszt összehasonlító módja ugyanazon DOM-on, tartalmon és
viewporton csak az overflow-y értékét váltja az eredeti auto és a
javított hidden között. 144 px felfelé húzó ujjmozdulat:

| HU 390 px | eredeti | javított |
|---|---:|---:|
| track magasság / scrollHeight | 525 / 690 | 525 / 690 |
| track scrollTop, előtte → utána | 0 → 129 | 0 → 0 |
| kártya trackhez viszonyított top | 0 → −129 | 0 → 0 |
| dokumentum scrollY | 4439 → 4439 | 4439 → 4568 |
| vízszintes swipe utáni scrollLeft | — | 350 |
| átlós swipe utáni scrollLeft | — | 350 |

A production változtatás egyetlen célzott `overflow-y-hidden` osztály
a közös MobileCarousel sávján. Megmarad a `contain:paint`, a vízszintes
snap és a böngésző alapértelmezett érintéskezelése. Nincs `touch-action:
pan-x`, globális scrolltiltás vagy zoomtiltás.

## Ellenőrzés

```sh
cd artifacts/works-website
CAROUSEL_AXIS_COMPARE=1 node scripts/test-mobile-carousel-axis.mjs
node scripts/test-mobile-width.mjs
pnpm run typecheck
```

- Az új CDP érintéses próba sikeres HU/EN 320, 390 és 430 px-en,
  mindkét főoldali carouselre, továbbá a `/szolgaltatasok/ux-ui-design`
  kapcsolódóprojekt-sliderére 390 px-en: **13 track-eset**.
- Felfelé és lefelé húzáskor a dokumentum görgetődik, nem a kártyák a
  sávon belül. Függőleges, vízszintes és átlós gesztus közbeni összes
  mintában track scrollTop és relatív kártyatop **0**.
- A többkártyás blogslider vízszintes és átlós swipe után 320/390/430
  px-en rendre **280/350/390 px** scrollLeft értékre snapel.
- A szolgáltatásoldali többkártyás project carousel swipe-ja és
  pontnavigációja működik. A főoldali projektadat jelenleg egykártyás:
  ott jogosan nincs vízszintes elmozdulás vagy pontnavigáció.
- Első/utolsó pont natív tap és a kiválasztott állapot ellenőrizve;
  **7 tényleges kártyalink-navigáció** sikeres natív érintéssel.
- A korábbi szélességi regresszió **12/12** sikeres; typecheck és
  `git diff --check` sikeres.
- A javított blogszakasz 390 px-es képe:
  `screenshots/task240-blog-axis.jpg`.

## Korlátok

A tesztek a meglévő fejlesztői preview-n futottak, nem Railway-en.
Nem történt push, deploy vagy új szerver indítása e helyi ellenőrzésben.
A natív CDP érintés Chromium mobil-emuláció, nem valódi telefon.
Safari/WebKit és iPhone gumiszerű overscroll-viselkedése e környezetben
nincs igazolva; a korábban dokumentált hiányzó WebKit rendszerkönyvtárak
miatt ilyen teszt nem állítható. A screenshot önmagában nem bizonyít
gesztushelyességet; a fenti DOM-mérés és az A/B próba az alap.