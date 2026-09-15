import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type FocusEvent as ReactFocusEvent,
  type RefObject,
} from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useIsPresent } from "framer-motion";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getServices, getGlobalSettings } from "@/lib/strapi";
import type { Service, GlobalSettings } from "@/lib/strapi";
import { fallbackServices, fallbackGlobalSettings } from "@/data/fallback";
import { useI18n } from "@/i18n";
import { buildLocalePath, extractSearch, matchLocalePath, switchLocalePath } from "@/lib/i18n-routes";
import { getLocaleCounterpartSlug } from "@/data/fallback";
import { TermText } from "@/components/Terminology";
import { accessibleTermLabel } from "@/lib/terminology";

const FALLBACK_SERVICE_LINKS = [
  { label: "UX Kutatás", slug: "ux-kutatas" },
  { label: "UX/UI Design", slug: "ui-design" },
  { label: "Service design", slug: "service-design" },
  { label: "AI-alapú digitális termékfejlesztés", slug: "ai-termekfejlesztes" },
  { label: "Akadálymentes digitális szolgáltatások", slug: "akadalymentesites" },
  { label: "Digitális képességfejlesztés", slug: "digitalis-kepessegfejlesztes" },
];

const DESKTOP_SERVICES_PANEL_ID = "desktop-services-disclosure";
const MOBILE_SERVICES_PANEL_ID = "mobile-services-disclosure";
const MOBILE_MENU_ID = "mobile-menu";

type ServiceLink = { label: string; href: string };

interface HeaderNavLink {
  label: string;
  href: string;
  isRoute: boolean;
}

/**
 * An AnimatePresence child remains in the DOM while its exit animation runs.
 * Make that period inaccessible immediately, rather than leaving links in the
 * tab order behind a closed disclosure.
 */
function DesktopServicesPanel({
  serviceLinks,
  onLinkClick,
}: {
  serviceLinks: ServiceLink[];
  onLinkClick: () => void;
}) {
  const isInteractive = useIsPresent() !== false;

  return (
    <motion.div
      id={DESKTOP_SERVICES_PANEL_ID}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15 }}
      aria-hidden={!isInteractive}
      inert={!isInteractive}
      tabIndex={isInteractive ? undefined : -1}
      style={{ pointerEvents: isInteractive ? "auto" : "none" }}
      className="absolute top-full left-0 mt-2 w-56 bg-white border border-works-muted/30 shadow-lg py-2 z-50"
      data-testid="nav-desktop-services-panel"
    >
      {serviceLinks.map((sl, index) => (
        <Link
          key={sl.href}
          href={sl.href}
          tabIndex={isInteractive ? undefined : -1}
          className="block px-5 py-2.5 text-sm font-semibold text-works-dark hover:text-works-primary hover:bg-works-bg transition-colors"
          onClick={onLinkClick}
          data-testid={`link-service-desktop-${index}`}
        >
          <TermText>{sl.label}</TermText>
        </Link>
      ))}
    </motion.div>
  );
}

function MobileServicesPanel({
  serviceLinks,
  onLinkClick,
}: {
  serviceLinks: ServiceLink[];
  onLinkClick: () => void;
}) {
  const isInteractive = useIsPresent() !== false;

  return (
    <motion.ul
      id={MOBILE_SERVICES_PANEL_ID}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-hidden={!isInteractive}
      inert={!isInteractive}
      tabIndex={isInteractive ? undefined : -1}
      style={{ pointerEvents: isInteractive ? "auto" : "none" }}
      className="overflow-hidden ml-4 mt-3 flex flex-col gap-3"
      data-testid="nav-mobile-services-panel"
    >
      {serviceLinks.map((sl, index) => (
        <li key={sl.href}>
          <Link
            href={sl.href}
            tabIndex={isInteractive ? undefined : -1}
            onClick={onLinkClick}
            className="text-works-dark/70 hover:text-works-primary text-lg font-semibold block"
            data-testid={`link-service-mobile-${index}`}
          >
            <TermText>{sl.label}</TermText>
          </Link>
        </li>
      ))}
    </motion.ul>
  );
}

function MobileMenuPanel({
  languageHref,
  targetLocale,
  serviceLinks,
  navLinks,
  mobileServicesOpen,
  servicesTriggerRef,
  servicesLabel,
  mobileLabel,
  languageSwitchLabel,
  onKeyDown,
  onLanguageClick,
  onServicesToggle,
  onServiceLinkClick,
  onNavLinkClick,
}: {
  languageHref: string;
  targetLocale: "hu" | "en";
  serviceLinks: ServiceLink[];
  navLinks: HeaderNavLink[];
  mobileServicesOpen: boolean;
  servicesTriggerRef: RefObject<HTMLButtonElement | null>;
  servicesLabel: string;
  mobileLabel: string;
  languageSwitchLabel: string;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onLanguageClick: () => void;
  onServicesToggle: () => void;
  onServiceLinkClick: () => void;
  onNavLinkClick: () => void;
}) {
  const isInteractive = useIsPresent() !== false;
  const { locale } = useI18n();

  return (
    <motion.div
      id={MOBILE_MENU_ID}
      role="navigation"
      aria-label={accessibleTermLabel(mobileLabel, locale)}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "100vh", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      aria-hidden={!isInteractive}
      inert={!isInteractive}
      tabIndex={isInteractive ? undefined : -1}
      style={{ pointerEvents: isInteractive ? "auto" : "none" }}
      onKeyDown={onKeyDown}
      className="absolute top-0 left-0 w-full bg-white md:hidden pt-24 px-6 shadow-xl flex flex-col overflow-y-auto"
      data-testid="nav-mobile-menu"
    >
      <ul className="flex flex-col gap-6 text-xl font-bold">
        <motion.li
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          role="group"
          aria-label={accessibleTermLabel(languageSwitchLabel, locale)}
        >
          <a
            href={languageHref}
            onClick={onLanguageClick}
            aria-label={accessibleTermLabel(languageSwitchLabel, locale)}
            lang={targetLocale}
            tabIndex={isInteractive ? undefined : -1}
            className="text-works-dark hover:text-works-primary block"
            data-testid="language-switch-mobile"
          >
            {targetLocale.toUpperCase()}
          </a>
        </motion.li>
        <motion.li
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            ref={servicesTriggerRef}
            type="button"
            onClick={onServicesToggle}
            aria-expanded={isInteractive && mobileServicesOpen}
            aria-controls={MOBILE_SERVICES_PANEL_ID}
            className="text-works-dark hover:text-works-primary flex items-center gap-2 w-full"
            tabIndex={isInteractive ? undefined : -1}
            data-testid="nav-mobile-services-trigger"
          >
            <TermText>{servicesLabel}</TermText>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileServicesOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {mobileServicesOpen && (
              <MobileServicesPanel
                serviceLinks={serviceLinks}
                onLinkClick={onServiceLinkClick}
              />
            )}
          </AnimatePresence>
        </motion.li>

        {navLinks.map((link, index) => (
          <motion.li
            key={link.href}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {link.isRoute ? (
              <Link
                href={link.href}
                onClick={onNavLinkClick}
                tabIndex={isInteractive ? undefined : -1}
                className="text-works-dark hover:text-works-primary block"
                data-testid={`link-mobile-nav-${index}`}
              >
                <TermText>{link.label}</TermText>
              </Link>
            ) : (
              <a
                href={link.href}
                onClick={onNavLinkClick}
                tabIndex={isInteractive ? undefined : -1}
                className="text-works-dark hover:text-works-primary block"
                data-testid={`link-mobile-nav-${index}`}
              >
                <TermText>{link.label}</TermText>
              </a>
            )}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function Header() {
  const { locale, t } = useI18n();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const servicesOpenRef = useRef(false);
  const openedByHoverRef = useRef(false);
  const desktopServicesRef = useRef<HTMLLIElement>(null);
  const desktopServicesTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileServicesTriggerRef = useRef<HTMLButtonElement>(null);
  const { data: strapiServices } = useStrapiQuery<Service[]>("headerServices", () => getServices(locale), fallbackServices, locale);
  const { data: settings } = useStrapiQuery<GlobalSettings>("globalSettings", () => getGlobalSettings(locale), fallbackGlobalSettings, locale);
  const logoImg = settings?.logoUrl;

  const serviceLinks = strapiServices && strapiServices.length > 0
    ? strapiServices.map((s) => ({ label: s.title, href: buildLocalePath(locale, "serviceDetail", s.slug) }))
    : locale === "hu"
      ? FALLBACK_SERVICE_LINKS.map((s) => ({ label: s.label, href: buildLocalePath(locale, "serviceDetail", s.slug) }))
      : [];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    servicesOpenRef.current = servicesOpen;
  }, [servicesOpen]);

  const clearServicesCloseTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const closeDesktopServices = ({ restoreFocus = false } = {}) => {
    clearServicesCloseTimeout();
    const activeElement = typeof document === "undefined" ? null : document.activeElement;
    const focusTrigger =
      restoreFocus ||
      (activeElement !== null && desktopServicesRef.current?.contains(activeElement));

    servicesOpenRef.current = false;
    openedByHoverRef.current = false;
    setServicesOpen(false);
    if (focusTrigger) desktopServicesTriggerRef.current?.focus();
  };

  const openDesktopServices = (openedByHover: boolean) => {
    clearServicesCloseTimeout();
    servicesOpenRef.current = true;
    openedByHoverRef.current = openedByHover;
    setServicesOpen(true);
  };

  const handlePointerEnter = () => {
    clearServicesCloseTimeout();
    if (!servicesOpenRef.current) openDesktopServices(true);
  };

  const handlePointerLeave = () => {
    clearServicesCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      const activeElement = typeof document === "undefined" ? null : document.activeElement;
      if (activeElement && desktopServicesRef.current?.contains(activeElement)) return;
      closeDesktopServices();
    }, 150);
  };

  const handleDesktopServicesClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    /*
     * A pointer click follows pointerenter. Keep a hover-opened panel open on
     * that first click, so mouse activation cannot immediately undo hover.
     * Keyboard activation has detail === 0 and always toggles the disclosure.
     */
    if (event.detail > 0 && servicesOpenRef.current && openedByHoverRef.current) {
      openedByHoverRef.current = false;
      clearServicesCloseTimeout();
      return;
    }

    if (servicesOpenRef.current) {
      closeDesktopServices({ restoreFocus: true });
    } else {
      openDesktopServices(false);
    }
  };

  const handleDesktopServicesKeyDown = (event: ReactKeyboardEvent<HTMLLIElement>) => {
    if (event.key !== "Escape" || !servicesOpenRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    closeDesktopServices({ restoreFocus: true });
  };

  const handleDesktopServicesBlur = (event: ReactFocusEvent<HTMLLIElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      closeDesktopServices();
    }
  };

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent) => {
      if (!servicesOpenRef.current) return;
      const target = event.target;
      if (target instanceof Node && desktopServicesRef.current?.contains(target)) return;
      closeDesktopServices();
    };

    const handleDocumentFocusIn = (event: FocusEvent) => {
      if (!servicesOpenRef.current) return;
      const target = event.target;
      if (target instanceof Node && desktopServicesRef.current?.contains(target)) return;
      closeDesktopServices();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("focusin", handleDocumentFocusIn);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("focusin", handleDocumentFocusIn);
    };
  }, []);

  const closeMobileServices = (restoreFocus = false) => {
    setMobileServicesOpen(false);
    if (restoreFocus) mobileServicesTriggerRef.current?.focus();
  };

  const closeMobileMenu = (restoreFocus = false) => {
    setMobileMenuOpen(false);
    setMobileServicesOpen(false);
    if (restoreFocus) mobileMenuToggleRef.current?.focus();
  };

  const handleMobileMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (mobileServicesOpen) {
      closeMobileServices(true);
    } else {
      closeMobileMenu(true);
    }
  };

  const navLinks: HeaderNavLink[] = [
    { label: t("nav.projects"), href: buildLocalePath(locale, "projects"), isRoute: true },
    { label: t("nav.blog"), href: buildLocalePath(locale, "blog"), isRoute: true },
    { label: t("nav.careers"), href: buildLocalePath(locale, "careers"), isRoute: true },
    { label: t("nav.about"), href: buildLocalePath(locale, "about"), isRoute: true },
    { label: t("nav.contact"), href: buildLocalePath(locale, "contact"), isRoute: true },
  ];
  const targetLocale = locale === "hu" ? "en" : "hu";
  // Wouter supplies the pathname. Read browser search/hash when available so a
  // language change never drops an in-page state or anchor.
  const currentPath = typeof window === "undefined"
    ? location
    : `${location}${window.location.search}${window.location.hash}`;
  const routeMatch = matchLocalePath(currentPath);
  const languageHref =
    routeMatch?.slug &&
    (routeMatch.routeKey === "projectDetail" ||
      routeMatch.routeKey === "blogPost" ||
      routeMatch.routeKey === "serviceDetail" ||
      routeMatch.routeKey === "careerDetail")
      ? (() => {
          const counterpartSlug = getLocaleCounterpartSlug(
            locale,
            targetLocale,
            routeMatch.routeKey,
            routeMatch.slug,
          );
          return counterpartSlug
            ? buildLocalePath(targetLocale, routeMatch.routeKey, counterpartSlug, extractSearch(currentPath))
            : buildLocalePath(targetLocale, "home", undefined, extractSearch(currentPath));
        })()
      : switchLocalePath(currentPath, targetLocale);
  const languageLink = (
    <a
      href={languageHref}
      aria-label={accessibleTermLabel(t("nav.switchToLanguage"), locale)}
      lang={targetLocale}
      className="text-sm font-bold tracking-wide text-works-dark hover:text-works-primary transition-colors"
      data-testid="language-switch"
    >
      {targetLocale.toUpperCase()}
    </a>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-works-dark [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-works-dark ${
        scrolled ? "bg-white backdrop-blur-md shadow-sm py-3" : "bg-white py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href={buildLocalePath(locale, "home")} className="flex items-center gap-2 z-50" data-testid="link-logo">
          {logoImg ? (
            <img src={logoImg} alt={accessibleTermLabel(t("footer.logoAlt"), locale)} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-xl font-bold text-works-dark">Works.</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label={accessibleTermLabel(t("nav.mainLabel"), locale)}>
          <ul className="flex items-center gap-6">
            <li
              ref={desktopServicesRef}
              className="relative"
              onMouseEnter={handlePointerEnter}
              onMouseLeave={handlePointerLeave}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              onBlur={handleDesktopServicesBlur}
              onKeyDown={handleDesktopServicesKeyDown}
            >
              <button
                ref={desktopServicesTriggerRef}
                type="button"
                className="text-works-dark font-semibold hover:text-works-primary transition-colors text-sm tracking-wide inline-flex items-center gap-1"
                aria-expanded={servicesOpen}
                aria-controls={DESKTOP_SERVICES_PANEL_ID}
                data-testid="nav-services-trigger"
                onClick={handleDesktopServicesClick}
              >
                <TermText>{t("nav.services")}</TermText>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {servicesOpen && (
                  <DesktopServicesPanel
                    serviceLinks={serviceLinks}
                    onLinkClick={() => closeDesktopServices()}
                  />
                )}
              </AnimatePresence>
            </li>

            {navLinks.map((link, index) => (
              <li key={link.href}>
                {link.isRoute ? (
                  <Link
                    href={link.href}
                    className="text-works-dark font-semibold hover:text-works-primary transition-colors text-sm tracking-wide"
                    data-testid={`link-desktop-nav-${index}`}
                  >
                    <TermText>{link.label}</TermText>
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="text-works-dark font-semibold hover:text-works-primary transition-colors text-sm tracking-wide"
                    data-testid={`link-desktop-nav-${index}`}
                  >
                    <TermText>{link.label}</TermText>
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div role="group" aria-label={accessibleTermLabel(t("nav.languageSwitchLabel"), locale)}>{languageLink}</div>
        </nav>

        <button
          ref={mobileMenuToggleRef}
          type="button"
          className="md:hidden relative z-50 p-2 text-works-dark"
          onClick={() => mobileMenuOpen ? closeMobileMenu(true) : setMobileMenuOpen(true)}
          aria-label={accessibleTermLabel(
            mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu"),
            locale,
          )}
          aria-expanded={mobileMenuOpen}
          aria-controls={MOBILE_MENU_ID}
          data-testid="nav-mobile-toggle"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <MobileMenuPanel
            languageHref={languageHref}
            targetLocale={targetLocale}
            serviceLinks={serviceLinks}
            navLinks={navLinks}
            mobileServicesOpen={mobileServicesOpen}
            servicesTriggerRef={mobileServicesTriggerRef}
            servicesLabel={t("nav.services")}
            mobileLabel={t("nav.mobileLabel")}
            languageSwitchLabel={t("nav.switchToLanguage")}
            onKeyDown={handleMobileMenuKeyDown}
            onLanguageClick={() => closeMobileMenu(true)}
            onServicesToggle={() => setMobileServicesOpen((open) => !open)}
            onServiceLinkClick={() => closeMobileMenu(true)}
            onNavLinkClick={() => closeMobileMenu(true)}
          />
        )}
      </AnimatePresence>
    </header>
  );
}