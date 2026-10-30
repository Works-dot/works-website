# Szerzők a cikkoldalon

## Admin használat

**Blog posts → Szerző forrása**

- `colleague`: válassz kollégát a „Szerző – kolléga” mezőben. A név, pozíció,
  kép, rövid bemutatkozás és LinkedIn URL a kiválasztott kollégától származik.
- `manual`: töltsd ki a „Kézzel megadott szerző” komponenst. Ez külső szerzőknél
  használható. A korábban kiválasztott kolléga adatai ilyenkor nem jelennek meg.

A név a kártya megjelenésének feltétele. A többi mező opcionális:
hiányzó kép/bemutatkozás/pozíció/link helyén nincs üres doboz vagy helykitöltő.
A két mód közötti váltás nem törli a másik mód adatait; csak az aktív mód látható.
Ha nem kívánsz szerzőkártyát, kézi módban töröld a kézi nevet, vagy kolléga módban
töröld a kapcsolatot. A mód explicit beállítása megvédi ezt a döntést a régi
cikkek egyszeri adatpótlásától.

**Team members:** a meglévő név/pozíció/kép mellett megadható a LinkedIn-profil és
rövid bemutatkozás. A bio fordítható. A LinkedIn-cím formátuma
`https://www.linkedin.com/in/profilazonosito/`; céges oldal, nem HTTPS vagy idegen
domain publikáláskor nem fogadható el. Strapi piszkozatként engedhet hiányos
vagy hibás adatot menteni; a weboldal a hibás linket akkor sem jeleníti meg.

A kártya kizárólag a cikk végén jelenik meg. A hero elrendezése változatlan.
A Rólunk listában csak a név válik LinkedIn-linkké, új lapon; a bio és új ikonok
nem jelennek meg ott.

## Schema

A kártya és a BlogPosting author ugyanazt az adatfeloldót használja. A kitöltött
Person mezők: name, jobTitle, image, sameAs; saját kollégánál worksFor hivatkozik
az Organization stabil @id-jára. Kézi külső szerzőnél nem állítunk Works.-munkaviszonyt.
A hiányzó mezők kimaradnak. A régi cache csak névvel is kezelhető, a törölt aktuális
szerzőt nem állítjuk vissza a cache-ből.

## Meglévő adatok és kiadás

A HU adatbázisban 25 publikált cikkből 9 rendelkezett szerzőkapcsolattal.
Ezeket megőriztük. Ugyanezeknek a dokumentumoknak a hiányzó régi EN kapcsolatai
csak a bizonyított HU szerzőazonosság és a megfelelő EN kolléga alapján tölthetők.
Az egyszeri induláskori migráció kizárólag hiányzó, még explicit móddal nem rendelkező
kapcsolatot pótol; nem publikál idegen piszkozatot, nem módosít cikket vagy médiát.
Fejlesztésben az adatpótlás után mindkét nyelv 25 cikkéből 9-nek van szerzője;
nyelvenként 16 továbbra is kézi szerkesztői azonosítást igényel.
Általános szövegemlítésből vagy egy keresztnévből nem következtetünk szerzőségre.
A további hiányzó neveket és a szakmai részleteket a szerkesztők adják meg.

Az új Website a régi CMS ismeretlen manualAuthor mező miatti konkrét 400 válaszánál
egyszer a régi populationnel próbálkozik. Más API-hibát nem fed el. A két szolgáltatás
deployja egyszerre elindítható, de az új kézi szerzőadatok használatához már az új
Strapi szükséges. A kiadás nem része a feladatnak; GitHub push és éles deploy nem történt.

## Ellenőrzés

Automatikus szerzőfeloldás/schema/URL/kompatibilitás- és kártyamegjelenítés-tesztek,
valamint a migráció forrásválasztási és ismételhetőségi ellenőrzése.
A Strapi dokumentumszolgáltatásán kézi szerző létrehozását, opcionális mezők
ürítését, forrásváltást és hibás URL publikálásának elutasítását is ellenőriztük,
teljesen visszagörgetett fejlesztési tranzakcióban. Tesztdokumentum nem maradt.
Az admin konfigurációs API igazolta az új látható/szerkeszthető mezőket és címkéket.
A produkciós VITE_STRAPI_ENABLED=false beállítással 122 oldal előrenderelése
sikeres; HU és EN oldalon a kártya és a Person már a HTML-ben is megjelenik.
A valós HU szerzőkártyát desktop és 390 px mobil nézeten ellenőriztük; SPA navigáció
után másik szerző és szerző nélküli cikk JSON-LD-je is helyes.

A Google Rich Results Test kódmódjában a generált cikk-HTML beküldése
**“Something went wrong — Log in and try again”** hibával blokkolódott.
Google-validáció nem igazolt. Az összes mező valódi adatokkal történő ellenőrzéséhez
előbb legalább egy szerző tényleges LinkedIn-profilját ki kell tölteni, majd
bejelentkezett Google-böngészőben megismételni a tesztet. Fiktív adatot nem publikáltunk.
