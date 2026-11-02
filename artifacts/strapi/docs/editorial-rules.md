# Szerkesztői szabályok

## Törzsszöveg
A headingválasztó H2–H6 szinteket kínál. Mentéskor a Markdown H1 H2 lesz,
az üres headingek eltűnnek. Kódpéldákat nem módosítunk. A cikk címe adja az
oldal H1-jét. Meglévő szövegeket nem írunk át tömegesen.

## Képek
Feltöltés előtt a képkártya szerkesztőgombjával adj alt szöveget, vagy válaszd
a **Díszítő kép** jelölést. Több feltöltött képnél ezt képenként kell megadni.
A feltöltés nem indul el, amíg valamelyik képhez egyik sincs megadva.

A díszítő jelölés üres altot ment. Kikapcsolásakor újra meg kell adni az altot.
A jelölés **a médiatári képre vonatkozik minden felhasználásánál**: ha egy kép
máshol tartalmi információt hordoz, használj külön példányt a díszítő szerephez.
A Rólunk galéria korábbi szándékos üres altja megmarad; más régi képeket nem
minősítünk automatikusan díszítőnek.

Már feltöltött, alt nélküli régi képek továbbra is megjelennek, de képadat
módosításakor meg kell adni az altot vagy a díszítő jelölést. Nem képi fájlokra
(pl. PDF, önéletrajz) nem vonatkozik az alt-követelmény.

## Meta description
Legfeljebb 160 karakter, élő számlálóval. A túl hosszú szöveget nem csonkoljuk:
javítani kell a mentéshez. A számláló a Strapi/HTML hosszkorláttal egyező
UTF-16 hosszt mutatja (a szokásos magyar ékezetes betű egy, egyes emojik két
egységet foglalnak).

## Kiadás
Strapi és Website build/deploy szükséges. A Strapi új díszítő jelölőmezőjét
a szokásos sémakezelés hozza létre; nincs régi képeket átminősítő migráció.
A szabályok API-írásnál és képfeltöltési szolgáltatáshívásnál is érvényesek.
Importoknak is altot vagy tudatos díszítő jelölést kell megadniuk.

Strapi-verzióváltásnál ellenőrizni kell a szűk admin adaptereket. Nem másoljuk
le a teljes szerkesztőt vagy médiatárat; az adapter inkompatibilis forrás
esetén buildhibát ad.
