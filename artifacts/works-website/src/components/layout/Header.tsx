import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getServices, getGlobalSettings } from "@/lib/strapi";
import type { Service, GlobalSettings } from "@/lib/strapi";
import { fallbackServices, fallbackGlobalSettings } from "@/data/fallback";
import { useI18n } from "@/i18n";
import { buildLocalePath, switchLocalePath } from "@/lib/i18n-routes";

const FALLBACK_SERVICE_LINKS = [
  { label: "UX Kutatás", slug: "ux-kutatas" },
  { label: "UX/UI Design", slug: "ui-design" },
  { label: "Service design", slug: "service-design" },
  { label: "AI-alapú digitális termékfejlesztés", slug: "ai-termekfejlesztes" },
  { label: "Akadálymentes digitális szolgáltatások", slug: "akadalymentesites" },
  { label: "Digitális képességfejlesztés", slug: "digitalis-kepessegfejlesztes" },
];

export function Header() {
  const { locale, t } = useI18n();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setServicesOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setServicesOpen(false);
    }, 150);
  };

  const navLinks = [
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
  const languageHref = switchLocalePath(currentPath, targetLocale);
  const languageLink = (
    <a
      href={languageHref}
      aria-label={t("nav.switchToLanguage")}
      lang={targetLocale}
      className="text-sm font-bold tracking-wide text-works-dark hover:text-works-primary transition-colors"
      data-testid="language-switch"
    >
      {targetLocale.toUpperCase()}
    </a>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white backdrop-blur-md shadow-sm py-3" : "bg-white py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href={buildLocalePath(locale, "home")} className="flex items-center gap-2 z-50">
          {logoImg ? (
            <img src={logoImg} alt={t("footer.logoAlt")} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-xl font-bold text-works-dark">Works.</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label={t("nav.mainLabel")}>
          <ul className="flex items-center gap-6">
            <li
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="text-works-dark font-semibold hover:text-works-primary transition-colors text-sm tracking-wide inline-flex items-center gap-1"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                data-testid="nav-services-trigger"
              >
                {t("nav.services")}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white border border-works-muted/30 shadow-lg py-2 z-50"
                  >
                    {serviceLinks.map((sl) => (
                      <Link
                        key={sl.href}
                        href={sl.href}
                        className="block px-5 py-2.5 text-sm font-semibold text-works-dark hover:text-works-primary hover:bg-works-bg transition-colors"
                        onClick={() => setServicesOpen(false)}
                      >
                        {sl.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            {navLinks.map((link) => (
              <li key={link.href}>
                {link.isRoute ? (
                  <Link href={link.href} className="text-works-dark font-semibold hover:text-works-primary transition-colors text-sm tracking-wide">
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.href} className="text-works-dark font-semibold hover:text-works-primary transition-colors text-sm tracking-wide">
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div role="group" aria-label={t("nav.languageSwitchLabel")}>{languageLink}</div>
        </nav>

        <button
          className="md:hidden relative z-50 p-2 text-works-dark"
          onClick={() => { setMobileMenuOpen(!mobileMenuOpen); if (mobileMenuOpen) setMobileServicesOpen(false); }}
          aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          data-testid="nav-mobile-toggle"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="navigation"
            aria-label={t("nav.mobileLabel")}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "100vh", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-full bg-white md:hidden pt-24 px-6 shadow-xl flex flex-col overflow-y-auto"
          >
            <ul className="flex flex-col gap-6 text-xl font-bold">
              <motion.li
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                role="group"
                aria-label={t("nav.languageSwitchLabel")}
              >
                <a
                  href={languageHref}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label={t("nav.switchToLanguage")}
                  lang={targetLocale}
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
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="text-works-dark hover:text-works-primary flex items-center gap-2 w-full"
                  data-testid="nav-mobile-services-trigger"
                >
                  {t("nav.services")}
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileServicesOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {mobileServicesOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-4 mt-3 flex flex-col gap-3"
                    >
                      {serviceLinks.map((sl) => (
                        <li key={sl.href}>
                          <Link
                            href={sl.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-works-dark/70 hover:text-works-primary text-lg font-semibold block"
                          >
                            {sl.label}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </motion.li>

              {navLinks.map((link) => (
                <motion.li
                  key={link.href}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {link.isRoute ? (
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-works-dark hover:text-works-primary block">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-works-dark hover:text-works-primary block">
                      {link.label}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
