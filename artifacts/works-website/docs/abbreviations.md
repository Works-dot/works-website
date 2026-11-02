# Rövidítések a cikkszerkesztőben

A cikkek és projektek **Text Block** és **Highlight Block** tartalmi mezőiben:

1. Szerkesztési nézetben jelöld ki a rövidítést (például WCAG).
2. A mező alatt kattints a **Rövidítés** gombra.
3. Írd be a **Feloldott alak** mezőt, majd **Alkalmazás**.
4. A cikket ezután a szokásos módon mentsd és publikáld.

A jelölés későbbi módosításához helyezd a kurzort az adott `abbr` jelölésbe,
és kattints újra a Rövidítés gombra. A **Jelölés eltávolítása** csak a jelölést
távolítja el, a rövidítés szövegét nem. A Mégse nem módosít tartalmat.

Tárolási példa:

```html
<abbr title="Web Content Accessibility Guidelines">WCAG</abbr>
```

A frontend ugyanezt a szemantikus HTML-elemet állítja elő. Az idézőjelek és
speciális karakterek HTML-kódolása nem változtatja meg a feloldás értékét.
Más nyers HTML-elemek ettől nem válnak engedélyezetté. A kézzel megadott
feloldásra nem kerül rá az automatikus terminológiai magyarázat.

Nincs adatbázis-migráció vagy új kötelező mező. A kiadáshoz a Strapi
adminfelületét és a Website-ot is újra kell buildelni/deployolni.
A régi cikkeket nem kell újramenteni. A régi richtext mezők, amelyeket a
weboldal egyszerű szövegként jelenít meg, nem kapják meg ezt a vezérlőt.

A `title` böngészős magyarázat; érintőképernyőn és képernyőolvasóval nem
garantálható ugyanaz a megjelenítés/felolvasás. Fontos fogalomnál továbbra is
érdemes a feloldást a cikk olvasható szövegében is megadni.
