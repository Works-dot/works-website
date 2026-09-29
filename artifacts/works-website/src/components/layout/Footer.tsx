import { useState } from "react";
import { Link } from "wouter";
import { Linkedin, Instagram, Dribbble, ArrowRight, Link as LinkIcon } from "lucide-react";
import { NewsletterError, useSubscribeNewsletter } from "@/hooks/use-newsletter";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getGlobalSettings, getServices } from "@/lib/strapi";
import type { GlobalSettings, Service } from "@/lib/strapi";
import { fallbackGlobalSettings, fallbackServices } from "@/data/fallback";
import { useCookieConsent } from "@/lib/cookie-consent";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { TermText } from "@/components/Terminology";
import { accessibleTermLabel } from "@/lib/terminology";
import { validSocialLinks } from "@/seo-data";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  // Facebook: Simple Icons. Clutch symbol: Clutch.co wordmark, Worldvectorlogo.
  facebook: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" data-social-icon="facebook">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  ),
  clutch: (
    <svg className="w-5 h-5" viewBox="54 5 24 24" fill="currentColor" aria-hidden="true" focusable="false" data-social-icon="clutch">
      <path d="M68.458 19.917c-.871.783-2.021 1.217-3.283 1.217-2.782 0-4.825-2.043-4.825-4.848s1.978-4.762 4.825-4.762c1.24 0 2.412.413 3.305 1.196l.607.522 2.697-2.696-.675-.609C69.522 8.504 67.415 7.7 65.174 7.7c-5 0-8.631 3.608-8.631 8.565 0 4.936 3.718 8.673 8.631 8.673 2.283 0 4.412-.804 5.979-2.26l.652-.609-2.739-2.694z" />
      <path d="M65.043 13.438a2.891 2.891 0 1 1 0 5.784 2.891 2.891 0 0 1 0-5.784" />
    </svg>
  ),
  dribbble: <Dribbble className="w-5 h-5" />,
  behance: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.443 5.35c.639 0 1.23.05 1.77.198a3.83 3.83 0 0 1 1.377.544c.394.247.689.594.886 1.04.197.445.296.99.296 1.583 0 .693-.148 1.286-.445 1.732-.296.445-.742.792-1.336 1.04.791.198 1.385.593 1.78 1.188.395.594.593 1.336.593 2.178 0 .643-.148 1.237-.395 1.682a3.35 3.35 0 0 1-1.04 1.188c-.445.296-.94.544-1.533.643A7.82 7.82 0 0 1 7.59 18.7H1V5.35h6.443zm-.394 5.54c.544 0 .99-.148 1.336-.395.346-.247.494-.692.494-1.286 0-.346-.05-.643-.197-.84a1.17 1.17 0 0 0-.494-.494 1.93 1.93 0 0 0-.692-.247 4.15 4.15 0 0 0-.791-.05H4.17v3.312h2.879zm.197 5.838c.297 0 .594-.05.84-.099a2.03 2.03 0 0 0 .693-.296c.197-.148.346-.346.445-.594.099-.247.198-.544.198-.94 0-.742-.198-1.287-.593-1.583-.395-.297-.94-.445-1.583-.445H4.17v3.957h3.076zM15.3 14.04c.346.395.84.593 1.484.593.445 0 .84-.099 1.138-.346.297-.198.494-.395.593-.593h2.573c-.395 1.188-.94 2.03-1.682 2.524-.742.445-1.632.692-2.721.692-.742 0-1.434-.099-2.03-.346a4.42 4.42 0 0 1-1.534-1.04c-.444-.445-.79-.94-1.04-1.583-.247-.594-.346-1.286-.346-2.03 0-.742.099-1.385.346-2.029.247-.593.593-1.138 1.04-1.583a4.42 4.42 0 0 1 1.534-1.04c.593-.247 1.287-.395 2.029-.395.84 0 1.534.148 2.128.494.594.346 1.04.792 1.435 1.385.395.594.642 1.237.84 1.98.098.742.148 1.484.049 2.326h-7.612c.049.791.395 1.385.791 1.78l-.034.01zM17.68 10.63c-.296-.346-.791-.544-1.385-.544-.395 0-.692.05-.94.198-.247.099-.445.247-.593.445-.148.148-.247.346-.297.544-.049.148-.098.297-.098.445h4.216c-.099-.494-.346-.94-.89-1.088h-.013zM14.58 6.28h4.81v1.287h-4.81V6.28z" /></svg>
  ),
};

export function Footer() {
  const { locale, messages, t } = useI18n();
  const [email, setEmail] = useState("");
  const { openSettings } = useCookieConsent();
  const { mutate, isPending, isSuccess, isError, error: newsletterError } = useSubscribeNewsletter();
  const { data: settings } = useStrapiQuery<GlobalSettings>("globalSettings", () => getGlobalSettings(locale), fallbackGlobalSettings, locale);
  const { data: services } = useStrapiQuery<Service[]>("footerServices", () => getServices(locale), fallbackServices, locale);
  const logoImg = settings?.logoUrl;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutate(email, {
      onSuccess: () => setEmail("")
    });
  };

  const newsletterHeading = settings?.newsletterHeading || (locale === "hu" ? "Iratkozz fel hírlevelünkre" : "");
  const newsletterDescription = settings?.newsletterDescription || (locale === "hu" ? "Heti inspiráció, UX trendek és szakmai tartalmak egyenesen a postaládádba." : "");
  const footerTagline = settings?.footerTagline || (locale === "hu" ? "Digitális élményeket tervezünk és építünk modern vállalatok számára." : "");
  const contactEmail = settings?.contactEmail || "hello@works.hu";
  const address = settings?.address || "";
  const copyrightText = settings?.copyrightText || `${new Date().getFullYear()} Works.`;
  const socialLinks = validSocialLinks(settings?.socialLinks);
  const footerServices = (services || []).slice(0, 4);

  return (
    <footer className="w-full relative z-10">
      <h2 className="sr-only">{t("footer.contentHeading")}</h2>
      <div className="bg-works-dark text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl lg:max-w-[calc(var(--container-7xl)-4rem)] mx-auto flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
          <div className="lg:flex-1">
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              <TermText>{newsletterHeading}</TermText>
            </h3>
            <p className="text-works-light/80 text-lg">
              <TermText>{newsletterDescription}</TermText>
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg lg:max-w-none lg:flex-1">
            <label htmlFor="newsletter-email" className="sr-only">
              <TermText>{t("footer.newsletterEmailLabel")}</TermText>
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("footer.newsletterEmailPlaceholder")}
              className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-works-primary focus:border-transparent transition-all"
              required
              data-testid="footer-newsletter-email"
            />
            <button
              type="submit"
              disabled={isPending}
              className="group px-8 py-4 border border-white text-white font-semibold hover:bg-white hover:text-works-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              data-testid="footer-newsletter-submit"
            >
              <TermText>
                {isPending ? t("footer.newsletterSubmitting") : t("footer.newsletterSubscribe")}
              </TermText>
              {!isPending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
            <span className="sr-only" role="status" aria-live="polite">
              <TermText>
                {isPending
                  ? t("footer.newsletterSubmitting")
                  : isSuccess
                    ? t("footer.newsletterSuccessDescription")
                    : isError
                      ? newsletterError instanceof NewsletterError && newsletterError.code === "invalid_email"
                        ? t("footer.newsletterInvalidEmail")
                        : t("footer.newsletterErrorDescription")
                      : ""}
              </TermText>
            </span>
          </form>
        </div>
      </div>

      <div className="bg-works-deepdark pt-20 pb-10 px-4 sm:px-6 lg:px-8 text-works-muted">
        <h3 className="sr-only">{t("footer.menuHeading")}</h3>
        <div className="max-w-6xl lg:max-w-[calc(var(--container-7xl)-4rem)] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            {logoImg ? (
              <img
                src={logoImg}
                alt={accessibleTermLabel(t("footer.logoAlt"), locale)}
                className="h-8 w-auto object-contain brightness-0 invert mb-6"
              />
            ) : (
              <span className="text-xl font-bold text-white mb-6 block">Works.</span>
            )}
            <p className="text-works-muted/80 leading-relaxed mb-8 whitespace-pre-line">
              <TermText>{footerTagline}</TermText>
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link) => {
                const key = link.platform.trim().toLowerCase();
                return (
                  <a
                    key={`${key}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={accessibleTermLabel(link.platform, locale)}
                    className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-works-primary hover:text-white transition-colors duration-300"
                  >
                    {SOCIAL_ICONS[key] || <LinkIcon className="w-5 h-5" aria-hidden="true" />}
                  </a>
                );
              })}
            </div>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
               <TermText>{t("footer.servicesHeading")}</TermText>
             </h4>
            <ul role="list" className="space-y-4">
              {footerServices.length > 0 ? (
                footerServices.map((svc, index) => (
                  <li key={svc.slug} aria-posinset={index + 1} aria-setsize={footerServices.length}>
                    <Link href={buildLocalePath(locale, "serviceDetail", svc.slug)} className="hover:text-works-primary transition-colors">
                       <TermText>{svc.title}</TermText>
                    </Link>
                  </li>
                ))
              ) : messages.footer.fallbackServices.map((label, index) => (
                <li key={label} aria-posinset={index + 1} aria-setsize={messages.footer.fallbackServices.length}>
                  <a
                    href={buildLocalePath(locale, "home", undefined, "#services")}
                    className="hover:text-works-primary transition-colors"
                  >
                     <TermText>{label}</TermText>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
               <TermText>{t("footer.companyHeading")}</TermText>
             </h4>
            <ul role="list" className="space-y-4">
               <li aria-posinset={1} aria-setsize={4}><Link href={buildLocalePath(locale, "about")} className="hover:text-works-primary transition-colors"><TermText>{t("nav.about")}</TermText></Link></li>
               <li aria-posinset={2} aria-setsize={4}><Link href={buildLocalePath(locale, "careers")} className="hover:text-works-primary transition-colors"><TermText>{t("nav.careers")}</TermText></Link></li>
               <li aria-posinset={3} aria-setsize={4}><Link href={buildLocalePath(locale, "blog")} className="hover:text-works-primary transition-colors"><TermText>{t("nav.blog")}</TermText></Link></li>
               <li aria-posinset={4} aria-setsize={4}><Link href={buildLocalePath(locale, "projects")} className="hover:text-works-primary transition-colors"><TermText>{t("footer.caseStudies")}</TermText></Link></li>
            </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
               <TermText>{t("footer.contactHeading")}</TermText>
             </h4>
            <ul role="list" className="space-y-4">
              <li aria-posinset={1} aria-setsize={2} className="flex flex-col">
                 <span className="text-sm text-works-muted/60 mb-1"><TermText>{t("footer.addressLabel")}</TermText></span>
                 <span className="text-works-muted"><TermText>{address}</TermText></span>
              </li>
              <li aria-posinset={2} aria-setsize={2} className="flex flex-col">
                 <span className="text-sm text-works-muted/60 mb-1"><TermText>{t("footer.emailLabel")}</TermText></span>
                <a href={`mailto:${contactEmail}`} className="text-works-primary font-semibold hover:underline">{contactEmail}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl lg:max-w-[calc(var(--container-7xl)-4rem)] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-works-muted/60">
          <p>&copy; {copyrightText}</p>
          <div className="flex w-full flex-col items-center gap-4 text-center md:w-auto md:flex-row md:items-stretch md:gap-6 md:text-left">
            <a
              href={buildLocalePath("hu", "privacy")}
              className="hover:text-white transition-colors"
            >
              <TermText>{t("footer.privacy")}</TermText>{locale === "en" ? " (Hungarian)" : ""}
            </a>
            <a
              href={buildLocalePath("hu", "cookies")}
              className="hover:text-white transition-colors"
            >
              <TermText>{t("footer.cookies")}</TermText>{locale === "en" ? " (Hungarian)" : ""}
            </a>
            <button
              type="button"
              onClick={openSettings}
              className="hover:text-white transition-colors"
              data-testid="button-cookie-settings"
            >
              <TermText>{t("footer.cookieSettings")}</TermText>
            </button>
            {(
              <a
                href={buildLocalePath("hu", "imprint")}
                className="hover:text-white transition-colors"
              >
                <TermText>{t("footer.imprint")}</TermText>{locale === "en" ? " (Hungarian)" : ""}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
