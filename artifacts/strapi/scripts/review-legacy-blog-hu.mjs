// Editorial review pass for the generated HU translation. Run only during
// content preparation; this file is not invoked on CMS startup or deployment.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataPath = path.resolve(root, "strapi/translation/legacy-blog-hu.json");
const cachePath = path.resolve(root, "works-website/src/data/strapi-cache.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
const bySlug = new Map(data.records.map((post) => [post.slug, post]));

function replace(slug, index, before, after) {
  const block = bySlug.get(slug).content[index];
  const field = block.type === "image" ? "caption" : "content";
  if (!block[field].includes(before)) {
    if (block[field].includes(after)) return; // idempotent
    throw new Error(`Review source changed: ${slug}[${index}]`);
  }
  block[field] = block[field].replace(before, after);
}

const uxSlug = "is-the-ux-designer-a-dying-breed-mlfg5";
const ux = bySlug.get(uxSlug);
ux.title = "Kihalóban van a UX-tervező szakma?";
ux.excerpt = "Több szűk területre szakosodott UX-szakemberre van szükségünk? Élénk vita folyik erről a tervezők között. A legújabb trendek szerint talán inkább a sokoldalú, problémamegoldó szemléletű tervezőké a jövő. Generalista UX-tervezőként magam is közel érzem magamhoz ezt a gondolatot.";
ux.content[0].content = ux.excerpt;
ux.content[2].content = `Amikor elhatároztam, hogy UX-tervező leszek, zavarba ejtett a sokféle munkakör: UX/UI-tervező, product designer, UX-kutató, production designer. Világos volt, hogy tapasztalat nélkül nem kaphatok product designer állást. De pontosan miért nem?

### Korábban tanácsadóként és üzleti elemzőként dolgoztam; pályám során informatikai és üzleti projekteken segítettem az ügyfeleket, így a problémamegoldás szinte a véremben van. Minden UX-képzés, amelyen részt vettem, erre épült: hogyan készítsünk interjúkat, miért helyezzük előtérbe a felhasználókat, és hogyan alkossunk prototípusokat.`;
ux.content[3].content = "**Jelenlegi munkakörömben élménytervezőként dolgozom: ez a UX-kutató, a UX-tervező, a szolgáltatástervező, az üzleti elemző és a projektmenedzser szerepének finom ötvözete.**";
ux.content[4].content = `Azoknak, akik nem ismerik a UX-tervező kifejezést, mindig úgy magyaráztam a munkámat, hogy ez egyfajta tanácsadás. Mivel közel egy évtizedig tanácsadó voltam, a családom számára is érthető volt ez a párhuzam 🙂. Végre olyan munkakörben dolgozhattam, amelyben mindazt hasznosíthatom, amit tanácsadóként megtanultam. Mondhatnám, hogy szerencsém volt, de őszintén hiszem, hogy a hozzám hasonló generalista szemlélet különböztet meg minket más ügynökségektől.

A [Works.](https://worksdot.hu/) élménytervezőinek többsége generalista. Ebben a munkakörben elengedhetetlen, hogy tudjunk beszélni az ügyfelekkel, felhasználói interjúkat készíteni, rendszerezni a problémákat és lehetséges megoldásokat kidolgozni.`;
ux.content[5].content = "**UX-, üzleti elemzési és projektmenedzsment-eszközökkel, valamint szakértelmünkkel segítjük ügyfeleinket üzleti céljaik elérésében.**";
ux.content[7].content = `1. **UX:** Ismernünk kell a jellemző felhasználói viselkedést, a UX-elveket és a tervezési folyamatokat, valamint tudnunk kell egyszerűbb és összetettebb, alacsony kidolgozottságú prototípusokat készíteni. Ezek a készségek szorosan összefüggenek: a UX-kutatás és a tervezés együtt segít olyan termékeket létrehozni, amelyeket a felhasználók szeretnek használni. Fontos, hogy ötleteinket az ügyféllel közös workshopokon is be tudjuk mutatni az érintetteknek, és világosan megfogalmazzuk felismeréseinket és megoldásainkat.
2. Egy üzleti elemző vagy projektmenedzser szerepe elsőre szokatlannak tűnhet az élménytervező eszköztárában. **Az üzleti elemző gondoskodik arról, hogy a terv megfeleljen az ügyfél elvárásainak**, és hogy a követelmények összhangban legyenek a tervvel. Feltérképezzük a folyamatokat, [állapotdiagramokat](https://medium.com/works/how-state-diagram-can-help-designers-fa13a7f8207f) készítünk, és dokumentáljuk a terv megértéséhez szükséges információkat, hogy az ügyfél követni, a fejlesztők pedig megvalósítani tudják a terméket.
3. **És a projektmenedzsment?** Nos, ezt szívből utálja mindenki, engem is beleértve. Számomra ide tartozik a kommunikáció, a feladatok kezelése, a problémamegoldás és a projektdokumentáció, például az értekezletek jegyzőkönyvei és a retrospektívek. Ha határidőre szeretnénk elkészülni, nehéz elképzelni nélkülük egy tervezési projektet.

Ez persze nem jelenti azt, hogy mindannyian egyformán jók vagyunk hosszú üzleti specifikációk írásában, prototípuskészítésben vagy a kvantitatív kutatás adatainak elemzésében. Ez így van rendjén: különböző tudású és érdeklődésű emberekből áll a csapatunk.`;
ux.content[8].content = `***Ügynökségként mégis arra törekszünk, hogy junior élménytervezőink alapkészségeit az alapoktól építsük fel: tanuljanak meg kutatni, kezelni saját idejüket és feladataikat, majd bővítsék tovább a tudásukat.*** *A kutatás minden UX-tervező munkájának alapja: a jó UX-tervezéshez nélkülözhetetlen a felhasználókkal való kapcsolattartás és igényeik, problémáik megértése.*`;
ux.content[9].content = "Az üzleti elemzőt gyakran az üzleti és az informatikai terület közötti hídként írják le. Élménytervezőként úgy látom, hogy a felhasználók és az ügyfelek között teremtek kapcsolatot, miközben folyamatosan szem előtt tartom: a tervnek megvalósíthatónak kell lennie.";
ux.content[10].content = "**Az élménytervező tehát több, mint egy üzleti elemző és egy UX-tervező szerepének egyszerű összege.** *Ez természetesen nem jelenti azt, hogy egy tervezési projekt egyszemélyes munka lenne: mindannyiunknak szüksége van a csapat visszajelzéseire és a közös ötletelésre.*";
ux.content[11].content = `Ezért gondoskodunk róla, hogy egy projekten mindig legalább két élménytervező dolgozzon. Így tanulhatnak egymástól és erősíthetik egymás készségeit. Egy biztos: a tervezőcsapat minden tagjának értenie kell a felhasználóinkat, az üzleti szempontokat, valamint a tervezési folyamatokat és módszereket, miközben a saját projektjeit is kézben tartja.

És mi a helyzet a UI-tervezéssel? Az ügynökségi működésben, ahol egyszerre több ügyfélprojekt fut, nehéz egy időben UX- és UI-tervezőként is dolgozni. A UI-tervezéshez kreatív munkára van szükség: mockupok és hangulattáblák készítésére, számos képernyő és design system megtervezésére. A UX-tervezőnek eközben az átfogó képre kell figyelnie: a koncepcióra, az információarchitektúrára és a felhasználói utakra.`;
ux.content[12].content = "**Nem a szükséges készségek, hanem az eltérő gondolkodásmód miatt kivitelezhetetlen, sőt szinte lehetetlen egyszerre UX- és UI-munkát végezni.** *Ha szerencsénk van, és egymás után foglalkozhatunk velük, az működhet, de egy ügynökségnél jellemzően nem így dolgozunk.*";
ux.content[13].content = "Lehet, hogy a kizárólag UX-szel foglalkozó tervezőből egyre kevesebb lesz, mert egyre többféle készség kell ahhoz, hogy valaki sikeres legyen ezen a területen. Az elkövetkező években ezek a szerepek akár teljesen el is tűnhetnek, ha a vállalatok felismerik a sokoldalú élménytervezők előnyeit. De hogyan készíthetik fel a képzések a pályakezdőket erre a kihívásra? A következő cikkben ezt járjuk körül.";

const shipping = "shipping-and-receiving";
bySlug.get(shipping).excerpt = "Az online vásárlás térnyerése alapvetően megváltoztatta a mindennapjainkat: kényelmet és széles termékválasztékot kínál. Cikkünkben kérdőívek, interjúk és háttérkutatás alapján vizsgáljuk a megrendelések kiszállításával kapcsolatos felhasználói elvárásokat és tapasztalatokat.";
replace(shipping, 14, `Delivery times vary depending on the product or service.`, `A megfelelő kiszállítási idő a terméktől vagy szolgáltatástól függ.`);
replace(shipping, 14, `Clothing and electronic products should be delivered within 2-3 days, and furniture should be delivered within 1-2 weeks. Customers express dissatisfaction when there is no specified delivery window or when they receive a full-day window for the courier's arrival.`, `Ruházati cikkek és elektronikai termékek esetében a vásárlók 2–3 napos, bútoroknál 1–2 hetes kiszállítást várnak el. Elégedetlenséget okoz, ha nincs megadva a kiszállítás várható időpontja, vagy csak egy egész napos időablakot kapnak a futár érkezésére.`);
replace(shipping, 14, `For online shopping, a 1-hour time window is most appealing, but a 2-3 hour window is also acceptable.`, `Online vásárlásnál az egyórás kézbesítési időablak a legvonzóbb, de a 2–3 órás időablakot is elfogadhatónak tartják.`);
replace(shipping, 14, `It is crucial to strike a balance between delivery time and customer expectations to create a sustainable and satisfying online shopping experience.`, `A kiszállítás idejét és a vásárlói elvárásokat összhangba kell hozni a fenntartható, kielégítő online vásárlási élményhez.`);
replace("microinteractions-when-how-and-why", 4, "** KIINDÍTÓ ➡ MIKROINTERAKCIÓ ➡ VISSZAJELZÉS**", "**KIVÁLTÓ ESEMÉNY ➡ MIKROINTERAKCIÓ ➡ VISSZAJELZÉS**");
replace("microinteractions-when-how-and-why", 4, "You write your email, click the send button, and the system plays a swooshing sound, emphasizing that the email has indeed been sent.", "Megírjuk az e-mailt, a küldés gombra kattintunk, és a rendszer egy rövid, suhanó hanggal jelzi, hogy az üzenetet valóban elküldtük.");
replace("microinteractions-when-how-and-why", 4, "**Mikrointerakció:** Nyugtató hang,", "**Mikrointerakció:** Suhanó hang,");
replace("microinteractions-when-how-and-why", 4, "jó mikrokölcsönhatásnak", "jó mikrointerakciónak");
replace("microinteractions-when-how-and-why", 1, "trigger (művelet?)", "kiváltó esemény");
replace("how-do-we-pay-online", 15, "6. chart : A virtuális kártyák használatának okai", "6. ábra: A virtuális kártyák használatának okai");
bySlug.get("the-economic-effects-of-covid-19").excerpt = "A cikk a COVID-időszak online vásárlásra gyakorolt gazdasági hatásait vizsgálja: tartósak maradtak-e a járvány idején kialakult vásárlási szokások, és hogyan befolyásolhatja az akkori, erősödő infláció a fizetési és kiszállítási módok választását?";
bySlug.get("why-lofi-design-is-important-in-the-design-process").title = "Miért fontos a lo-fi tervezés a tervezési folyamatban?";
bySlug.get("how-state-diagram-can-help-designers").title = "Hogyan segítheti az állapotdiagram a tervezőket?";

const seriesSlugs = [
  "how-do-we-pay-online", "the-economic-effects-of-covid-19",
  "shipping-and-receiving", "messages-during-shipping", "issues-with-packages",
];
for (const slug of seriesSlugs) {
  replace(slug, 2, "az online rendelési fizetéssel, szállítással és kommunikációval kapcsolatban a folyamat során", "az online rendelés fizetésével, kiszállításával és a rendelés közbeni kommunikációval kapcsolatban");
  replace(slug, 2, "asztali kutatás", "másodlagos forráskutatás");
  replace(slug, 3, "Bemutatjuk vásárlóink ​​körében a preferált fizetési módokat.", "Bemutatjuk, mely fizetési módokat részesítik előnyben a vásárlók.");
  replace(slug, 3, "Megvitatjuk az online vásárlás gazdasági hatását. Megvizsgáljuk, hogy a vásárlási szokások változása a Covid időszakban folytatódott-e, és felvázoljuk, hogy a növekvő inflációs környezet hogyan befolyásolhatja a felhasználók fizetési és szállítási módokkal kapcsolatos döntéseit.", "A korabeli kutatásban megvizsgáljuk a gazdasági környezet online vásárlásra gyakorolt hatását: tartósak maradtak-e a COVID-időszakban kialakult vásárlási szokások, és hogyan befolyásolhatta az akkori infláció a fizetési és kiszállítási módok választását.");
}
replace("how-do-we-pay-online", 4, "tavaly 24 százalékkal", "a cikk megjelenését megelőző évben 24 százalékkal");
replace("the-economic-effects-of-covid-19", 4, "A Covid-időszak sok fogyasztó vásárlási szokásaiban megváltozott, és az érintésmentes és digitális megoldások kerültek a vezető helyre. Kutatásunk arra irányult, hogy a felhasználók által kikísérletezett módszerek ma már a fogyasztói magatartásuk részét képezik-e, vagy visszatértek korábbi szokásaikhoz.", "A COVID-időszakban sok fogyasztó vásárlási szokásai megváltoztak: előtérbe kerültek az érintésmentes és digitális megoldások. A kutatás idején arra voltunk kíváncsiak, hogy az ekkor kipróbált módszerek beépültek-e a vásárlási szokásokba, vagy a fogyasztók visszatértek a korábbi gyakorlathoz.");
replace("the-economic-effects-of-covid-19", 6, "nem változott lényegesen online vásárlási szokásai", "nem változtak lényegesen az online vásárlási szokásaik");
replace("the-economic-effects-of-covid-19", 10, "a kézbesítő borravalóját online intézve intézik", "a futárnak szánt borravalót is online adják");
replace("the-economic-effects-of-covid-19", 10, "45%-os válaszadóink eredményei szerint a járvány kezdete óta 22%-uk a csomagmegőrzőket, 18%-a a házhozszállítást, 5%-a pedig a kiszállítást részesíti előnyben az átvételi pontokon.", "A megváltozott szokásokról beszámoló, 45%-nyi válaszadó körében a járvány kezdete óta 22% a csomagautomatákat, 18% a házhozszállítást, 5% pedig az átvételi pontokra történő kiszállítást részesíti előnyben.");
replace("the-economic-effects-of-covid-19", 12, "a vásárlás előtti tájékoztatást", "a vásárlás előtti tájékozódást");
replace("the-economic-effects-of-covid-19", 16, "fekete péntek", "Black Friday");
replace("shipping-and-receiving", 8, "a termék már az üzletben elkészüljön", "a termék már az üzletben átvehető legyen");
replace("messages-during-shipping", 0, "Online vásárlás és kiszállítás", "Online vásárlás és kiszállítás");
replace("microinteractions-when-how-and-why", 4, "A mikrointerakció végrehajtásának elindításához minden esetben szükség van valamilyen trigger eseményre (trigger).", "A mikrointerakciót minden esetben kiváltja valamilyen esemény.");
replace("microinteractions-when-how-and-why", 4, "A triggert a felhasználó vagy a rendszer biztosíthatja. Trigger nélkül", "A kiváltó esemény a felhasználótól vagy a rendszertől is származhat. Kiváltó esemény nélkül");
replace("microinteractions-when-how-and-why", 4, "a trigger egy új e-mail érkezése", "a kiváltó esemény egy új üzenet érkezése");
replace("microinteractions-when-how-and-why", 0, "Sokkal konkrétabbak, mint a tipikus animációk, és sokkal hasznosabbak, mint egy vizuálisan mozgó elemek, amelyeket a szeszély vezérel.", "Konkrét célt szolgálnak, szemben a pusztán látványos, öncélú animációkkal.");
replace("microinteractions-when-how-and-why", 4, "**Indító:** A küldés gombra kattintva,", "**Kiváltó esemény:** Kattintás a küldés gombra,");
replace("microinteractions-when-how-and-why", 6, "remegő hang", "suhanó hang");
replace("microinteractions-when-how-and-why", 11, "### Felszólító művelet:", "### Cselekvésre ösztönzés:");
replace("microinteractions-when-how-and-why", 14, "- Használjon céltudatos mikrokölcsönhatásokat; támogatniuk kell az élményt, nem pedig beárnyékolni!", "- A mikrointerakcióknak legyen céljuk: támogassák az élményt, ne vonják el róla a figyelmet!");
replace("microinteractions-when-how-and-why", 14, "- Használjon rövid, céltudatos animációkat", "- Használjunk rövid, célzott animációkat");
replace("microinteractions-when-how-and-why", 14, "tervezési rendszernek", "design systemnek");
replace("why-lofi-design-is-important-in-the-design-process", 2, "### Proto típusok", "### Prototípustípusok");
replace("why-lofi-design-is-important-in-the-design-process", 6, "**High-fidelity (hifi) prototípus**", "**Nagy kidolgozottságú (hi-fi) prototípus**");
replace("why-lofi-design-is-important-in-the-design-process", 8, "A hifi proto továbbra is \"csak\" proto", "A hi-fi prototípus továbbra is „csak” prototípus");
replace("how-state-diagram-can-help-designers", 2, "az államok egy sorban lesznek", "az állapotok egy sorban lesznek");
replace("how-state-diagram-can-help-designers", 2, "de mi fizetjük ezt az árat", "de ez a kompromisszum ára");
replace("how-state-diagram-can-help-designers", 2, "nem jelenti azt, hogy nem mondhatja meg, hogy mit és hogyan szeretne. megmutatom mire gondolok.", "nem jelenti azt, hogy ne fejezhetnénk ki magunkat másképp. Mutatom, mire gondolok.");
replace("how-state-diagram-can-help-designers", 6, "nincs hézag", "nincs lefedetlen eset");

for (const record of data.records) {
  const cached = cache.hu.blogPosts.find((post) => post.documentId === record.documentId && post.slug === record.slug);
  if (!cached || cached.content.length !== record.content.length) throw new Error(`Cache mismatch: ${record.slug}`);
  cached.title = record.title;
  cached.excerpt = record.excerpt;
  cached.content.forEach((block, i) => {
    if (block.type !== record.content[i].type) throw new Error(`Block mismatch: ${record.slug}[${i}]`);
    if (block.type === "image") block.caption = record.content[i].caption;
    else block.content = record.content[i].content;
  });
}
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n");
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2) + "\n");