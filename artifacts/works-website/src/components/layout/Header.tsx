import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getServices, getGlobalSettings } from "@/lib/strapi";
import type { Service, GlobalSettings } from "@/lib/strapi";
import { fallbackServices, fallbackGlobalSettings } from "@/data/fallback";

const FALLBACK_SERVICE_LINKS = [
  { label: "UX Kutatás", href: "/szolgaltatasok/ux-kutatas" },
  { label: "UI Design", href: "/szolgaltatasok/ui-design" },
  { label: "Akadálymentesítés", href: "/szolgaltatasok/akadalymentesites" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [lang, setLang] = useState<"HU" | "EN">("HU");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: strapiServices } = useStrapiQuery<Service[]>("headerServices", getServices, fallbackServices);
  const { data: settings } = useStrapiQuery<GlobalSettings>("globalSettings", getGlobalSettings, fallbackGlobalSettings);
  const logoImg = settings?.logoUrl;

  const serviceLinks = strapiServices && strapiServices.length > 0
    ? strapiServices.map((s) => ({ label: s.title, href: `/szolgaltatasok/${s.slug}` }))
    : FALLBACK_SERVICE_LINKS;

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
    { label: "Projektek", href: "/projektek", isRoute: true },
    { label: "Blog", href: "/blog", isRoute: true },
    { label: "Karrier", href: "/karrier", isRoute: true },
    { label: "R\u00f3lunk", href: "/rolunk", isRoute: true },
    { label: "Kapcsolat", href: "/kapcsolat", isRoute: true },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white backdrop-blur-md shadow-sm py-3" : "bg-white py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 z-50">
          {logoImg ? (
            <img src={logoImg} alt="Works. Logo" className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-xl font-bold text-works-dark">Works.</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="F\u0151 navig\u00e1ci\u00f3">
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
              >
                {"Szolg\u00e1ltat\u00e1sok"}
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
              <li key={link.label}>
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
          
          <div className="flex items-center gap-4 pl-6 border-l border-works-muted">
            <button 
              onClick={() => setLang(lang === "HU" ? "EN" : "HU")}
              className="flex items-center gap-1.5 text-sm font-bold text-works-dark hover:text-works-primary transition-colors"
              aria-label={`Nyelv v\u00e1lt\u00e1s: ${lang === "HU" ? "English" : "Magyar"}`}
            >
              <Globe className="w-4 h-4" />
              <span>{lang}</span>
            </button>
          </div>
        </nav>

        <button 
          className="md:hidden relative z-50 p-2 text-works-dark"
          onClick={() => { setMobileMenuOpen(!mobileMenuOpen); if (mobileMenuOpen) setMobileServicesOpen(false); }}
          aria-label={mobileMenuOpen ? "Men\u00fc bez\u00e1r\u00e1sa" : "Men\u00fc megnyit\u00e1sa"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="navigation"
            aria-label="Mobil navig\u00e1ci\u00f3"
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
              >
                <button
                  onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  className="text-works-dark hover:text-works-primary flex items-center gap-2 w-full"
                >
                  {"Szolg\u00e1ltat\u00e1sok"}
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
                  key={link.label}
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
            <div className="mt-8 pt-8 border-t border-works-muted flex items-center gap-4">
              <button 
                onClick={() => setLang(lang === "HU" ? "EN" : "HU")}
                className="flex items-center gap-2 text-lg font-bold text-works-dark"
                aria-label={`Nyelv v\u00e1lt\u00e1s: ${lang === "HU" ? "English" : "Magyar"}`}
              >
                <Globe className="w-5 h-5" />
                <span>Nyelv: {lang}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
