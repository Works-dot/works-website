export interface CareerContentBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
}

export interface CareerPosition {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  tags: string[];
  excerpt: string;
  content: CareerContentBlock[];
}

export interface WhyUsCard {
  image: string;
  title: string;
  description: string;
}

export const whyUsCards: WhyUsCard[] = [
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop",
    title: "Valódi hatás",
    description: "Nem csak pixeleket mozgatunk — olyan digitális termékeket építünk, amelyek emberek százezreinek életét teszik jobbá. Minden projektünknek mérhető eredménye van.",
  },
  {
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop",
    title: "Folyamatos tanulás",
    description: "Konferenciák, workshopok, belső tudásmegosztás és éves képzési keret. Nálunk a szakmai fejlődés nem szlogen, hanem a mindennapok része.",
  },
  {
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=500&fit=crop",
    title: "Rugalmas munkavégzés",
    description: "Hibrid munkavégzés, rugalmas munkaidő és modern budapesti iroda. Te döntöd el, honnan és mikor dolgozol a legjobban.",
  },
  {
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=500&fit=crop",
    title: "Erős csapat",
    description: "Tapasztalt szakemberek, akik szívesen segítenek és osztják meg tudásukat. Nálunk a mentorálás természetes — senki nem marad egyedül egy problémával.",
  },
  {
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=500&fit=crop",
    title: "Változatos projektek",
    description: "Startupoktól a nagyvállalatokig, fintechttől az egészségügyig. Garantáljuk, hogy nem fogsz unatkozni — és minden projekt új kihívást hoz.",
  },
];

export const positions: CareerPosition[] = [
  {
    slug: "senior-ux-researcher",
    title: "Senior UX Researcher",
    team: "Kutatás",
    location: "Budapest / Hibrid",
    type: "Teljes munkaidő",
    tags: ["UX Research", "Kutatás", "Senior"],
    excerpt: "Vezető kutatóként komplex felhasználói kutatási projekteket vezetsz, mélyinterjúktól a használhatósági tesztekig. Tapasztalatod segíti csapatunkat az adatvezérelt designdöntésekben.",
    content: [
      {
        type: "text",
        content: "A Works. kutatócsapatában a felhasználói igények feltárása és megértése a legfontosabb feladatunk. Senior UX Researcherként te leszel az, aki komplex kutatási projekteket tervez és vezet, az ügyfelek és a belső csapat között hidat képezve.",
      },
      {
        type: "highlight",
        content: "Nálunk a kutatás nem utólagos gondolat — minden projekt a felhasználói igények megértésével indul, és ez a szemlélet áthatja a teljes munkánkat.",
      },
      {
        type: "text",
        content: "Feladataid között szerepel mélyinterjúk és használhatósági tesztek tervezése és levezetése, kutatási eredmények szintetizálása és prezentálása, perszonák és journey map-ek készítése, valamint a design csapattal való szoros együttműködés.",
      },
      {
        type: "text",
        content: "Amit várunk: legalább 4 év UX kutatási tapasztalat, erős analitikus gondolkodás, kiváló prezentációs készségek és a felhasználókért való szenvedélyes kiállás. Előnyt jelent a pszichológiai vagy szociológiai háttér.",
      },
      {
        type: "text",
        content: "Amit kínálunk: versenyképes fizetés, rugalmas munkaidő és hibrid munkavégzés, éves képzési keret, modern budapesti iroda és egy csapat, amelyik valóban törődik a munkája minőségével.",
      },
    ],
  },
  {
    slug: "ui-designer",
    title: "UI Designer",
    team: "Design",
    location: "Budapest / Hibrid",
    type: "Teljes munkaidő",
    tags: ["UI Design", "Figma", "Design System"],
    excerpt: "Vizuálisan kiemelkedő, felhasználóbarát felületeket tervezel webes és mobil alkalmazásokhoz. A design rendszerek építése és karbantartása is a feladataid közé tartozik.",
    content: [
      {
        type: "text",
        content: "UI Designerként a Works. kreatív csapatának tagjaként dolgozol, ahol a kutatási eredményeket vizuálisan meggyőző, használható felületekké alakítod. Figma-ban dolgozunk, és nagy hangsúlyt fektetünk a design rendszerek építésére.",
      },
      {
        type: "highlight",
        content: "A jó UI design nem a szépségről szól — hanem arról, hogy a felhasználó természetesen, gondolkodás nélkül navigáljon a felületen.",
      },
      {
        type: "text",
        content: "Feladataid: webes és mobil felületek tervezése Figma-ban, design system komponensek építése és dokumentálása, szoros együttműködés a fejlesztőkkel a pixel-perfect implementáció érdekében, és részvétel design critique sessionökön.",
      },
      {
        type: "text",
        content: "Amit várunk: 2-3 év UI design tapasztalat, erős Figma tudás, tipográfiai és layout érzék, valamint érdeklődés az akadálymentesség iránt. Portfolió bemutatása szükséges.",
      },
      {
        type: "text",
        content: "Amit kínálunk: kreatív szabadság, változatos projektek startuptól a nagyvállalatokig, szakmai fejlődési lehetőségek és egy inspiráló csapat.",
      },
    ],
  },
  {
    slug: "frontend-fejleszto",
    title: "Frontend Fejlesztő",
    team: "Fejlesztés",
    location: "Budapest / Remote",
    type: "Teljes munkaidő",
    tags: ["React", "TypeScript", "Frontend"],
    excerpt: "Modern webes alkalmazásokat fejlesztesz React és TypeScript technológiákkal. A designerekkel szorosan együttműködve pixel-perfect, akadálymentes felületeket valósítasz meg.",
    content: [
      {
        type: "text",
        content: "Frontend Fejlesztőként a Works. fejlesztői csapatában dolgozol, ahol a designerek által tervezett felületeket kelted életre. Modern technológiai stackkel dolgozunk: React, TypeScript, Tailwind CSS, Framer Motion és Next.js.",
      },
      {
        type: "highlight",
        content: "Nálunk a fejlesztők nem \u201Emegvalósítók\u201D \u2014 aktív résztvevői a tervezési folyamatnak, és a technológiai döntésekbe is beleszólnak.",
      },
      {
        type: "text",
        content: "Feladataid: reszponzív, akadálymentes webes felületek fejlesztése, komponenskönyvtárak építése és karbantartása, teljesítményoptimalizálás, és code review-k végzése.",
      },
      {
        type: "text",
        content: "Amit várunk: legalább 3 év frontend fejlesztési tapasztalat, erős React és TypeScript tudás, CSS/Tailwind magabiztosság, és érdeklődés a design rendszerek iránt. Git workflow ismerete szükséges.",
      },
      {
        type: "text",
        content: "Amit kínálunk: teljes remote lehetőség, versenyképes fizetés, modern technológiai stack, és egy csapat ahol a kódminőség nem kompromisszum kérdése.",
      },
    ],
  },
  {
    slug: "service-designer",
    title: "Service Designer",
    team: "Stratégia",
    location: "Budapest / Hibrid",
    type: "Teljes munkaidő",
    tags: ["Service Design", "Stratégia", "Workshop"],
    excerpt: "Komplex szolgáltatás-tervezési projekteket vezetsz, az ügyfél üzleti céljainak és a felhasználói igényeknek az összehangolásával. Workshop-facilitáció és service blueprint készítés a mindennapjaid része.",
    content: [
      {
        type: "text",
        content: "Service Designerként a Works. stratégiai csapatában dolgozol, ahol a digitális és fizikai érintkezési pontokat egyaránt átlátó, rendszerszintű megoldásokat tervezel. A munkád az üzleti stratégia és a felhasználói élmény metszéspontjában helyezkedik el.",
      },
      {
        type: "highlight",
        content: "A service design nem egy lépés a folyamatban — hanem a szemlélet, amellyel az egész folyamatot átlátjuk és alakítjuk.",
      },
      {
        type: "text",
        content: "Feladataid: service blueprint-ek és journey map-ek készítése, workshopok facilitálása ügyfelekkel és stakeholderekkel, üzleti és felhasználói igények összehangolása, valamint a design csapattal való szoros együttműködés a megoldások kidolgozásában.",
      },
      {
        type: "text",
        content: "Amit várunk: 3+ év service design vagy UX stratégiai tapasztalat, workshop facilitációs készségek, rendszerszintű gondolkodás, és kiváló kommunikációs képességek magyarul és angolul egyaránt.",
      },
      {
        type: "text",
        content: "Amit kínálunk: stratégiai szintű projektek vezető hazai és nemzetközi ügyfelekkel, szakmai közösség, és a lehetőség, hogy valódi hatást gyakorolj a digitális szolgáltatások világára.",
      },
    ],
  },
];

export function getPositionBySlug(slug: string): CareerPosition | undefined {
  return positions.find((p) => p.slug === slug);
}

export function getNextPosition(currentSlug: string): CareerPosition {
  const idx = positions.findIndex((p) => p.slug === currentSlug);
  return positions[(idx + 1) % positions.length];
}
