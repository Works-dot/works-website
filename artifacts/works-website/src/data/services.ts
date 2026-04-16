export interface Service {
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  valueQuestion: string;
  valueAnswer: string;
  activities: { title: string; description: string }[];
  benefits: { title: string; description: string }[];
  tools: string[];
  howWeWork: string;
  relatedProjectSlugs: string[];
}

export const services: Service[] = [
  {
    slug: "ux-kutatas",
    title: "UX Kutatás",
    subtitle: "Felhasználók megértése, adatalappal",
    heroDescription: "Feltárjuk a felhasználói igényeket, viselkedési mintákat és fájdalompontokat, hogy a termékfejlesztés valós adatokon alapuljon — ne feltételezéseken.",
    valueQuestion: "Tudod pontosan, mit akarnak a felhasználóid? Vagy csak azt, amit gondolsz, hogy akarnak?",
    valueAnswer: "A legjobb digitális termékek mögött mindig mély felhasználói megértés áll. Mi segítünk eljutni oda.",
    activities: [
      { title: "Felhasználói interjúk", description: "Strukturált interjúk készítése célcsoportokkal, hogy megértsük a valós motivációkat és akadályokat." },
      { title: "Használhatósági tesztelés", description: "Meglévő vagy tervezett felületek tesztelése valós felhasználókkal, hogy feltárjuk a problémás pontokat." },
      { title: "Perszóna készítés", description: "Adatokra épülő felhasználói perszónák létrehozása, amelyek a teljes csapat számára használhatók." },
      { title: "Versenytárs elemzés", description: "A piaci környezet és a versenytársak digitális megoldásainak áttekintése." },
      { title: "Felhasználói út térképezés", description: "User journey map-ek készítése, amelyek vizualizálják a felhasználói élmény egészét." },
      { title: "Adatelemzés", description: "Meglévő analitikai adatok értelmezése és összevetése a kvalitatív eredményekkel." },
    ],
    benefits: [
      { title: "Kisebb fejlesztési kockázat", description: "A kutatás csökkenti annak esélyét, hogy olyan funkciókat fejlesszünk, amelyeket senki sem használ." },
      { title: "Gyorsabb piacra kerülés", description: "A célzott fejlesztés kevésbé pazarolja az erőforrásokat és gyorsabban jut el az értékes megoldásig." },
      { title: "Magasabb felhasználói elégedettség", description: "Az adatokra építő tervezés eredményeképpen a felhasználók elégedettebbek lesznek a végtermékkel." },
    ],
    tools: ["Hotjar", "Google Analytics", "Maze", "Lookback", "Miro", "Optimal Workshop", "UserTesting", "Dovetail", "FigJam"],
    howWeWork: "<h3>01. Megismerés</h3>\n<p>Megismerjük az üzleti célokat, a meglévő adatokat és a kutatás céljait. Közösen meghatározzuk a kutatási kérdéseket.</p>\n\n<h3>02. Kutatástervezés</h3>\n<p>Kiválasztjuk a megfelelő módszertant, elkészítjük a kutatási tervet és a toborzási kritériumokat.</p>\n\n<h3>03. Terepmunka</h3>\n<p>Elvégezzük az interjúkat, teszteket és megfigyeléseket a meghatározott módszertan szerint.</p>\n\n<h3>04. Elemzés és szintézis</h3>\n<p>Az összegyűjtött adatokat elemezzük, mintákat azonosítunk és akcióképes insightokat fogalmazunk meg.</p>\n\n<h3>05. Átadás és javaslatok</h3>\n<p>Prezentáljuk az eredményeket és konkrét, prioritizált javaslatokkal segítjük a továbblépést.</p>",
    relatedProjectSlugs: ["banki-applikacio", "egeszsegugyi-portal"],
  },
  {
    slug: "ui-design",
    title: "UI Design",
    subtitle: "Felületek, amelyek működnek és hatnak",
    heroDescription: "Olyan felhasználói felületeket tervezünk, amelyek nem csak szépek, hanem érthetőek, használhatók és üzleti eredményeket hoznak.",
    valueQuestion: "Szükséged van egy szakértőre, aki érti az üzleted céljait és a felhasználók elvárásait is?",
    valueAnswer: "Megértjük a felhasználóid elvárásait, szokásait és céljait. Erre építjük a felületeket.",
    activities: [
      { title: "Vizuális tervezés", description: "Pixel-pontos UI tervek készítése, amelyek tükrözik a márka identitását és a felhasználói elvárásokat." },
      { title: "Design rendszer építés", description: "Skálázható, konzisztens komponenskönyvtárak létrehozása, amelyek gyorsítják a fejlesztést." },
      { title: "Prototípus készítés", description: "Interaktív prototípusok, amelyekkel már a fejlesztés előtt tesztelhető a felhasználói élmény." },
      { title: "Reszponzív design", description: "Minden képernyőméretre optimalizált felületek, mobilon és desktopon egyaránt." },
      { title: "Motion design", description: "Célzott mikro-animációk és átmenetek, amelyek javítják a felhasználói élményt." },
      { title: "Fejlesztői átadás", description: "Részletes specifikáció és asset-készítés a zökkenőmentes implementációért." },
    ],
    benefits: [
      { title: "Erősebb márkaélmény", description: "A konzisztens, átgondolt vizuális rendszer erősíti a márkaérzékelést és a bizalmat." },
      { title: "Magasabb konverzió", description: "A jól megtervezett felhasználói útvonalak több látogatót alakítanak ügyféllé." },
      { title: "Hatékonyabb fejlesztés", description: "A design rendszer csökkenti a fejlesztési időt és a kommunikációs súrlódásokat." },
    ],
    tools: ["Figma", "Adobe Creative Suite", "Framer", "Principle", "Storybook", "Zeplin", "Abstract", "InVision"],
    howWeWork: "<h3>01. Vizuális irány</h3>\n<p>Moodboard-ok és stílus-explorációk készítése, amelyek segítenek megtalálni a megfelelő vizuális hangot.</p>\n\n<h3>02. Wireframe és struktúra</h3>\n<p>Az oldal struktúrájának és információs architektúrájának kialakítása alacsony-fidelitású tervekkel.</p>\n\n<h3>03. UI tervezés</h3>\n<p>A végleges, magas fidelitású felületi tervek elkészítése minden breakpointra.</p>\n\n<h3>04. Prototípus és teszt</h3>\n<p>Kattintható prototípus készítése és tesztelése felhasználókkal a végső finomhangolás előtt.</p>\n\n<h3>05. Design rendszer és átadás</h3>\n<p>A végleges design rendszer dokumentálása és átadása a fejlesztő csapatnak.</p>",
    relatedProjectSlugs: ["banki-applikacio", "fintech-mobilapp"],
  },
  {
    slug: "akadalymentesites",
    title: "Akadálymentesítés",
    subtitle: "Digitális termékek mindenki számára",
    heroDescription: "Segítünk, hogy digitális termékeid mindenki számára elérhetőek és használhatóak legyenek — a jogszabályi megfeleléstől a valódi inkluzivitásig.",
    valueQuestion: "A felhasználóid jelentős része akadályokba ütközik a terméked használata során — tudsz róla?",
    valueAnswer: "Az akadálymentesítés nem csak kötelezettség. Jobb terméket jelent mindenkinek.",
    activities: [
      { title: "Akadálymentesítési audit", description: "Meglévő weboldalak és alkalmazások átfogó WCAG 2.1 szabálynak megfelelő értékelése." },
      { title: "Javítási terv készítés", description: "Prioritizált, lépésről lépésre követhető javítási terv összeállítása a feltárt problémák alapján." },
      { title: "Asszisztív technológiás tesztelés", description: "Tesztelés képernyőolvasókkal, billentyűzetes navigációval és egyéb segédeszközökkel." },
      { title: "Akadálymentes design review", description: "Design fázisban végzett ellenőrzés, mielőtt a fejlesztés megkezdődne." },
      { title: "Csapat képzés", description: "Fejlesztők, tervezők és tartalomkészítők képzése az akadálymentes gyakorlatokról." },
      { title: "Folyamatos monitoring", description: "Rendszeres ellenőrzés és jelentéskészítés, hogy a megfelelés hosszú távon is megmaradjon." },
    ],
    benefits: [
      { title: "Jogszabályi megfelelés", description: "Az EU Akadálymentesítési irányelv és a WCAG 2.1 szabványoknak való megfelelés biztosítása." },
      { title: "Szélesebb elérhetőség", description: "A populáció mintegy 15%-a él valamilyen fogyatékossággal — az akadálymentes termék őket is eléri." },
      { title: "Jobb felhasználói élmény mindenkinek", description: "Az akadálymentesítés javítja a használhatóságot minden felhasználó számára, nem csak a fogyatékossággal élőkét." },
    ],
    tools: ["axe DevTools", "WAVE", "Lighthouse", "NVDA", "VoiceOver", "JAWS", "Pa11y", "Contrast Checker", "Accessibility Insights"],
    howWeWork: "<h3>01. Helyzetértékelés</h3>\n<p>A jelenlegi állapot felmérése automatizált és manuális eszközökkel, WCAG 2.1 szabvány szerint.</p>\n\n<h3>02. Részletes audit</h3>\n<p>Oldalról oldalra haladó, komponensszintű vizsgálat dokumentált eredményekkel.</p>\n\n<h3>03. Javítási ütemterv</h3>\n<p>Prioritizált feladatlista a kritikus, közepes és alacsony súlyosságú problémákra bontva.</p>\n\n<h3>04. Implementációs támogatás</h3>\n<p>A fejlesztő csapat támogatása a javítások során, kód review-kkal és konzultációval.</p>\n\n<h3>05. Végső validáció</h3>\n<p>A javítások utáni újratesztelés és a megfelelési nyilatkozat elkészítése.</p>",
    relatedProjectSlugs: ["e-kereskedelmi-akadalymentesites", "egeszsegugyi-portal"],
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find(s => s.slug === slug);
}
