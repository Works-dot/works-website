import projectBanking from "@/assets/project-banking-mockup.png";
import projectLogistics from "@/assets/project-logistics-mockup.png";
import projectAccessibility from "@/assets/project-accessibility-mockup.png";
import projectFintech from "@/assets/project-fintech-mockup.png";
import projectHealthcare from "@/assets/project-healthcare-mockup.png";
import projectAiDesign from "@/assets/project-ai-design-mockup.png";
import projectBankingClean from "@/assets/project-banking-clean.png";
import projectLogisticsClean from "@/assets/project-logistics-clean.png";
import projectAccessibilityClean from "@/assets/project-accessibility-clean.png";

export interface CaseStudyBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
}

export interface Project {
  slug: string;
  title: string;
  tags: string[];
  description: string;
  image: string;
  homepageImage?: string;
  featured?: boolean;
  caseStudy: {
    heroSubtitle: string;
    client: string;
    year: string;
    duration: string;
    blocks: CaseStudyBlock[];
  };
}

export const allTags = [
  "UX Research",
  "UI Design",
  "Service Design",
  "Dashboard UI",
  "User Research",
  "WCAG Audit",
  "Akadálymentesítés",
  "UX Elemzés",
  "Konverziós stratégia",
  "Webfejlesztés",
  "AI Design",
  "Branding",
];

export const projects: Project[] = [
  {
    slug: "banki-applikacio",
    title: "Banki applikáció újratervezése a jobb konverzióért",
    tags: ["UX Research", "UI Design", "Konverziós stratégia"],
    description:
      "Teljeskörű felhasználói kutatás és felülettervezés egy vezető hazai bank számára. A projekt során az onboarding folyamatot egyszerűsítettük, amivel 40%-kal növeltük a sikeres regisztrációk számát az első hónapban.",
    image: projectBanking,
    homepageImage: projectBankingClean,
    featured: true,
    caseStudy: {
      heroSubtitle: "Hogyan növeltük 40%-kal a sikeres regisztrációkat egy vezető hazai bank mobil applikációjában.",
      client: "Bizalmas",
      year: "2024",
      duration: "4 hónap",
      blocks: [
        {
          type: "text",
          content:
            "A projekt célja egy vezető magyar bank mobilalkalmazásának teljes újratervezése volt. A korábbi alkalmazás bonyolult onboarding folyamata miatt a felhasználók jelentős része elhagyta a regisztrációt a befejezés előtt.",
        },
        {
          type: "highlight",
          content:
            "A felhasználói kutatás során kiderült, hogy a regisztrációs folyamat 12 lépésből állt — a felhasználók 67%-a a 4. lépésnél hagyta el az alkalmazást.",
        },
        {
          type: "text",
          content:
            "Mélyinterjúkat és használhatósági teszteket végeztünk 30 felhasználóval. Az eredmények alapján a regisztrációs folyamatot 5 lépésre csökkentettük, progresszív adatbekéréssel. A vizuális tervezés során a bank márkaidentitását megőrizve egy modern, letisztult felületet hoztunk létre.",
        },
        {
          type: "image",
          content: projectBanking,
          caption: "Az újratervezett onboarding folyamat főbb képernyői",
        },
        {
          type: "text",
          content:
            "Az eredmények önmagukért beszélnek: az első hónapban 40%-kal nőtt a sikeres regisztrációk száma, a felhasználói elégedettségi mutató (NPS) pedig 32-ről 71-re emelkedett. A bank azóta is a mi csapatunkkal fejleszti tovább az alkalmazást.",
        },
      ],
    },
  },
  {
    slug: "logisztikai-szoftver",
    title: "Komplex logisztikai szoftver ergonómia",
    tags: ["Service Design", "Dashboard UI", "User Research"],
    description:
      "Belső használatú vállalatirányítási rendszer modernizálása. A munkatársak napi folyamatait feltérképezve egy olyan UI-t alkottunk, ami napi átlagosan 2 órát takarít meg felhasználónként.",
    image: projectLogistics,
    homepageImage: projectLogisticsClean,
    caseStudy: {
      heroSubtitle: "Egy vállalatirányítási rendszer modernizálása, ami napi 2 órát takarít meg felhasználónként.",
      client: "LogisticsPro Kft.",
      year: "2023",
      duration: "6 hónap",
      blocks: [
        {
          type: "text",
          content:
            "A LogisticsPro egy 500+ alkalmazottat foglalkoztató logisztikai vállalat, amelynek belső rendszere az elmúlt 10 évben alig változott. A munkatársak napi szinten több órát töltöttek felesleges kattintásokkal és redundáns adatbevitellel.",
        },
        {
          type: "highlight",
          content:
            "A service design feltárás során 47 különböző felhasználói útvonalat azonosítottunk — ezeket 12 fő folyamatra egyszerűsítettük.",
        },
        {
          type: "text",
          content:
            "A projekt során service blueprint-eket készítettünk, amelyek feltérképezték a teljes munkafolyamatot. Az új dashboard egyetlen áttekinthető felületen mutatja a legfontosabb KPI-okat, és a gyakori műveletek 2-3 kattintással elvégezhetők.",
        },
        {
          type: "image",
          content: projectLogistics,
          caption: "Az új logisztikai dashboard áttekintő nézete",
        },
        {
          type: "text",
          content:
            "A bevezetés után az átlagos feladatvégzési idő 34%-kal csökkent, a felhasználói hibák száma 60%-kal esett vissza. A rendszert azóta a cég 3 másik részlegére is kiterjesztették.",
        },
      ],
    },
  },
  {
    slug: "e-kereskedelmi-akadalymentesites",
    title: "E-kereskedelmi platform akadálymentesítése",
    tags: ["WCAG Audit", "Akadálymentesítés", "UX Elemzés"],
    description:
      "Egy nemzetközi webáruház teljes átvilágítása és javítása WCAG 2.1 AA szintnek megfelelően. A látássérült és mozgásukban korlátozott felhasználók számára is zökkenőmentessé tettük a vásárlást.",
    image: projectAccessibility,
    homepageImage: projectAccessibilityClean,
    caseStudy: {
      heroSubtitle: "Teljes WCAG 2.1 AA megfelelés elérése egy nemzetközi webáruház számára.",
      client: "RetailGiant International",
      year: "2024",
      duration: "3 hónap",
      blocks: [
        {
          type: "text",
          content:
            "A RetailGiant webáruháza havi 2 millió egyedi látogatót szolgál ki, de az akadálymentességi tesztek során kiderült, hogy a felület számos ponton nem felel meg a WCAG 2.1 AA szabványnak. Ez nemcsak jogi kockázatot jelentett, hanem a fogyatékossággal élő felhasználók kizárását is.",
        },
        {
          type: "highlight",
          content:
            "Az audit során 234 akadálymentességi hibát azonosítottunk, amelyek közül 89 kritikus szintű volt — ezek azonnali beavatkozást igényeltek.",
        },
        {
          type: "text",
          content:
            "A javítási folyamat során kiemelt figyelmet fordítottunk a képernyőolvasó-kompatibilitásra, a billentyűzetes navigációra, a megfelelő kontrasztarányokra és az ARIA attribútumok helyes használatára. Minden módosítást valós felhasználókkal teszteltünk.",
        },
        {
          type: "image",
          content: projectAccessibility,
          caption: "A javított termékoldal akadálymentességi fejlesztésekkel",
        },
        {
          type: "text",
          content:
            "A projekt végére a platform teljes mértékben megfelelt a WCAG 2.1 AA szabványnak. A javítások hatására a fogyatékossággal élő felhasználók körében 45%-kal nőtt a sikeres vásárlások aránya.",
        },
      ],
    },
  },
  {
    slug: "fintech-mobilapp",
    title: "Fintech mobilalkalmazás UX stratégia",
    tags: ["UX Research", "UI Design", "Service Design"],
    description:
      "Egy fintech startup számára terveztünk befektetési mobilalkalmazást. A komplex pénzügyi adatokat közérthető, vizuálisan vonzó formában jelenítettük meg, ami 3x-os felhasználói növekedést eredményezett.",
    image: projectFintech,
    caseStudy: {
      heroSubtitle: "Komplex pénzügyi adatok egyszerű megjelenítése egy befektetési alkalmazásban.",
      client: "Fintech Innovator Zrt.",
      year: "2024",
      duration: "5 hónap",
      blocks: [
        {
          type: "text",
          content:
            "A Fintech Innovator egy fiatal startup, amely demokratizálni kívánja a befektetések világát. Az alkalmazásnak egyszerre kellett megbízhatóságot sugároznia és könnyen érthetőnek lennie a befektetésekben kevésbé jártas felhasználók számára.",
        },
        {
          type: "highlight",
          content:
            "A célcsoport-kutatás rámutatott: a potenciális felhasználók 78%-a azért nem fektet be, mert túl bonyolultnak tartja — nem azért, mert nem érdekli.",
        },
        {
          type: "text",
          content:
            "A tervezés során a progressive disclosure elvét alkalmaztuk: az egyszerű áttekintéstől a részletes elemzésekig fokozatosan mélyülhet a felhasználó. Interaktív grafikonokat és személyre szabott ajánlásokat építettünk be.",
        },
        {
          type: "image",
          content: projectFintech,
          caption: "A befektetési dashboard és portfólió áttekintő",
        },
        {
          type: "text",
          content:
            "A launch után 3 hónapon belül a felhasználói bázis megháromszorozódott. Az alkalmazás 4.7-es értékelést kapott az App Store-ban, és a befektetők átlagos visszatérési rátája 85% fölötti.",
        },
      ],
    },
  },
  {
    slug: "egeszsegugyi-portal",
    title: "Egészségügyi portál újragondolása",
    tags: ["User Research", "UI Design", "Akadálymentesítés"],
    description:
      "Egy országos egészségügyi portál teljes újratervezése, ahol a páciensek időpontot foglalhatnak, receptet kérhetnek és hozzáférhetnek leleteikhez. Az új felület 60%-kal csökkentette a telefonos megkereséseket.",
    image: projectHealthcare,
    caseStudy: {
      heroSubtitle: "Egy országos egészségügyi portál, amely 60%-kal csökkentette a telefonos megkereséseket.",
      client: "Bizalmas",
      year: "2023",
      duration: "8 hónap",
      blocks: [
        {
          type: "text",
          content:
            "Az egészségügyi portált havonta több mint 500 000 ember használja időpontfoglalásra, leletmegtekintésre és receptigénylésre. A korábbi felület elavult volt, és a felhasználók nagy része inkább telefonon intézte ügyeit.",
        },
        {
          type: "highlight",
          content:
            "A felhasználói tesztek során a résztvevők átlagosan 4.5 percig keresték az időpontfoglalás funkciót — az új felületen ez 30 másodpercre csökkent.",
        },
        {
          type: "text",
          content:
            "Különös figyelmet fordítottunk az idősebb korosztály igényeire: nagy betűméretek, egyértelmű ikonok, egyszerű navigáció. Az akadálymentességi auditot párhuzamosan végeztük a tervezéssel, így a WCAG 2.1 AA megfelelés már az első verziótól biztosított volt.",
        },
        {
          type: "image",
          content: projectHealthcare,
          caption: "Az új egészségügyi portál főoldala és időpontfoglaló felülete",
        },
        {
          type: "text",
          content:
            "A portál indulása után a telefonos megkeresések 60%-kal csökkentek, az online időpontfoglalások száma pedig megháromszorozódott. A felhasználói elégedettség 4.2/5-re emelkedett.",
        },
      ],
    },
  },
  {
    slug: "ai-design-platform",
    title: "AI-alapú design platform prototípus",
    tags: ["AI Design", "UI Design", "Webfejlesztés"],
    description:
      "Egy innovatív SaaS platform tervezése és fejlesztése, amely mesterséges intelligenciával segíti a designereket a kreatív munkában. A prototípus 3 hónap alatt készült el, és azóta béta tesztelés alatt áll.",
    image: projectAiDesign,
    caseStudy: {
      heroSubtitle: "Mesterséges intelligencia a kreatív munka szolgálatában — egy SaaS platform születése.",
      client: "AI Creative Labs",
      year: "2024",
      duration: "3 hónap",
      blocks: [
        {
          type: "text",
          content:
            "Az AI Creative Labs egy olyan platformot álmodott meg, amely generatív AI segítségével gyorsítja fel a design munkafolyamatokat. A kihívás az volt, hogy az AI képességeit intuitív, nem technikai felhasználók számára is elérhető módon kellett csomagolni.",
        },
        {
          type: "highlight",
          content:
            "A legnagyobb tervezési kihívás: hogyan tegyük átláthatóvá az AI döntéseit, hogy a designerek bízzanak az eszközben, ne érezzék fenyegetésnek.",
        },
        {
          type: "text",
          content:
            "A felületen az AI javaslatokat vizuális kártyaként jelenítettük meg, amelyeket a felhasználó elfogadhat, módosíthat vagy elvethet. Minden javaslat mellett megjelenik az AI gondolkodási folyamata, ami átláthatóvá teszi a döntéseket.",
        },
        {
          type: "image",
          content: projectAiDesign,
          caption: "Az AI design asszisztens felülete működés közben",
        },
        {
          type: "text",
          content:
            "A béta teszt első hónapjában 200+ designer regisztrált. Az átlagos design iterációs idő 40%-kal csökkent az AI javaslatok használatával. A platform jelenleg seed finanszírozási körben van.",
        },
      ],
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(currentSlug: string): Project {
  const idx = projects.findIndex((p) => p.slug === currentSlug);
  return projects[(idx + 1) % projects.length];
}
