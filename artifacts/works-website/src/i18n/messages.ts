/**
 * messages.ts — Central UI translation dictionary.
 *
 * Rules:
 *  - Only UI chrome: navigation labels, accessibility labels, footer labels,
 *    common CTAs, form/validation/upload messages, loading/error/not-found
 *    states, cookie banner, reusable aria strings.
 *  - CMS/editorial content (page headings driven by Strapi, long copy,
 *    legal explanatory paragraphs) stays in Strapi / fallback data files.
 *  - Active locale is always "hu" today; EN entries are prepared but NOT used.
 *  - Supports simple named interpolation: t("key", { name: "value" })
 *    replaces {{name}} in the translated string.
 */

import type { Locale } from "@/lib/i18n-routes";

// ---------------------------------------------------------------------------
// Message dictionary type
// ---------------------------------------------------------------------------

export interface Messages {
  // Navigation
  nav: {
    mainLabel: string;
    mobileLabel: string;
    services: string;
    projects: string;
    blog: string;
    careers: string;
    about: string;
    contact: string;
    openMenu: string;
    closeMenu: string;
    languageSwitchLabel: string;
    switchToLanguage: string;
  };

  // Footer
  footer: {
    servicesHeading: string;
    companyHeading: string;
    contactHeading: string;
    addressLabel: string;
    emailLabel: string;
    privacy: string;
    cookies: string;
    cookieSettings: string;
    imprint: string;
    newsletterEmailLabel: string;
    newsletterEmailPlaceholder: string;
    newsletterSubmitting: string;
    newsletterSubscribe: string;
    newsletterSuccessTitle: string;
    newsletterSuccessDescription: string;
    newsletterErrorTitle: string;
    newsletterInvalidEmail: string;
    newsletterErrorDescription: string;
    caseStudies: string;
    logoAlt: string;
    fallbackServices: string[];
  };

  // Cookie banner
  cookieBanner: {
    dialogLabel: string;
    text: string;
    cookiePolicyLinkLabel: string;
    reject: string;
    accept: string;
  };

  // Cookie settings page (Sutik.tsx)
  cookiePage: {
    pageHeading: string;
    introBody: string;
    sectionEssential: string;
    essentialBodyBeforeStorageKey: string;
    essentialBodyAfterStorageKey: string;
    sectionThirdParty: string;
    thirdPartyBody: string;
    thirdPartyPolicyLeadIn: string;
    sectionFonts: string;
    fontsBody: string;
    sectionModify: string;
    modifyBody: string;
    googlePolicyLinkLabel: string;
    privacyBodyLeadIn: string;
    privacyPageLinkLabel: string;
    privacyBodyTrailingText: string;
    openSettingsButton: string;
  };

  // Privacy page (Adatkezeles.tsx)
  privacyPage: {
    pageHeading: string;
    redirectingText: string;
    documentLanguageNotice: string;
    openLinkLabel: string;
    loadingText: string;
  };

  // Contact form
  contact: {
    sectionContacts: string;
    addressLabel: string;
    openingHoursHeading: string;
    formNameLabel: string;
    formNamePlaceholder: string;
    formEmailLabel: string;
    formEmailPlaceholder: string;
    formSubjectLabel: string;
    formSubjectPlaceholder: string;
    formMessageLabel: string;
    formMessagePlaceholder: string;
    cvUploadLabel: string;
    cvUploadDragText: string;
    cvUploadBrowse: string;
    cvUploadHint: string;
    cvRemoveLabel: string;
    privacyConsentText: string;
    privacyConsentLinkLabel: string;
    submitButton: string;
    submitting: string;
    mapLoadButton: string;
    mapConsentText: string;
    mapTitle: string;
    closed: string;
    fallbackSubjects: { value: string; label: string }[];
  };

  // Form validation / upload errors
  validation: {
    cvInvalidType: string;
    cvTooLarge: string;
    cvUploadFailed: string;
  };

  // Common CTAs / actions
  cta: {
    readMore: string;
    viewProject: string;
    viewCaseStudy: string;
    viewDetails: string;
    backToBlog: string;
    backToProjects: string;
    backToCareers: string;
    backToHome: string;
    viewAll: string;
    contact: string;
    applyNow: string;
    learnMore: string;
    nextPost: string;
    nextProject: string;
    nextPosition: string;
  };

  // Loading / error / not-found states
  states: {
    loading: string;
    errorHeading: string;
    errorBody: string;
    navigationErrorHeading: string;
    navigationErrorBody: string;
    reloadPage: string;
    notFoundPost: string;
    notFoundProject: string;
    notFoundService: string;
    notFoundPosition: string;
    noResults: string;
    showAll: string;
    clientLabel: string;
  };

  // Page headings (UI chrome only — CMS headings remain in fallback/strapi)
  pages: {
    blogHeading: string;
    blogSubheading: string;
    projectsHeading: string;
    projectsSubheading: string;
    karrierHeading: string;
    openPositionsHeading: string;
    notFoundTitle: string;
    notFoundBody: string;
    notFoundBackHome: string;
    notFoundProjects: string;
    notFoundBlog: string;
    teamHeading: string;
  };

  // Sections (homepage sections)
  sections: {
    allProjects: string;
    allBlogs: string;
    clientsHeading: string;
    servicesNotFoundHeading: string;
    servicesNotFoundBody: string;
    servicesContactCta: string;
    featuredProjectsAriaLabel: string;
    featuredProjectsHeading: string;
    latestPostsHeading: string;
    serviceQuestionsHeading: string;
    serviceHelpHeading: string;
    serviceDeliverablesHeading: string;
    serviceProjectsHeading: string;
    serviceFaqHeading: string;
    relatedServicesHeading: string;
  };

  // Karrier page
  karrier: {
    prevSlide: string;
    nextSlide: string;
  };

  // MobileCarousel dot indicator
  carousel: {
    goToSlide: string;
  };

  // FilterDropdown
  filter: {
    ariaLabel: string;
  };
}

// ---------------------------------------------------------------------------
// HU messages
// ---------------------------------------------------------------------------

const hu: Messages = {
  nav: {
    mainLabel: "Fő navigáció",
    mobileLabel: "Mobil navigáció",
    services: "Szolgáltatások",
    projects: "Projektek",
    blog: "Blog",
    careers: "Karrier",
    about: "Rólunk",
    contact: "Kapcsolat",
    openMenu: "Menü megnyitása",
    closeMenu: "Menü bezárása",
    languageSwitchLabel: "Nyelvválasztó",
    switchToLanguage: "Váltás angol nyelvre",
  },

  footer: {
    servicesHeading: "Szolgáltatások",
    companyHeading: "Cég",
    contactHeading: "Kapcsolat",
    addressLabel: "Cím",
    emailLabel: "Email",
    privacy: "Adatvédelmi tájékoztató",
    cookies: "Sütikezelési tájékoztató",
    cookieSettings: "Süti beállítások",
    imprint: "Impresszum",
    newsletterEmailLabel: "E-mail címed",
    newsletterEmailPlaceholder: "E-mail címed",
    newsletterSubmitting: "Küldés...",
    newsletterSubscribe: "Feliratkozás",
    newsletterSuccessTitle: "Sikeres feliratkozás!",
    newsletterSuccessDescription: "Hamarosan küldjük a legújabb UX és design tartalmakat.",
    newsletterErrorTitle: "Hiba történt",
    newsletterInvalidEmail: "Érvénytelen e-mail-cím.",
    newsletterErrorDescription: "Kérjük, próbáld újra később.",
    caseStudies: "Esettanulmányok",
    logoAlt: "Works. Logo",
    fallbackServices: ["UX Kutatás", "UI Tervezés", "Service Design", "Webfejlesztés"],
  },

  cookieBanner: {
    dialogLabel: "Süti beállítások",
    text: "Weboldalunk működéséhez nem használunk követő sütiket. A Kapcsolat oldalon beágyazott Google Térkép azonban a betöltésekor a Google sütijeit használhatja — ehhez kérjük a hozzájárulásod. Részletek a",
    cookiePolicyLinkLabel: "süti tájékoztatóban",
    reject: "Elutasítom",
    accept: "Elfogadom",
  },

  cookiePage: {
    pageHeading: "Süti (cookie) tájékoztató",
    introBody: "A sütik (cookie-k) kis szöveges fájlok, amelyeket a meglátogatott weboldalak helyeznek el a böngésződben. A Works. weboldala a lehető legkevesebb sütit használja: nem futtatunk látogatáskövetést, statisztikai vagy marketing célú mérést.",
    sectionEssential: "Feltétlenül szükséges tárolás",
    essentialBodyBeforeStorageKey: "A süti-hozzájárulásoddal kapcsolatos döntésedet a böngésződ helyi tárolójában (localStorage,",
    essentialBodyAfterStorageKey: "kulcs) jegyezzük meg, hogy ne kelljen minden látogatáskor újra nyilatkoznod. Ez nem kerül továbbításra senkinek, és bármikor törölhető a böngésző adatainak törlésével.",
    sectionThirdParty: "Harmadik féltől származó tartalom: Google Térkép",
    thirdPartyBody: "A Kapcsolat oldalon irodánk elhelyezkedését beágyazott Google Térkép mutatja. A térkép betöltésekor a Google LLC sütiket helyezhet el, és adatokat (pl. IP-cím) kezelhet a saját adatkezelési szabályzata szerint. Ezért a térkép csak akkor töltődik be, ha ehhez kifejezetten hozzájárultál — a sütisávon vagy közvetlenül a térkép helyén megjelenő gombbal.",
    thirdPartyPolicyLeadIn: "A Google adatkezeléséről itt olvashatsz:",
    sectionFonts: "Betűtípusok",
    fontsBody: "A weboldal betűtípusait saját szerverünkről szolgáljuk ki, így a megjelenítésükhöz nem történik adattovábbítás külső szolgáltató felé.",
    sectionModify: "A hozzájárulás módosítása",
    modifyBody: "Döntésedet bármikor megváltoztathatod a lábléc „Süti beállítások” hivatkozásával, vagy az alábbi gombbal:",
    googlePolicyLinkLabel: "Google adatvédelmi irányelvek",
    privacyBodyLeadIn: "A személyes adatok kezeléséről bővebben az",
    privacyPageLinkLabel: "adatkezelési tájékoztatóban",
    privacyBodyTrailingText: " olvashatsz.",
    openSettingsButton: "Süti beállítások megnyitása",
  },

  privacyPage: {
    pageHeading: "Adatkezelési tájékoztató",
    redirectingText: "Átirányítunk a dokumentumhoz… Ha nem történik meg automatikusan,",
    documentLanguageNotice: "A hivatalos dokumentum magyar nyelven érhető el.",
    openLinkLabel: "kattints ide a megnyitáshoz",
    loadingText: "A dokumentum betöltése folyamatban…",
  },

  contact: {
    sectionContacts: "Elérhetőségeink",
    addressLabel: "Cím",
    openingHoursHeading: "Nyitvatartás",
    formNameLabel: "Név",
    formNamePlaceholder: "Teljes neved",
    formEmailLabel: "Email",
    formEmailPlaceholder: "email@cimed.hu",
    formSubjectLabel: "Tárgy",
    formSubjectPlaceholder: "Válassz témát...",
    formMessageLabel: "Üzenet",
    formMessagePlaceholder: "Mesélj a projektedről...",
    cvUploadLabel: "Önéletrajz feltöltése",
    cvUploadDragText: "Húzd ide az önéletrajzod, vagy",
    cvUploadBrowse: "tallózz",
    cvUploadHint: "PDF, DOC vagy DOCX, legfeljebb 10 MB",
    cvRemoveLabel: "Fájl eltávolítása",
    privacyConsentText: "Elolvastam és elfogadom az",
    privacyConsentLinkLabel: "adatkezelési tájékoztatót",
    submitButton: "Üzenet küldése",
    submitting: "Küldés...",
    mapLoadButton: "Térkép betöltése (Google sütiket használ)",
    mapConsentText: "A térkép betöltésével a Google Térkép szolgáltatása sütiket használhat, és adatokat kezelhet a Google adatvédelmi irányelvei szerint.",
    mapTitle: "Works. iroda – {{address}}",
    closed: "Zárva",
    fallbackSubjects: [
      { value: "ux-research", label: "UX kutatás" },
      { value: "ui-design", label: "UI Design" },
      { value: "service-design", label: "Service Design" },
      { value: "web-development", label: "Webfejlesztés" },
      { value: "accessibility", label: "Akadálymentesítés" },
      { value: "ai-design", label: "AI-alapú design" },
      { value: "other", label: "Egyéb" },
    ],
  },

  validation: {
    cvInvalidType: "Csak PDF, DOC vagy DOCX formátumú önéletrajz tölthető fel.",
    cvTooLarge: "A fájl mérete legfeljebb 10 MB lehet.",
    cvUploadFailed: "A feltöltés nem sikerült, kérjük próbáld újra később.",
  },

  cta: {
    readMore: "Elolvasom",
    viewProject: "Megnézem",
    viewCaseStudy: "Megnézem az esettanulmányt",
    viewDetails: "Részletek",
    backToBlog: "Vissza a blogra",
    backToProjects: "Vissza a projektekhez",
    backToCareers: "Vissza a karrieroldalra",
    backToHome: "Vissza a főoldalra",
    viewAll: "Minden projekt megtekintése",
    contact: "Kapcsolatfelvétel",
    applyNow: "Jelentkezem",
    learnMore: "Tudj meg többet",
    nextPost: "Következő bejegyzés",
    nextProject: "Következő projekt",
    nextPosition: "Következő pozíció",
  },

  states: {
    loading: "Betöltés...",
    errorHeading: "Hiba történt",
    errorBody: "A tartalom betöltése sikertelen. Kérjük, próbáld újra később.",
    navigationErrorHeading: "Az oldal betöltése megszakadt",
    navigationErrorBody: "Kérjük, töltsd újra az oldalt, vagy térj vissza a főoldalra.",
    reloadPage: "Oldal újratöltése",
    notFoundPost: "Bejegyzés nem található",
    notFoundProject: "Projekt nem található",
    notFoundService: "Szolgáltatás nem található",
    notFoundPosition: "Pozíció nem található",
    noResults: "Nincs találat a kiválasztott szűrőre.",
    showAll: "Összes mutatása",
    clientLabel: "Ügyfél: {{client}}",
  },

  pages: {
    blogHeading: "Szakmai tartalom",
    blogSubheading: "UX trendek, design gondolkodás és gyakorlati tanácsok digitális termékekhez.",
    projectsHeading: "Projektjeink",
    projectsSubheading: "Válogatás legfrissebb munkáinkból — UX kutatástól a komplex rendszertervezésig.",
    karrierHeading: "Karrier.",
    openPositionsHeading: "Nyitott pozíciók",
    notFoundTitle: "Az oldal nem található",
    notFoundBody: "A keresett oldal nem létezik, vagy időközben elköltözött. Nézz körül a főoldalon, a projektjeink vagy a blogunk között!",
    notFoundBackHome: "Vissza a főoldalra",
    notFoundProjects: "Projektjeink",
    notFoundBlog: "Blog",
    teamHeading: "Kollégáink",
  },

  sections: {
    allProjects: "Összes projekt",
    allBlogs: "Összes cikk",
    clientsHeading: "Ügyfeleink",
    servicesNotFoundHeading: "Nem találod amit keresel?",
    servicesNotFoundBody: "Vedd fel velünk a kapcsolatot egyedi igényeiddel kapcsolatban.",
    servicesContactCta: "Kapcsolatfelvétel",
    featuredProjectsAriaLabel: "Kiemelt projektjeink",
    featuredProjectsHeading: "Kiemelt projektjeink",
    latestPostsHeading: "Legfrissebb írásaink",
    serviceQuestionsHeading: "Milyen kérdésekre segítünk választ találni?",
    serviceHelpHeading: "Miben tudunk segíteni?",
    serviceDeliverablesHeading: "Amit a projektből kapsz",
    serviceProjectsHeading: "Projektpéldák",
    serviceFaqHeading: "Gyakran ismételt kérdések",
    relatedServicesHeading: "Kapcsolódó szolgáltatások",
  },

  karrier: {
    prevSlide: "Előző",
    nextSlide: "Következő",
  },

  carousel: {
    goToSlide: "Ugrás a(z) {{index}}. elemre",
  },

  filter: {
    ariaLabel: "Szűrés: {{label}}",
  },
};

// ---------------------------------------------------------------------------
// EN messages (prepared but not publicly active)
// ---------------------------------------------------------------------------

const en: Messages = {
  nav: {
    mainLabel: "Main navigation",
    mobileLabel: "Mobile navigation",
    services: "Services",
    projects: "Projects",
    blog: "Blog",
    careers: "Careers",
    about: "About us",
    contact: "Contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageSwitchLabel: "Language selector",
    switchToLanguage: "Switch to Hungarian",
  },

  footer: {
    servicesHeading: "Services",
    companyHeading: "Company",
    contactHeading: "Contact",
    addressLabel: "Address",
    emailLabel: "Email",
    privacy: "Privacy policy",
    cookies: "Cookie policy",
    cookieSettings: "Cookie settings",
    imprint: "Imprint (Hungarian PDF)",
    newsletterEmailLabel: "Your email",
    newsletterEmailPlaceholder: "Your email",
    newsletterSubmitting: "Sending...",
    newsletterSubscribe: "Subscribe",
    newsletterSuccessTitle: "Successfully subscribed!",
    newsletterSuccessDescription: "We’ll soon send you our latest UX and design content.",
    newsletterErrorTitle: "Something went wrong",
    newsletterInvalidEmail: "Please enter a valid email address.",
    newsletterErrorDescription: "Please try again later.",
    caseStudies: "Case studies",
    logoAlt: "Works. Logo",
    fallbackServices: ["UX Research", "UI Design", "Service Design", "Web Development"],
  },

  cookieBanner: {
    dialogLabel: "Cookie settings",
    text: "We do not use tracking cookies on our website. However, the embedded Google Map on the Contact page may use Google cookies when loaded — please give your consent for this. Details in the",
    cookiePolicyLinkLabel: "cookie policy",
    reject: "Reject",
    accept: "Accept",
  },

  cookiePage: {
    pageHeading: "Cookie policy",
    introBody: "Cookies are small text files that websites you visit place in your browser. The Works. website uses as few cookies as possible: we do not use visitor tracking, analytics or measurement for marketing purposes.",
    sectionEssential: "Strictly necessary storage",
    essentialBodyBeforeStorageKey: "We store your cookie consent decision in your browser's local storage (localStorage, under the",
    essentialBodyAfterStorageKey: "key) so that you do not have to make the choice again on every visit. This information is not transmitted to anyone and can be deleted at any time by clearing your browser data.",
    sectionThirdParty: "Third-party content: Google Maps",
    thirdPartyBody: "An embedded Google Map shows the location of our office on the Contact page. When the map is loaded, Google LLC may set cookies and process data (such as your IP address) in accordance with its own privacy policy. The map is therefore loaded only if you have expressly consented to this, either through the cookie banner or by using the button displayed in place of the map.",
    thirdPartyPolicyLeadIn: "You can read more about how Google processes data here:",
    sectionFonts: "Fonts",
    fontsBody: "We serve the website's fonts from our own server, so displaying them does not involve transferring data to an external service provider.",
    sectionModify: "Modifying your consent",
    modifyBody: "You can change your decision at any time by using the “Cookie settings” link in the footer or the button below:",
    googlePolicyLinkLabel: "Google Privacy Policy",
    privacyBodyLeadIn: "You can read more about how we process personal data in our",
    privacyPageLinkLabel: "privacy policy",
    privacyBodyTrailingText: ".",
    openSettingsButton: "Open cookie settings",
  },

  privacyPage: {
    pageHeading: "Privacy policy",
    redirectingText: "Redirecting you to the document… If it does not happen automatically,",
    documentLanguageNotice: "The official privacy notice is currently available in Hungarian.",
    openLinkLabel: "click here to open it",
    loadingText: "Loading document…",
  },

  contact: {
    sectionContacts: "Contact details",
    addressLabel: "Address",
    openingHoursHeading: "Opening hours",
    formNameLabel: "Name",
    formNamePlaceholder: "Your full name",
    formEmailLabel: "Email",
    formEmailPlaceholder: "email@yourcompany.com",
    formSubjectLabel: "Subject",
    formSubjectPlaceholder: "Choose a topic...",
    formMessageLabel: "Message",
    formMessagePlaceholder: "Tell us about your project...",
    cvUploadLabel: "Upload CV",
    cvUploadDragText: "Drag your CV here, or",
    cvUploadBrowse: "browse",
    cvUploadHint: "PDF, DOC or DOCX, up to 10 MB",
    cvRemoveLabel: "Remove file",
    privacyConsentText: "I have read and accept the",
    privacyConsentLinkLabel: "privacy policy",
    submitButton: "Send message",
    submitting: "Sending...",
    mapLoadButton: "Load map (uses Google cookies)",
    mapConsentText: "Loading the map may cause Google Maps to use cookies and process data according to Google's privacy policy.",
    mapTitle: "Works. office – {{address}}",
    closed: "Closed",
    fallbackSubjects: [
      { value: "ux-research", label: "UX research" },
      { value: "ui-design", label: "UI design" },
      { value: "service-design", label: "Service design" },
      { value: "web-development", label: "Web development" },
      { value: "accessibility", label: "Accessibility" },
      { value: "ai-design", label: "AI-assisted design" },
      { value: "other", label: "Other" },
    ],
  },

  validation: {
    cvInvalidType: "Only PDF, DOC or DOCX CV files are accepted.",
    cvTooLarge: "File size must not exceed 10 MB.",
    cvUploadFailed: "Upload failed, please try again later.",
  },

  cta: {
    readMore: "Read more",
    viewProject: "View project",
    viewCaseStudy: "View case study",
    viewDetails: "Details",
    backToBlog: "Back to blog",
    backToProjects: "Back to projects",
    backToCareers: "Back to careers",
    backToHome: "Back to home",
    viewAll: "View all projects",
    contact: "Get in touch",
    applyNow: "Apply now",
    learnMore: "Learn more",
    nextPost: "Next post",
    nextProject: "Next project",
    nextPosition: "Next position",
  },

  states: {
    loading: "Loading...",
    errorHeading: "An error occurred",
    errorBody: "Failed to load content. Please try again later.",
    navigationErrorHeading: "The page stopped loading",
    navigationErrorBody: "Please reload the page or return to the homepage.",
    reloadPage: "Reload page",
    notFoundPost: "Post not found",
    notFoundProject: "Project not found",
    notFoundService: "Service not found",
    notFoundPosition: "Position not found",
    noResults: "No results for the selected filter.",
    showAll: "Show all",
    clientLabel: "Client: {{client}}",
  },

  pages: {
    blogHeading: "Insights",
    blogSubheading: "UX trends, design thinking and practical advice for digital products.",
    projectsHeading: "Our projects",
    projectsSubheading: "A selection of our latest work — from UX research to complex system design.",
    karrierHeading: "Careers.",
    openPositionsHeading: "Open positions",
    notFoundTitle: "Page not found",
    notFoundBody: "The page you are looking for does not exist or has moved. Browse our homepage, projects or blog.",
    notFoundBackHome: "Back to home",
    notFoundProjects: "Our projects",
    notFoundBlog: "Blog",
    teamHeading: "Our team",
  },

  sections: {
    allProjects: "All projects",
    allBlogs: "All posts",
    clientsHeading: "Our clients",
    servicesNotFoundHeading: "Can't find what you're looking for?",
    servicesNotFoundBody: "Get in touch with us about your specific needs.",
    servicesContactCta: "Get in touch",
    featuredProjectsAriaLabel: "Featured projects",
    featuredProjectsHeading: "Featured projects",
    latestPostsHeading: "Latest insights",
    serviceQuestionsHeading: "What questions can we help answer?",
    serviceHelpHeading: "How can we help?",
    serviceDeliverablesHeading: "What you get from the project",
    serviceProjectsHeading: "Project examples",
    serviceFaqHeading: "Frequently asked questions",
    relatedServicesHeading: "Related services",
  },

  karrier: {
    prevSlide: "Previous",
    nextSlide: "Next",
  },

  carousel: {
    goToSlide: "Go to item {{index}}",
  },

  filter: {
    ariaLabel: "Filter: {{label}}",
  },
};

// ---------------------------------------------------------------------------
// Dictionary map
// ---------------------------------------------------------------------------

const MESSAGES: Record<Locale, Messages> = { hu, en };

export { MESSAGES };
