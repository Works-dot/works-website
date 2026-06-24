import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getContactPage, getGlobalSettings } from "@/lib/strapi";
import type { ContactPageData, GlobalSettings } from "@/lib/strapi";
import { fallbackContactPage, fallbackGlobalSettings, contactGraphicFallbackImg } from "@/data/fallback";

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

function googleQueryEmbed(q: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

function toMapEmbedUrl(raw: string): string {
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
    return `https://maps.google.com/maps?q=${lat},${lng}${z}&output=embed`;
  }

  // Sima koordináták: "47.5045,19.0514".
  if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(candidate)) {
    return googleQueryEmbed(candidate.replace(/\s+/g, ""));
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(candidate);
  } catch {
    parsed = null;
  }

  // Nem URL (sima cím) — keresésként ágyazzuk be.
  if (!parsed) return googleQueryEmbed(candidate);

  // Csak https + Google Maps domain engedélyezett iframe-ben; minden más tiltott.
  if (parsed.protocol !== "https:" || !isGoogleMapsHost(parsed.hostname)) {
    return "";
  }

  // Már beágyazható Google link.
  if (
    parsed.pathname.includes("/maps/embed") ||
    parsed.searchParams.get("output") === "embed"
  ) {
    return candidate;
  }

  // Kifejezett q= paraméter (pl. ?q=Szabadság+tér).
  const q = parsed.searchParams.get("q");
  if (q) return googleQueryEmbed(q);

  // /place/<név>/ szakasz a path-ban.
  const place = parsed.pathname.match(/\/place\/([^/@]+)/);
  if (place) {
    const name = decodeURIComponent(place[1].replace(/\+/g, " "));
    return googleQueryEmbed(name);
  }

  // Google host, de ismeretlen forma — biztonságos próba output=embed-del.
  const sep = candidate.includes("?") ? "&" : "?";
  return `${candidate}${sep}output=embed`;
}

export default function Contact() {
  const { data: contactPage } = useStrapiQuery<ContactPageData>("contactPage", getContactPage, fallbackContactPage);
  const { data: globalSettings } = useStrapiQuery<GlobalSettings>("globalSettings", getGlobalSettings, fallbackGlobalSettings);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactGraphic = contactGraphicFallbackImg;
  const heroHeading = contactPage?.hero?.heading || "Kapcsolat.";
  const heroDescription = contactPage?.hero?.description || "Beszéljünk a következő projektedről!";
  const formHeading = contactPage?.formHeading || "Írj nekünk";
  const successTitle = contactPage?.successTitle || "Üzenet elküldve!";
  const successMessage = contactPage?.successMessage || "Köszönjük megkeresésed, hamarosan válaszolunk.";
  const mapHeading = contactPage?.mapHeading || "Itt találsz minket";
  const mapEmbedUrl = toMapEmbedUrl(contactPage?.mapEmbedUrl || "") || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.4!2d19.0514!3d47.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dc14ca087e31%3A0x6a06c4f9e5a2e0!2sSzabads%C3%A1g%20t%C3%A9r%2C%20Budapest%2C%201054!5e0!3m2!1shu!2shu!4v1700000000000!5m2!1shu!2shu";
  const formSubjects = contactPage?.formSubjects || [];

  const address = globalSettings?.address || "1054 Budapest, Szabadság tér 7.";
  const email = globalSettings?.contactEmail || "hello@works.hu";
  const phone = globalSettings?.contactPhone || "+36 1 234 5678";
  const openingHours = globalSettings?.openingHours || [
    { day: "Hétfő – Péntek", hours: "9:00 – 18:00" },
    { day: "Szombat – Vasárnap", hours: "Zárva" },
  ];

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
                          Név
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Teljes neved"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-works-dark mb-2"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="email@cimed.hu"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-semibold text-works-dark mb-2"
                      >
                        Tárgy
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Válassz témát...</option>
                        {formSubjects.length > 0
                          ? formSubjects.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))
                          : <>
                              <option value="ux-research">UX kutatás</option>
                              <option value="ui-design">UI Design</option>
                              <option value="service-design">Service Design</option>
                              <option value="web-development">Webfejlesztés</option>
                              <option value="accessibility">Akadálymentesítés</option>
                              <option value="ai-design">AI-alapú design</option>
                              <option value="other">Egyéb</option>
                            </>
                        }
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-works-dark mb-2"
                      >
                        Üzenet
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className={`${inputClass} resize-none`}
                        placeholder="Mesélj a projektedről..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="group inline-flex items-center gap-2 bg-works-primary text-white font-semibold px-8 py-4 hover:bg-works-primary/90 transition-colors"
                    >
                      Üzenet küldése
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
                  Elérhetőségeink
                </h2>

                <div className="space-y-8">
                  <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-works-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-works-primary" />
                    </div>
                    <p className="text-works-dark/60 leading-relaxed">
                      {address}
                    </p>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-works-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-works-primary" />
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="text-works-primary hover:underline"
                    >
                      {email}
                    </a>
                  </div>

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

                <div className="mt-12 p-6 bg-works-light">
                  <h3 className="font-semibold text-works-dark mb-2">Nyitvatartás</h3>
                  <div className="text-works-dark/60 text-sm leading-relaxed">
                    {openingHours.map((oh, i) => (
                      <p key={i}>{oh.day}: {oh.hours}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="bg-works-light">
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
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Works. iroda - ${address}`}
              />
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
