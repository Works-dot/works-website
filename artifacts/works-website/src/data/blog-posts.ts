import blogAccessibility from "@/assets/blog-accessibility.png";
import blogMicrointeractions from "@/assets/blog-microinteractions.png";
import blogDesignsystem from "@/assets/blog-designsystem.png";
import blogAiUx from "@/assets/blog-ai-ux.png";
import blogUxResearch from "@/assets/blog-ux-research.png";
import blogMobileFirst from "@/assets/blog-mobile-first.png";

export interface BlogContentBlock {
  type: "text" | "image" | "highlight";
  content: string;
  caption?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
  readingTime: string;
  content: BlogContentBlock[];
}

export const allBlogTags = [
  "Akad\u00e1lymentes\u00edt\u00e9s",
  "UX",
  "UI Design",
  "Design System",
  "AI",
  "UX Research",
  "Mobile",
  "Strat\u00e9gia",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "akadalymentes-tervezes-jovoje",
    title: "Az akad\u00e1lymentes tervez\u00e9s j\u00f6v\u0151je a modern fel\u00fcleteken",
    excerpt:
      "Mi\u00e9rt elengedhetetlen a digit\u00e1lis term\u00e9kekn\u00e9l az a11y szabv\u00e1nyok k\u00f6vet\u00e9se, \u00e9s hogyan kezdj\u00fcnk hozz\u00e1 a gyakorlatban?",
    date: "2024. M\u00e1rcius 15.",
    author: "Kov\u00e1cs Anna",
    image: blogAccessibility,
    tags: ["Akad\u00e1lymentes\u00edt\u00e9s", "UX"],
    readingTime: "8 perc",
    content: [
      {
        type: "text",
        content:
          "Az akad\u00e1lymentes tervez\u00e9s ma m\u00e1r nem csup\u00e1n egy nice-to-have funkci\u00f3, hanem alapvet\u0151 elv\u00e1r\u00e1s minden digit\u00e1lis term\u00e9kkel szemben. Az Eur\u00f3pai Uni\u00f3 akad\u00e1lymentes\u00e9gi ir\u00e1nyelvei 2025-t\u0151l k\u00f6telez\u0151v\u00e9 teszik a WCAG 2.1 AA szabv\u00e1ny betart\u00e1s\u00e1t minden k\u00f6zszolg\u00e1ltat\u00e1si \u00e9s e-kereskedelmi fel\u00fcleten\u00e9l.",
      },
      {
        type: "highlight",
        content:
          "A vil\u00e1g n\u00e9pess\u00e9g\u00e9nek mintegy 15%-a \u00e9l valamilyen fogyat\u00e9koss\u00e1ggal. Ez t\u00f6bb mint 1 milli\u00e1rd embert jelent, akik potenci\u00e1lis felhaszn\u00e1l\u00f3i a digit\u00e1lis szolg\u00e1ltat\u00e1soknak.",
      },
      {
        type: "text",
        content:
          "A gyakorlatban az akad\u00e1lymentes tervez\u00e9s nem bonyolult, de tudatos megk\u00f6zel\u00edt\u00e9st ig\u00e9nyel. Az els\u0151 \u00e9s legfontosabb l\u00e9p\u00e9s a szemantikus HTML haszn\u00e1lata: a fejl\u00e9cek hierarchikus strukt\u00far\u00e1ja, a megfelel\u0151 ARIA attrib\u00fatumok \u00e9s a billenty\u0171zetes navig\u00e1ci\u00f3 biztos\u00edt\u00e1sa.",
      },
      {
        type: "image",
        content: blogAccessibility,
        caption: "A kontraszt \u00e9s olvashat\u00f3s\u00e1g tesztel\u00e9se k\u00fcl\u00f6nb\u00f6z\u0151 eszk\u00f6z\u00f6k\u00f6n",
      },
      {
        type: "text",
        content:
          "A sz\u00ednkontrasztok megfelel\u0151 be\u00e1ll\u00edt\u00e1sa szint\u00e9n kritikus: a WCAG 2.1 AA szint legal\u00e1bb 4.5:1 ar\u00e1nyt k\u00f6vetel meg a sz\u00f6veg \u00e9s a h\u00e1tt\u00e9r k\u00f6z\u00f6tt. \u00c9rdemes m\u00e1r a design system \u00e9p\u00edt\u00e9se sor\u00e1n figyelni erre, \u00edgy a fejleszt\u00e9s sor\u00e1n automatikusan biztos\u00edtott lesz a megfelel\u00e9s.",
      },
      {
        type: "text",
        content:
          "A k\u00e9perny\u0151olvas\u00f3kkal val\u00f3 kompatibilit\u00e1s tesztel\u00e9se szint\u00e9n alapvet\u0151. A leggyakoribb hib\u00e1k k\u00f6z\u00fcl kiemelkedik a k\u00e9pek alt sz\u00f6vegeinek hi\u00e1nya, a nem megjel\u00f6lt \u0171rlapmez\u0151k \u00e9s az interakt\u00edv elemek rossz szerep\u00e9nek defini\u00e1l\u00e1sa.",
      },
      {
        type: "highlight",
        content:
          "Az akad\u00e1lymentes tervez\u00e9s nem korl\u00e1toz, hanem jobb megold\u00e1sokra k\u00e9sztet. Ami egy l\u00e1t\u00e1ss\u00e9r\u00fclt felhaszn\u00e1l\u00f3nak seg\u00edt, az mindenki sz\u00e1m\u00e1ra jobb \u00e9lm\u00e9nyt ny\u00fajt.",
      },
      {
        type: "text",
        content:
          "A Works. csapat\u00e1n\u00e1l minden projektet akad\u00e1lymentes\u00e9gi audittal z\u00e1runk. Tapasztalataink szerint a legt\u00f6bb probl\u00e9ma m\u00e1r a tervez\u00e9si f\u00e1zisban megel\u0151zhet\u0151, ha az akad\u00e1lymentes\u00e9g nem ut\u00f3lagos gondolat, hanem a folyamat szerves r\u00e9sze.",
      },
    ],
  },
  {
    slug: "mikro-interakciok-ux-titka",
    title: "Mikro-interakci\u00f3k: A kiv\u00e1l\u00f3 UX titkos fegyvere",
    excerpt:
      "Hogyan tehetik eml\u00e9kezetess\u00e9 a legapr\u00f3bb anim\u00e1ci\u00f3k is az alkalmaz\u00e1sodat, \u00e9s milyen buktat\u00f3kra \u00e9rdemes figyelni.",
    date: "2024. Febru\u00e1r 28.",
    author: "Nagy P\u00e9ter",
    image: blogMicrointeractions,
    tags: ["UX", "UI Design"],
    readingTime: "6 perc",
    content: [
      {
        type: "text",
        content:
          "A mikro-interakci\u00f3k azok az apr\u00f3, gyakran \u00e9szrev\u00e9tlen anim\u00e1ci\u00f3k \u00e9s vizu\u00e1lis visszajelz\u00e9sek, amelyek \u00e9lettel t\u00f6ltik meg a digit\u00e1lis fel\u00fcletet. Egy gomb sz\u00ednv\u00e1ltoz\u00e1sa kattint\u00e1skor, egy \u00e9rtes\u00edt\u00e9s finoman be\u00faszt anim\u00e1ci\u00f3ja, vagy egy form mez\u0151 valid\u00e1ci\u00f3s visszajelz\u00e9se mind-mind mikro-interakci\u00f3k.",
      },
      {
        type: "highlight",
        content:
          "A felhaszn\u00e1l\u00f3k 68%-a mondja, hogy a finoman anim\u00e1lt fel\u00fcleteket professzion\u00e1lisabbnak \u00e9s megb\u00edzhat\u00f3bbnak \u00e9rzi, mint a statikus alternat\u00edv\u00e1kat.",
      },
      {
        type: "text",
        content:
          "A j\u00f3 mikro-interakci\u00f3 n\u00e9gy alapelvre \u00e9p\u00fcl: trigger (mi ind\u00edtja el), szab\u00e1lyok (mi t\u00f6rt\u00e9nik), visszajelz\u00e9s (mit l\u00e1t a felhaszn\u00e1l\u00f3) \u00e9s ciklusok (ism\u00e9tl\u0151dik-e). Ha b\u00e1rmely elem hi\u00e1nyzik, az anim\u00e1ci\u00f3 zavaros vagy felesleges lesz.",
      },
      {
        type: "image",
        content: blogMicrointeractions,
        caption: "K\u00fcl\u00f6nb\u00f6z\u0151 mikro-interakci\u00f3s mint\u00e1k mobil alkalmaz\u00e1sokban",
      },
      {
        type: "text",
        content:
          "A leggyakoribb hiba a t\u00falz\u00e1s. Ha minden elem mozog, vibr\u00e1l \u00e9s pulz\u00e1l, a felhaszn\u00e1l\u00f3 hamar elf\u00e1rad \u00e9s az anim\u00e1ci\u00f3k ink\u00e1bb zavar\u00f3akk\u00e1, mint seg\u00edt\u0151v\u00e9 v\u00e1lnak. Az arany k\u00f6z\u00e9p az, ha csak a fontos \u00e1llapotv\u00e1ltoz\u00e1sokat jel\u00f6lj\u00fck vizu\u00e1lisan.",
      },
      {
        type: "text",
        content:
          "A teljes\u00edtm\u00e9ny szint\u00e9n kritikus szempont. A CSS-alap\u00fa anim\u00e1ci\u00f3k \u00e1ltal\u00e1ban hat\u00e9konyabbak, mint a JavaScript-alap\u00faak, \u00e9s a transform/opacity tulajdons\u00e1gok hardveres gyors\u00edt\u00e1st kapnak a legt\u00f6bb b\u00f6ng\u00e9sz\u0151ben. Mindig tesztelj\u00fcnk alacsonyabb teljes\u00edtm\u00e9ny\u0171 eszk\u00f6z\u00f6k\u00f6n is.",
      },
      {
        type: "highlight",
        content:
          "A legjobb mikro-interakci\u00f3 az, amelyik annyira term\u00e9szetes, hogy a felhaszn\u00e1l\u00f3 \u00e9szre sem veszi. Ha felt\u0171n\u0151en l\u00e1tszik, val\u00f3sz\u00edn\u0171leg t\u00falz\u00e1s.",
      },
      {
        type: "text",
        content:
          "A Works. csapat\u00e1n\u00e1l a Framer Motion \u00e9s a Lottie k\u00f6nyvt\u00e1rakat haszn\u00e1ljuk leggyakrabban React projektekben. Ezek lehet\u0151v\u00e9 teszik a komplex anim\u00e1ci\u00f3k deklarativ le\u00edr\u00e1s\u00e1t, \u00e9s kiv\u00e1l\u00f3an optimaliz\u00e1ltak a teljes\u00edtm\u00e9nyre.",
      },
    ],
  },
  {
    slug: "design-system-epites",
    title: "Design System \u00e9p\u00edt\u00e9s null\u00e1r\u00f3l",
    excerpt:
      "L\u00e9p\u00e9sr\u0151l l\u00e9p\u00e9sre bemutatjuk, hogyan hoztunk l\u00e9tre egy sk\u00e1l\u00e1zhat\u00f3 \u00e9s fenntarthat\u00f3 design rendszert egy nagyv\u00e1llalati \u00fcgyfel\u00fcnknek.",
    date: "2024. Febru\u00e1r 10.",
    author: "Szab\u00f3 M\u00e1rta",
    image: blogDesignsystem,
    tags: ["Design System", "UI Design"],
    readingTime: "10 perc",
    content: [
      {
        type: "text",
        content:
          "Egy design system l\u00e9trehoz\u00e1sa nem egyszer\u0171 feladat, de hossz\u00fa t\u00e1von a legjobb befektet\u00e9s, amit egy szoftvercsapat tehet. A mi megk\u00f6zel\u00edt\u00e9s\u00fcnk egy nagyv\u00e1llalati \u00fcgyf\u00e9llel: a teljes vizu\u00e1lis nyelvet egys\u00e9ges\u00edtett\u00fck 6 h\u00f3nap alatt.",
      },
      {
        type: "highlight",
        content:
          "A design system bevezet\u00e9se ut\u00e1n a fejleszt\u00e9si id\u0151 \u00e1tlagosan 40%-kal cs\u00f6kkent, mert a csapat k\u00e9szre tervezett komponensekb\u0151l \u00e9p\u00edtkezett a nulla helyett.",
      },
      {
        type: "text",
        content:
          "Az els\u0151 l\u00e9p\u00e9s az audit volt: felt\u00e9rk\u00e9pezt\u00fck az \u00f6sszes l\u00e9tez\u0151 fel\u00fcletet, \u00f6sszegy\u0171jt\u00f6tt\u00fck a sz\u00edneket, tipogr\u00e1fi\u00e1t, komponenseket. A v\u00e9geredm\u00e9ny megdoebbent\u0151 volt: 47 k\u00fcl\u00f6nb\u00f6z\u0151 sz\u00ednt, 12 bet\u0171t\u00edpust \u00e9s t\u00f6bb mint 200 egyedi gombot tal\u00e1ltunk.",
      },
      {
        type: "image",
        content: blogDesignsystem,
        caption: "A design system token-hierarchi\u00e1ja \u00e9s komponens-k\u00f6nyvt\u00e1ra",
      },
      {
        type: "text",
        content:
          "A design tokenek jelentett\u00e9k az alapot: sz\u00ednek, m\u00e9retez\u00e9sek, t\u00e1vols\u00e1gok \u00e9s tipogr\u00e1fia egys\u00e9ges v\u00e1ltoz\u00f3kban r\u00f6gz\u00edtve. Ezeket mind Figma-ban, mind a k\u00f3dban szinkronban tartottuk a Style Dictionary seg\u00edts\u00e9g\u00e9vel.",
      },
      {
        type: "text",
        content:
          "A komponens-k\u00f6nyvt\u00e1r \u00e9p\u00edt\u00e9se sor\u00e1n az atomic design elveket k\u00f6vett\u00fck: atomokt\u00f3l (gomb, input) a molekul\u00e1k (keres\u0151 mez\u0151, k\u00e1rtya) \u00e9s organizmusok (navig\u00e1ci\u00f3, footer) fel\u00e9 haladtunk. Minden komponenshez dokument\u00e1ci\u00f3t, haszn\u00e1lati p\u00e9ld\u00e1t \u00e9s akad\u00e1lymentes\u00e9gi specifik\u00e1ci\u00f3t \u00edrtunk.",
      },
      {
        type: "highlight",
        content:
          "A legfontosabb tanuls\u00e1g: a design system soha nem k\u00e9sz. Egy \u00e9l\u0151 rendszer, amelyet folyamatosan karbantartani, b\u0151v\u00edteni \u00e9s friss\u00edteni kell a term\u00e9k fejl\u0151d\u00e9s\u00e9vel p\u00e1rhuzamosan.",
      },
      {
        type: "text",
        content:
          "A sikerhez kulcsfontoss\u00e1g\u00fa a csapat bevon\u00e1sa: rendszeres design critique sessionok, fejleszt\u0151i feedback \u00e9s k\u00f6z\u00f6s d\u00f6nt\u00e9shoz\u00e1s. A design system csak akkor m\u0171k\u00f6dik, ha mindenki haszn\u00e1lja \u00e9s hisz benne.",
      },
    ],
  },
  {
    slug: "ai-a-ux-tervezesben",
    title: "Mesters\u00e9ges intelligencia a UX tervez\u00e9sben: lehet\u0151s\u00e9gek \u00e9s korl\u00e1tok",
    excerpt:
      "Hogyan haszn\u00e1lhatjuk az AI eszk\u00f6zeit a felhaszn\u00e1l\u00f3i \u00e9lm\u00e9ny tervez\u00e9s\u00e9n\u00e9l, \u00e9s hol vannak a technol\u00f3gia jelenlegi hat\u00e1rai?",
    date: "2024. Janu\u00e1r 22.",
    author: "T\u00f3th Bal\u00e1zs",
    image: blogAiUx,
    tags: ["AI", "UX", "Strat\u00e9gia"],
    readingTime: "7 perc",
    content: [
      {
        type: "text",
        content:
          "A mesters\u00e9ges intelligencia rohamos fejl\u0151d\u00e9se a UX tervez\u00e9s ter\u00fclet\u00e9n is \u00faj lehet\u0151s\u00e9geket nyitott. A generat\u00edv AI eszk\u00f6z\u00f6k k\u00e9pesek wireframe-eket, layoutokat \u00e9s ak\u00e1r teljes designokat gener\u00e1lni m\u00e1sodpercek alatt. De vajon ez jelenti-e a designer szakma v\u00e9g\u00e9t?",
      },
      {
        type: "highlight",
        content:
          "Az AI nem helyettes\u00edti a designereket, hanem er\u0151s\u00edti \u0151ket. A kreat\u00edv d\u00f6nt\u00e9sek, az emp\u00e1tia \u00e9s a strat\u00e9giai gondolkod\u00e1s tov\u00e1bbra is emberi kompetencia marad.",
      },
      {
        type: "text",
        content:
          "A gyakorlatban az AI-t leghat\u00e9konyabban a kutat\u00e1s \u00e9s az elemz\u00e9s f\u00e1zis\u00e1ban lehet alkalmazni. Nagymennyis\u00e9g\u0171 felhaszn\u00e1l\u00f3i adatb\u00f3l k\u00e9pes mint\u00e1zatokat felfedezni, heatmap-eket elemezni \u00e9s predit\u00edv modelleket \u00e9p\u00edteni a felhaszn\u00e1l\u00f3i viselked\u00e9sr\u0151l.",
      },
      {
        type: "image",
        content: blogAiUx,
        caption: "AI-t\u00e1mogatott design munkafolyamat vizualiz\u00e1ci\u00f3",
      },
      {
        type: "text",
        content:
          "A design vari\u00e1ci\u00f3k gener\u00e1l\u00e1s\u00e1ban is hatalmas seg\u00edts\u00e9get ny\u00fajt az AI. Egy alap wireframe-b\u0151l pillanatok alatt 10-20 elrendez\u00e9si v\u00e1ltozatot gener\u00e1lhatunk, amelyeket azt\u00e1n emberi szemmel \u00e9rt\u00e9kel\u00fcnk \u00e9s finom\u00edtunk. Ez nem a kreativit\u00e1s kiszor\u00edt\u00e1sa, hanem annak felgyors\u00edt\u00e1sa.",
      },
      {
        type: "text",
        content:
          "A korl\u00e1tok azonban val\u00f3sak. Az AI modellek a megl\u00e9v\u0151 adatokb\u00f3l tanulnak, \u00edgy hajlamosak a megszokott mint\u00e1kat ism\u00e9telni. Igaz\u00e1n innovat\u00edv, hat\u00e1rfeszget\u0151 megold\u00e1sokhoz tov\u00e1bbra is emberi kreativit\u00e1s sz\u00fcks\u00e9ges. R\u00e1ad\u00e1sul az AI nem \u00e9rti a kultur\u00e1lis kontextust \u00e9s a finomabb felhaszn\u00e1l\u00f3i ig\u00e9nyeket.",
      },
      {
        type: "highlight",
        content:
          "A legjobb eredm\u00e9nyt a hibrid megk\u00f6zel\u00edt\u00e9s hozza: az AI gener\u00e1lja a kiindul\u00e1si alapot, a designer finom\u00edtja, az \u00fcgyf\u00e9llel k\u00f6z\u00f6sen iter\u00e1lunk.",
      },
      {
        type: "text",
        content:
          "A Works. csapat\u00e1n\u00e1l tudatosan integr\u00e1lunk AI eszk\u00f6z\u00f6ket a munkafolyamatainkba. Haszn\u00e1ljuk \u0151ket kutat\u00e1shoz, \u00f6tletgener\u00e1l\u00e1shoz \u00e9s protot\u00edpus-k\u00e9sz\u00edt\u00e9shez, de a v\u00e9gs\u0151 designd\u00f6nt\u00e9seket mindig tapasztalt designerek hozz\u00e1k meg.",
      },
    ],
  },
  {
    slug: "ux-kutatasi-modszerek",
    title: "5 UX kutat\u00e1si m\u00f3dszer, amit minden term\u00e9kcsapatnak ismernie kell",
    excerpt:
      "A felhaszn\u00e1l\u00f3i kutat\u00e1s nem luxus, hanem sz\u00fcks\u00e9gess\u00e9g. Bemutatjuk a leghat\u00e9konyabb m\u00f3dszereket, amelyekkel val\u00f3s felhaszn\u00e1l\u00f3i ig\u00e9nyeket t\u00e1rhatunk fel.",
    date: "2024. Janu\u00e1r 8.",
    author: "Kov\u00e1cs Anna",
    image: blogUxResearch,
    tags: ["UX Research", "Strat\u00e9gia"],
    readingTime: "9 perc",
    content: [
      {
        type: "text",
        content:
          "A UX kutat\u00e1s a term\u00e9kfejleszt\u00e9s legfontosabb, m\u00e9gis leggyakrabban elhanyagolt l\u00e9p\u00e9se. Sok csapat felt\u00e9telez\u00e9sek alapj\u00e1n tervez, nem val\u00f3s felhaszn\u00e1l\u00f3i adatok alapj\u00e1n. Az eredm\u00e9ny: olyan term\u00e9kek, amelyeket senki sem akar haszn\u00e1lni. Ebben a cikkben 5 bev\u00e1lt m\u00f3dszert mutatunk be, amelyek seg\u00edtenek elker\u00fclni ezt a csapd\u00e1t.",
      },
      {
        type: "highlight",
        content:
          "A term\u00e9kek 42%-a az\u00e9rt bukik meg, mert nincs val\u00f3di piaci ig\u00e9ny r\u00e1juk. A felhaszn\u00e1l\u00f3i kutat\u00e1s a legjobb biztos\u00edt\u00e9k, amit egy csapat a sikerre k\u00f6thet.",
      },
      {
        type: "text",
        content:
          "1. M\u00e9lyinterj\u00fa: A leg\u00e9rt\u00e9kesebb kutat\u00e1si m\u00f3dszer, amellyel a felhaszn\u00e1l\u00f3k motiv\u00e1ci\u00f3it, f\u00e9lelmeit \u00e9s c\u00e9ljait t\u00e1rhatjuk fel. \u00c1ltal\u00e1ban 45-60 perces besz\u00e9lget\u00e9sek, strukt\u00far\u00e1lt k\u00e9rd\u00e9ssorral, de nyitott k\u00e9rd\u00e9sekkel. 5-8 interj\u00fa m\u00e1r elegend\u0151 mint\u00e1zatok felismer\u00e9s\u00e9hez.",
      },
      {
        type: "text",
        content:
          "2. Haszn\u00e1lhat\u00f3s\u00e1gi teszt: A felhaszn\u00e1l\u00f3k val\u00f3s feladatokat v\u00e9geznek el a term\u00e9ken, mik\u00f6zben hangosan gondolkodnak. Ez a m\u00f3dszer felsz\u00ednre hozza a navig\u00e1ci\u00f3s probl\u00e9m\u00e1kat, a f\u00e9lre\u00e9rthet\u0151 funkci\u00f3kat \u00e9s az intu\u00edci\u00f3ellenes megold\u00e1sokat.",
      },
      {
        type: "image",
        content: blogUxResearch,
        caption: "Felhaszn\u00e1l\u00f3i kutat\u00e1s folyamata \u00e9s eszk\u00f6zei",
      },
      {
        type: "text",
        content:
          "3. K\u00e1rtya rendez\u00e9s (Card Sorting): A felhaszn\u00e1l\u00f3k csoportos\u00edtj\u00e1k a tartalmakat a saj\u00e1t logik\u00e1juk szerint. Ez a m\u00f3dszer k\u00fcl\u00f6n\u00f6sen hasznos inform\u00e1ci\u00f3s architekt\u00fara \u00e9s navig\u00e1ci\u00f3 tervez\u00e9s\u00e9n\u00e9l. Online eszk\u00f6z\u00f6kkel t\u00e1volr\u00f3l is elv\u00e9gezhet\u0151.",
      },
      {
        type: "text",
        content:
          "4. A/B tesztel\u00e9s: K\u00e9t vagy t\u00f6bb v\u00e1ltozatot mutatunk a felhaszn\u00e1l\u00f3knak, \u00e9s m\u00e9rj\u00fck, melyik teljes\u00edt jobban. Nem a v\u00e9lem\u00e9nyt k\u00e9rdezz\u00fck, hanem a t\u00e9nyleges viselked\u00e9st m\u00e9rj\u00fck. Statisztikailag szignifik\u00e1ns eredm\u00e9nyekhez legal\u00e1bb 100-200 r\u00e9sztvev\u0151 sz\u00fcks\u00e9ges v\u00e1ltozatonk\u00e9nt.",
      },
      {
        type: "highlight",
        content:
          "A legjobb kutat\u00e1si terv t\u00f6bbf\u00e9le m\u00f3dszert kombin\u00e1l: a kvalitat\u00edv m\u00f3dszerek (interj\u00fa, tesztel\u00e9s) megmutatj\u00e1k a mi\u00e9rt\u00e9t, a kvantitat\u00edv m\u00f3dszerek (A/B teszt, analytics) a mennyit.",
      },
      {
        type: "text",
        content:
          "5. Napl\u00f3-tanulm\u00e1ny (Diary Study): A felhaszn\u00e1l\u00f3k 1-4 h\u00e9ten kereszt\u00fcl dokument\u00e1lj\u00e1k a tapasztalataikat. Ez a m\u00f3dszer a hossz\u00fa t\u00e1v\u00fa haszn\u00e1lati mint\u00e1zatokat \u00e9s az id\u0151szakos frusztr\u00e1ci\u00f3kat t\u00e1rja fel, amelyeket egyszeri tesztekkel lehetetlen felismerni.",
      },
    ],
  },
  {
    slug: "mobile-first-tervezes",
    title: "Mobile-first tervez\u00e9s: Strat\u00e9gia, nem trend",
    excerpt:
      "A mobil forgalom ma m\u00e1r meghaladja a 60%-ot. Hogyan tervezz\u00fck \u00fagy a fel\u00fcleteinket, hogy mobilon \u00e9s desktopon is t\u00f6k\u00e9letes \u00e9lm\u00e9nyt ny\u00fajtisanak?",
    date: "2023. December 20.",
    author: "Nagy P\u00e9ter",
    image: blogMobileFirst,
    tags: ["Mobile", "UX", "Strat\u00e9gia"],
    readingTime: "7 perc",
    content: [
      {
        type: "text",
        content:
          "A mobile-first megk\u00f6zel\u00edt\u00e9s nem egyszer\u0171en azt jelenti, hogy el\u0151sz\u00f6r mobilra tervez\u00fcnk. Ez egy teljes gondolkod\u00e1sm\u00f3di v\u00e1lt\u00e1s: a tartalom prioriz\u00e1l\u00e1sa, a teljes\u00edtm\u00e9ny-orient\u00e1lt fejleszt\u00e9s \u00e9s a felhaszn\u00e1l\u00f3i kontextus meg\u00e9rt\u00e9se.",
      },
      {
        type: "highlight",
        content:
          "Magyarorsz\u00e1gon a webforgalom 63%-a mobil eszk\u00f6z\u00f6kr\u0151l \u00e9rkezik. Ha nem mobilra optimaliz\u00e1lunk els\u0151sorban, a felhaszn\u00e1l\u00f3ink t\u00f6bbs\u00e9g\u00e9t vesz\u00edtj\u00fck el.",
      },
      {
        type: "text",
        content:
          "Az els\u0151 l\u00e9p\u00e9s a tartalom prioriz\u00e1l\u00e1sa. Mobilon limit\u00e1lt a k\u00e9perny\u0151, ez\u00e9rt d\u00f6nt\u00e9st kell hozni: mi a legfontosabb inform\u00e1ci\u00f3, amit a felhaszn\u00e1l\u00f3 keres? A desktop verzi\u00f3ban megjelen\u0151 minden sz\u00f6veg, k\u00e9p \u00e9s funkci\u00f3 nem f\u00e9rhet el mobilon, \u00e9s nem is kell.",
      },
      {
        type: "image",
        content: blogMobileFirst,
        caption: "Reszponz\u00edv tervez\u00e9si elv: mobilt\u00f3l desktop fel\u00e9 \u00e9p\u00edtkezve",
      },
      {
        type: "text",
        content:
          "A navig\u00e1ci\u00f3 tervez\u00e9se az egyik legnehezebb feladat mobilon. A hamburger men\u00fc ugyan helyet sp\u00f3rol, de a felhaszn\u00e1l\u00f3k 45%-a sosem nyitja meg. Az alternat\u00edv\u00e1k: tab bar az als\u00f3 r\u00e9szen, priorit\u00e1sos navig\u00e1ci\u00f3 (a legfontosabb elemek l\u00e1that\u00f3ak, a t\u00f6bbi egy Tov\u00e1bbi men\u00fcpont alatt), vagy kontextu\u00e1lis navig\u00e1ci\u00f3.",
      },
      {
        type: "text",
        content:
          "A teljes\u00edtm\u00e9ny mobilon k\u00fcl\u00f6n\u00f6sen kritikus. A 3 m\u00e1sodpercn\u00e9l lassabban bet\u00f6lt\u0151 oldalakr\u00f3l a felhaszn\u00e1l\u00f3k 53%-a elugrik. A k\u00e9pek optimaliz\u00e1l\u00e1sa (WebP form\u00e1tum, responsive images), a k\u00f3dfeloszt\u00e1s (code splitting) \u00e9s a lazy loading alapvet\u0151 technik\u00e1k.",
      },
      {
        type: "highlight",
        content:
          "A mobile-first nem azt jelenti, hogy a desktopos \u00e9lm\u00e9ny m\u00e1sodrend\u0171. Azt jelenti, hogy a mobil korl\u00e1taib\u00f3l kiindulva jobb megold\u00e1sokat tal\u00e1lunk, amelyek mindenhol m\u0171k\u00f6dnek.",
      },
      {
        type: "text",
        content:
          "A Works. csapat\u00e1n\u00e1l minden projektet mobilr\u00f3l ind\u00edtunk. A wireframe-ek els\u0151 verzi\u00f3i mindig 375px sz\u00e9les k\u00e9perny\u0151re k\u00e9sz\u00fclnek, \u00e9s csak ezt k\u00f6vet\u0151en b\u0151v\u00edtj\u00fck ki tablet \u00e9s desktop m\u00e9retekre. Ez a megk\u00f6zel\u00edt\u00e9s biztos\u00edtja, hogy a v\u00e9geredm\u00e9ny minden eszk\u00f6z\u00f6n kiv\u00e1l\u00f3an m\u0171k\u00f6dj\u00f6n.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getNextBlogPost(currentSlug: string): BlogPost {
  const idx = blogPosts.findIndex((p) => p.slug === currentSlug);
  return blogPosts[(idx + 1) % blogPosts.length];
}
