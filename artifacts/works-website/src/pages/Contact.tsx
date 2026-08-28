import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useRef } from "react";
import { MapPin, Mail, Phone, ArrowRight, Upload, X, FileText } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getContactPage, getGlobalSettings, getLegalDocuments, uploadCv, CV_MAX_SIZE_BYTES, CV_ACCEPT, CV_ALLOWED_EXTENSIONS } from "@/lib/strapi";
import type { ContactPageData, GlobalSettings, LegalDocuments } from "@/lib/strapi";
import { fallbackContactPage, fallbackGlobalSettings, fallbackLegalDocuments, contactGraphicFallbackImg } from "@/data/fallback";
import { useCookieConsent } from "@/lib/cookie-consent";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

const inputClass =
  "w-full px-5 py-4 border border-works-dark/10 bg-white text-works-dark placeholder:text-works-dark/30 focus:outline-none focus:ring-2 focus:ring-works-primary/30 focus:border-works-primary transition-colors";

// A Google Maps csak a speciális beágyazó (embed) linket engedi <iframe>-be.
// Ez a függvény a leggyakoribb, adminban beragasztott link-formákat alakítja
// át beágyazható linkké, hogy a térkép akkor is megjelenjen, ha nem a hivatalos
// embed linket adták meg. Biztonság: iframe-be CSAK https + Google Maps domain
// kerülhet; minden más esetben üres sztringet ad vissza, és a hívó a biztonságos
// alapértelmezett térképre esik vissza.
function isGoogleMapsHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "google.com" ||
    h.endsWith(".google.com") ||
    h === "google.hu" ||
    h.endsWith(".google.hu")
  );
}

function googleQueryEmbed(q: string, locale: "hu" | "en"): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&hl=${locale}`;
}

function toMapEmbedUrl(raw: string, locale: "hu" | "en"): string {
  const value = (raw || "").trim();
  if (!value) return "";

  // Teljes <iframe ...> kódot illesztettek be — emeljük ki a src-et.
  let candidate = value;
  if (value.toLowerCase().includes("<iframe")) {
    const m = value.match(/src=["']([^"']+)["']/i);
    candidate = m ? m[1].replace(/&amp;/g, "&") : value;
  }

  // Koordináták a linkben: .../@47.5045,19.0514,15z/...
  const at = candidate.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/);
  if (at) {
    const [, lat, lng, zoom] = at;
    const z = zoom ? `&z=${Math.round(Number(zoom))}` : "";
    return `https://maps.google.com/maps?q=${lat},${lng}${z}&output=embed&hl=${locale}`;
  }

  // Sima koordináták: "47.5045,19.0514".
  if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(candidate)) {
    return googleQueryEmbed(candidate.replace(/\s+/g, ""), locale);
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(candidate);
  } catch {
    parsed = null;
  }

  // Nem URL (sima cím) — keresésként ágyazzuk be.
  if (!parsed) return googleQueryEmbed(candidate, locale);

  // Csak https + Google Maps domain engedélyezett iframe-ben; minden más tiltott.
  if (parsed.protocol !== "https:" || !isGoogleMapsHost(parsed.hostname)) {
    return "";
  }

  // Már beágyazható Google link.
  if (
    parsed.pathname.includes("/maps/embed") ||
    parsed.searchParams.get("output") === "embed"
  ) {
    parsed.searchParams.set("hl", locale);
    return parsed.toString();
  }

  // Kifejezett q= paraméter (pl. ?q=Szabadság+tér).
  const q = parsed.searchParams.get("q");
  if (q) return googleQueryEmbed(q, locale);

  // /place/<név>/ szakasz a path-ban.
  const place = parsed.pathname.match(/\/place\/([^/@]+)/);
  if (place) {
    const name = decodeURIComponent(place[1].replace(/\+/g, " "));
    return googleQueryEmbed(name, locale);
  }

  // Google host, de ismeretlen forma — biztonságos próba output=embed-del.
  parsed.searchParams.set("output", "embed");
  parsed.searchParams.set("hl", locale);
  return parsed.toString();
}

export default function Contact() {
  const { locale, messages, t } = useI18n();
  const { consent, accept } = useCookieConsent();
  const {
    data: contactPage,
    loading: contactLoading,
    error: contactError,
  } = useStrapiQuery<ContactPageData>("contactPage", () => getContactPage(locale), fallbackContactPage, locale);
  const {
    data: globalSettings,
    loading: globalSettingsLoading,
    error: globalSettingsError,
  } = useStrapiQuery<GlobalSettings>("globalSettings", () => getGlobalSettings(locale), fallbackGlobalSettings, locale);
  const { data: legalDocs } = useStrapiQuery<LegalDocuments>("legalDocuments", () => getLegalDocuments(locale), fallbackLegalDocuments, locale);
  const privacyPdfUrl = legalDocs?.privacyPdfUrl || buildLocalePath(locale, "privacy");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentChecked, setConsentChecked] = useState({ first: false, second: false });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Karrier tárgy esetén megjelenő hozzájárulás-checkboxok (CMS-ből).
  const selectedSubject = (contactPage?.formSubjects || []).find((s) => s.value === formData.subject);
  const isCareerSubject = !!selectedSubject?.isCareer;
  const careerConsent = contactPage?.careerConsent || null;
  const consentItems = isCareerSubject && careerConsent
    ? [
        { key: "first" as const, text: (careerConsent.checkbox1Text || "").trim() },
        { key: "second" as const, text: (careerConsent.checkbox2Text || "").trim() },
      ].filter((c) => c.text)
    : [];
  const consentsSatisfied = privacyAccepted && consentItems.every((c) => consentChecked[c.key]);
  const cvSatisfied = !isCareerSubject || cvFile !== null;

  const validateCvFile = (file: File): string | null => {
    const name = file.name.toLowerCase();
    if (!CV_ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      return t("validation.cvInvalidType");
    }
    if (file.size > CV_MAX_SIZE_BYTES) {
      return t("validation.cvTooLarge");
    }
    return null;
  };

  const handleCvSelect = (file: File | null) => {
    if (!file) return;
    const error = validateCvFile(file);
    if (error) {
      setCvFile(null);
      setCvError(error);
    } else {
      setCvFile(file);
      setCvError(null);
    }
  };

  const clearCv = () => {
    setCvFile(null);
    setCvError(null);
    if (cvInputRef.current) cvInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentsSatisfied || !cvSatisfied || submitting) return;
    if (isCareerSubject && cvFile) {
      setSubmitting(true);
      setCvError(null);
      try {
        await uploadCv(cvFile);
      } catch {
        setCvError(t("validation.cvUploadFailed"));
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "subject") {
      setConsentChecked({ first: false, second: false });
      clearCv();
    }
  };

  const contactGraphic = contactGraphicFallbackImg;
  const heroHeading = contactPage?.hero?.heading || (locale === "hu" ? "Kapcsolat." : "");
  const heroDescription = contactPage?.hero?.description || (locale === "hu" ? "Beszéljünk a következő projektedről!" : "");
  const formHeading = contactPage?.formHeading || (locale === "hu" ? "Írj nekünk" : "");
  const successTitle = contactPage?.successTitle || (locale === "hu" ? "Üzenet elküldve!" : "");
  const successMessage = contactPage?.successMessage || (locale === "hu" ? "Köszönjük megkeresésed, hamarosan válaszolunk." : "");
  const mapHeading = contactPage?.mapHeading || (locale === "hu" ? "Itt találsz minket" : "");
  const mapEmbedUrl = toMapEmbedUrl(contactPage?.mapEmbedUrl || "", locale) || (locale === "hu"
    ? "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.4!2d19.0514!3d47.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dc14ca087e31%3A0x6a06c4f9e5a2e0!2sSzabads%C3%A1g%20t%C3%A9r%2C%20Budapest%2C%201054!5e0!3m2!1shu!2shu!4v1700000000000!5m2!1shu!2shu"
    : "");
  const formSubjects = contactPage?.formSubjects || [];

  const address = globalSettings?.address || "";
  const email = globalSettings?.contactEmail || "hello@works.hu";
  const phone = globalSettings?.contactPhone || (locale === "hu" ? "+36 1 234 5678" : "");
  const openingHours = globalSettings?.openingHours || (locale === "hu" ? [
    { day: "Hétfő – Péntek", hours: "9:00 – 18:00" },
    { day: "Szombat – Vasárnap", hours: "Zárva" },
  ] : []);

  const englishContentUnavailable =
    locale === "en" &&
    !contactLoading &&
    !globalSettingsLoading &&
    (contactError !== null ||
      globalSettingsError !== null ||
      contactPage === null ||
      globalSettings === null);

  if (englishContentUnavailable) {
    return (
      <div className="min-h-screen bg-works-bg flex flex-col">
        <SEOHead />
        <Header />
        <main className="flex-grow flex items-center justify-center px-6 text-center">
          <div className="max-w-lg">
            <h1 className="text-3xl md:text-4xl font-bold text-works-dark mb-4">
              {t("states.errorHeading")}
            </h1>
            <p className="text-works-dark/60 leading-relaxed">
              {t("states.errorBody")}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />

      <main className="flex-grow">
        <section className="relative pt-28 lg:pt-36 pb-32 lg:pb-44 bg-white overflow-hidden">
          {contactGraphic && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="absolute top-[70px] -right-[15%] w-[70vw] h-auto lg:top-auto lg:right-10 lg:bottom-0 lg:w-auto lg:h-[calc(100%-44px)] pointer-events-none select-none z-0"
            >
              <img
                src={contactGraphic}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain opacity-10 lg:opacity-100"
              />
            </motion.div>
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl lg:max-w-lg"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-works-dark mb-6 leading-tight">
                {heroHeading}
              </h1>
              <p className="text-lg lg:text-xl text-works-dark/60 leading-relaxed">
                {heroDescription}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-works-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-20 items-start">
              <motion.div {...fadeUp} className="lg:col-span-3">
                <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-10">
                  {formHeading}
                </h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <ArrowRight className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-works-dark mb-2">
                      {successTitle}
                    </h3>
                    <p className="text-works-dark/60">
                      {successMessage}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-semibold text-works-dark mb-2"
                        >
                          {t("contact.formNameLabel")}
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder={t("contact.formNamePlaceholder")}
                          data-testid="contact-field-name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-works-dark mb-2"
                        >
                          {t("contact.formEmailLabel")}
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder={t("contact.formEmailPlaceholder")}
                          data-testid="contact-field-email"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-works-dark mb-2"
                      >
                        {t("contact.formSubjectLabel")}
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className={inputClass}
                        data-testid="contact-field-subject"
                      >
                        <option value="">{t("contact.formSubjectPlaceholder")}</option>
                        {formSubjects.length > 0
                          ? formSubjects.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))
                          : messages.contact.fallbackSubjects.map((subject) => (
                              <option key={subject.value} value={subject.value}>
                                {subject.label}
                              </option>
                            ))
                        }
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-works-dark mb-2"
                      >
                        {t("contact.formMessageLabel")}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className={`${inputClass} resize-none`}
                        placeholder={t("contact.formMessagePlaceholder")}
                        data-testid="contact-field-message"
                      />
                    </div>

                    {isCareerSubject && (
                      <div>
                        <label className="block text-sm font-semibold text-works-dark mb-2">
                          {t("contact.cvUploadLabel")}
                        </label>
                        <input
                          ref={cvInputRef}
                          type="file"
                          accept={CV_ACCEPT}
                          className="sr-only"
                          id="cv-upload"
                          onChange={(e) => handleCvSelect(e.target.files?.[0] || null)}
                        />
                        {cvFile ? (
                          <div className="flex items-center justify-between gap-3 px-5 py-4 border border-works-primary/40 bg-works-primary/5">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-5 h-5 text-works-primary flex-shrink-0" />
                              <span className="text-sm text-works-dark truncate">{cvFile.name}</span>
                              <span className="text-xs text-works-dark/50 flex-shrink-0">
                                {(cvFile.size / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={clearCv}
                              aria-label={t("contact.cvRemoveLabel")}
                              className="text-works-dark/40 hover:text-works-dark transition-colors flex-shrink-0"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="cv-upload"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleCvSelect(e.dataTransfer.files?.[0] || null);
                            }}
                            className="flex flex-col items-center justify-center gap-2 px-5 py-8 border border-dashed border-works-dark/20 bg-white cursor-pointer hover:border-works-primary/50 transition-colors text-center"
                          >
                            <Upload className="w-6 h-6 text-works-primary" />
                            <span className="text-sm text-works-dark/70">
                              {t("contact.cvUploadDragText")}{" "}
                              <span className="text-works-primary font-semibold">{t("contact.cvUploadBrowse")}</span>
                            </span>
                            <span className="text-xs text-works-dark/40">{t("contact.cvUploadHint")}</span>
                          </label>
                        )}
                        {cvError && (
                          <p className="mt-2 text-sm text-red-600">{cvError}</p>
                        )}
                      </div>
                    )}

                    {consentItems.length > 0 && (
                      <div className="space-y-3">
                        {consentItems.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-start gap-3 cursor-pointer text-sm text-works-dark/80 leading-relaxed"
                          >
                            <input
                              type="checkbox"
                              required
                              checked={consentChecked[item.key]}
                              onChange={(e) =>
                                setConsentChecked((prev) => ({ ...prev, [item.key]: e.target.checked }))
                              }
                              className="mt-1 w-4 h-4 flex-shrink-0 accent-works-primary"
                            />
                            <span className="[&_p]:inline [&_a]:text-works-primary [&_a]:font-semibold [&_a]:underline hover:[&_a]:no-underline">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer">
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {item.text}
                              </ReactMarkdown>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer text-sm text-works-dark/80 leading-relaxed">
                      <input
                        type="checkbox"
                        required
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 flex-shrink-0 accent-works-primary"
                      />
                      <span>
                        {t("contact.privacyConsentText")}{" "}
                        <a
                          href={privacyPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-works-primary font-semibold underline hover:no-underline"
                        >
                          {t("contact.privacyConsentLinkLabel")}
                        </a>
                        .
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!consentsSatisfied || !cvSatisfied || submitting}
                      className="group inline-flex items-center gap-2 bg-works-primary text-white font-semibold px-8 py-4 hover:bg-works-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="contact-submit"
                    >
                      {submitting ? t("contact.submitting") : t("contact.submitButton")}
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </form>
                )}
              </motion.div>

              <motion.div
                {...fadeUp}
                className="lg:col-span-2"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-10">
                  {t("contact.sectionContacts")}
                </h2>

                <div className="space-y-8">
                  {address && <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-works-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-works-primary" />
                    </div>
                    <p className="text-works-dark/60 leading-relaxed">
                      {address}
                    </p>
                  </div>}

                  {phone && <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-works-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-works-primary" />
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="text-works-primary hover:underline"
                    >
                      {email}
                    </a>
                  </div>}

                  <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-works-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-works-primary" />
                    </div>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="text-works-dark/60 hover:text-works-primary transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                {openingHours.length > 0 && <div className="mt-12 p-6 bg-works-light">
                  <h3 className="font-semibold text-works-dark mb-2">{t("contact.openingHoursHeading")}</h3>
                  <div className="text-works-dark/60 text-sm leading-relaxed">
                    {openingHours.map((oh, i) => (
                      <p key={i}>{oh.day}: {oh.hours}</p>
                    ))}
                  </div>
                </div>}
              </motion.div>
            </div>
          </div>
        </section>

        {mapEmbedUrl && <section className="bg-works-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-works-dark mb-10">
                {mapHeading}
              </h2>
            </motion.div>
            <motion.div
              {...fadeUp}
              className="overflow-hidden"
            >
              {consent === "accepted" ? (
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("contact.mapTitle", { address })}
                />
              ) : (
                // Kétkattintásos megoldás: a Google Térkép csak kifejezett
                // hozzájárulás után töltődik be; addig tájékoztató felület látszik.
                <div className="h-[450px] bg-works-dark/5 border border-works-dark/10 flex flex-col items-center justify-center text-center px-6 gap-4">
                  <p className="text-works-dark/60 max-w-md leading-relaxed">
                    {t("contact.mapConsentText")}
                  </p>
                  <button
                    type="button"
                    onClick={accept}
                    className="px-6 py-3 text-sm font-semibold bg-works-primary text-white hover:bg-works-primary/90 transition-colors"
                    data-testid="button-load-map"
                  >
                    {t("contact.mapLoadButton")}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </section>}
      </main>

      <Footer />
    </div>
  );
}
