# GTM és SPA oldalmérés

Az `index.html` a közös HU/EN és 404 prerender sablon: a GTM-5JQBSGDS standard JavaScript-részletet és a közvetlenül `<body>` utáni standard noscript iframe-et tartalmazza. A bootstrap **nem** írja felül a meglévő `dataLayer`-t. A méréskód hibája/blokkolása nem akadályozhatja a navigációt.

## Oldalmegtekintés tulajdonosa

Az első dokumentumbetöltést kizárólag a GTM-konténer kezeli (`gtm.js` / kezdeti GA4 page_view, amennyiben a konténer beállítása ezt lehetővé teszi). A React tracker a hidratáláskori megtekintést nem küldi el. A későbbi útvonal- vagy keresésváltozásra, **a SEOHead tényleges head-frissítése és a releváns CMS-lekérések befejezése után**, egyszer küld `{event:"page_view_spa",page_path:"/path?query",page_title:document.title}` eseményt. A `page_path` a tényleges, kódolt böngészőútvonalat tartalmazza (a Wouter által eltávolított `BASE_URL` prefixszel együtt); a nyers URL külön figyelést kap, mert a Wouter dekódolt pathname/search értékei összevonhatnak eltérő kódolt URL-eket. SEO-visszaigazolás csak akkor érvényes, ha a renderelt Wouter-útvonal és a renderkor rögzített nyers URL ugyanahhoz az aktuális navigációhoz tartozik. Hash-változásra nem. Újabb navigáció eldobja az elavult eseményt. A route komponens lazy betöltése és a detail lekérdezés lezárása nélkül nincs cím-visszaigazolás; nincs időalapú heurisztika. Query-only váltás is új SEOHead-visszaigazolást kap. Az útvonalhoz nem tartozó háttéradat-lekérdezésekre nem vár.

## Hozzájárulás és korlátok

A fejléc meglévő nyelvváltója natív hivatkozás, ezért teljes dokumentumbetöltést végez: ezt a GTM kezdeti oldalmegtekintése méri, nem a SPA esemény. Ha a nyelvi útvonal kliensoldali navigációval változik, arra ugyanúgy egy SPA esemény jut.

A `works-tracking-consent-v2` kulcs új értéke: `{"version":3,"analytics":false,"advertising":false,"map":false}`. Csak ez a teljes, boolean mezőkből álló séma érvényes. A régi szöveges értékeket és a `works-cookie-consent` kulcsot figyelmen kívül hagyjuk, új döntést kérünk. A GTM előtti bootstrap az analitikából az `analytics_storage`, a hirdetésből az `ad_storage`, `ad_user_data`, `ad_personalization` jelzőket állítja. Mindegyik alapértéke `denied`. A térkép kizárólag a `map` érték alapján tölthető be.

A banner Részletes beállítások pontja és a meglévő lábléc-link ugyanazt a három kapcsolót nyitja meg. A kapcsolók szerkesztése csak a Beállítások mentése után érvényesül. Elfogadom = mindhárom engedélyezve; Elutasítom = mindhárom tiltva. Mentéskor és másik fülből érkező módosításkor `consent update`, majd `works_consent_update` érkezik. A kompatibilis `consent_state` az **analitika** állapota; az esemény a négy Google-jelzőt és a `map_consent` értéket is tartalmazza. A map-only engedély nem engedélyez mérést. Tárolóhiba esetén minden cél tiltott, a banner hibát jelez. Visszavonáskor a hozzáférhető első félhez tartozó Google-mérési sütiket töröljük; más domainek sütijeit a weboldal nem törölheti.

A Consent Mode önmagában **nem bizonyítja** a GDPR/ePrivacy megfelelést: a konténer tageit, a cookieless pingek jogalapját és a CMS/PDF jogi szövegeit külön felül kell vizsgálni. A standard noscript iframe JavaScript nélkül nem tudja olvasni a döntést, ezért nem tekinthető önmagában opt-in garanciának.

## Konténeroldali feladatok és ellenőrzés

### Új események – GTM-tervezet

Három külön Custom Event trigger, pontos eseménynévvel: `newsletter_signup`, `email_click`, `phone_click`. Mindegyikhez egy GA4 Event tag a meglévő `G-HE050PXZPC` célhellyel és azonos eseménynévvel, eseményenként egyszeri futással. További szükséges hozzájárulás: kizárólag `analytics_storage`; a beépített Consent Mode ellenőrzések maradjanak. Ne használjunk mellé párhuzamos All Links triggert, mert duplázna.

A weboldal kizárólag `{event: eseménynév}` objektumot küld, e-mail, telefonszám és űrlapadat nélkül. A hírlevélesemény csak sikeres HTTP-válasz és `ok:true, code:"subscribed"` esetén érkezik, ha beküldéskor és visszaigazoláskor is engedélyezett az analitika. Hibás válasz, reklám-only vagy régi consent nem elegendő. A mailto/tel mérés a belső elemekre és billentyűzettel aktivált linkekre is vonatkozik; a kattintást nem akadályozza. A hírlevélválasz nem különbözteti meg a már feliratkozott címet az új feliratkozástól: a mérés szerver által sikeresként visszaigazolt feliratkozási műveletet jelent, nem garantáltan új Mailchimp-kontaktot.

A fenti tervezet dokumentált, nem került automatikusan GTM-munkaterületbe vagy publikálásra. GTM Preview-ban mindhárom műveletet engedélyezett és elutasított analitikával is ellenőrizni kell; hírlevélnél hibás szerverválasszal nem lehet esemény. A korábban dokumentált extra `ad_storage` kaput az analitikai tageken előbb javítani kell. Pusztán a dataLayer jelenléte nem bizonyít GA4-adatfogadást.

### Friss read-only ellenőrzés — 2026-10-28

A publikus GTM-5JQBSGDS konténer már tartalmaz `page_view_spa` és `contact_form_success` eseménytageket, illetve `works_consent_update` inicializálási triggert. Az alábbi akadály viszont még fennáll:

- Google tag (tag_id 3, G-HE050PXZPC): extra `ad_storage` követelmény.
- GA4 page_view (tag_id 11): extra `analytics_storage` ÉS `ad_storage` követelmény.
- GA4 contact_form_success (tag_id 12): extra `analytics_storage` ÉS `ad_storage` követelmény.

**GTM-kezelő konkrét teendője:** e három tag Consent Settings / Hozzájárulási beállítások részében a további szükséges hozzájárulás legyen `analytics_storage`, az extra `ad_storage` követelményt törölje. A Google beépített Consent Mode ellenőrzéseit nem kell és nem szabad megkerülni. A Google tag egyszer/dokumentum indítása és a `works_consent_update` + `consent_state=granted` trigger maradjon meg. A GA4 Enhanced Measurement history alapú oldalmérése ne duplázza a `page_view_spa` eseményt. Hirdetési tageket ne lazítsunk erre a feltételre.

A változtatást GTM Preview-ban, majd külön engedélyezett publikálás után tiszta böngészőben kell ellenőrizni. Csak analitika: `_ga` van, `_gcl_au` nincs, collect `gcs=G101`, Google Maps iframe nincs. Elutasítás: egyik süti és térkép sincs. A weboldali eseménytesztek ezt a külső mérési eredményt nem helyettesítik. A jelenlegi konténerrel az analitika-only eset blokkolt; a weboldal nem adhat hozzá hirdetési engedélyt ennek megkerülésére. GTM-publikálás nem történt.

### Korábbi read-only ellenőrzés — 2026-09-30 08:52 UTC

A `https://www.googletagmanager.com/gtm.js?id=GTM-5JQBSGDS` nyilvános erőforrás ismételt letöltése megerősítette az alábbi megfigyelést. A konfiguráció `resource.tags` listája egyetlen `__googtag` taget tartalmaz: `G-HE050PXZPC`, `consent: ["list", "ad_storage"]`, `once_per_event: true`; az egyetlen szabály `gtm.init` eseményre indítja. A `page_view_spa` és `works_consent_update` szöveg nem szerepel a letöltésben, és a taglistában nincs Ads-konverziós tag. A letöltött válasz SHA-256 lenyomata: `7610d5186b331af7a7d16577bfe089dbb52bc888a2c6b6c7c29b8a17d944b766`. A beágyazott `resource.version: "2"` értékből nem következtetünk a GTM felületén látható publikált konténerverzióra.

Ez kizárólag a publikus konténer vizsgálata: nem igazolja a Google tag kapcsolt célhelyeit, a GA4 enhanced measurement beállításait, az Ads-fiók konverzióit, illetve az adatfogadást. A GTM / Google Analytics / Google Ads integrációkeresés nem adott elérhető kapcsolatot. Adminisztrátori hozzáférés vagy tulajdonosi közreműködés nélkül a konfiguráció és a fogadási diagnosztika nem ellenőrizhető teljesen. Nem történt konténermódosítás, publikálás vagy deploy.

Publikált, nyilvánosan olvasható konténer-erőforrásban jelenleg csak egy Google tag (`G-HE050PXZPC`) látható `gtm.init` indítási szabállyal és **extra `ad_storage` consent-gáttal**. Nem látható `page_view_spa` trigger, GA4 event tag vagy Ads konverziós tag. A `denied` default mellett az extra kapu letilthatja a kezdeti tagindítást; a konténer tulajdonosának a későbbi jóváhagyáshoz külön `works_consent_update` indítási szabályt is mérlegelnie kell. Mindez nem változtatja meg a weboldal eseményszerződését és nem indokol találomra megadott mérési ID-t vagy direkt GA konfigurációt.

A GTM/GA4 adminisztrátornak (1) be kell állítania és publikálnia a `page_view_spa` eseményre a GA4 `page_view` eseményt, a `page_path` és `page_title` paraméterekkel; (2) meg kell akadályoznia, hogy a GTM History Change és a GA4 enhanced measurement history/page_view ugyanarra a navigációra még egy oldalmegtekintést küldjön; (3) ellenőriznie kell a kezdeti oldalmegtekintést és a consent-grant utáni tagindítást; (4) ellenőriznie kell a szükséges Ads konverziós tagek, hozzájárulási feltételek, publikált konténerverzió és GA4/Ads adatfogadás állapotát Tag Assistant, GA4 DebugView és Ads diagnosztika segítségével. A forráskód és a lokális tesztek **nem igazolják** az éles deployt, sem a GA4/Ads adatfogadást vagy konverziókövetést. A korábbi elveszett mérés nem pótolható visszamenőleg.