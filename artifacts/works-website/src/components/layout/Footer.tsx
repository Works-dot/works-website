import { useState } from "react";
import { Link } from "wouter";
import { Linkedin, Instagram, Dribbble, ArrowRight } from "lucide-react";
import { useSubscribeNewsletter } from "@/hooks/use-newsletter";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getGlobalSettings, getServices } from "@/lib/strapi";
import type { GlobalSettings, Service } from "@/lib/strapi";
import { fallbackGlobalSettings, fallbackServices } from "@/data/fallback";

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  dribbble: <Dribbble className="w-5 h-5" />,
  behance: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.443 5.35c.639 0 1.23.05 1.77.198a3.83 3.83 0 0 1 1.377.544c.394.247.689.594.886 1.04.197.445.296.99.296 1.583 0 .693-.148 1.286-.445 1.732-.296.445-.742.792-1.336 1.04.791.198 1.385.593 1.78 1.188.395.594.593 1.336.593 2.178 0 .643-.148 1.237-.395 1.682a3.35 3.35 0 0 1-1.04 1.188c-.445.296-.94.544-1.533.643A7.82 7.82 0 0 1 7.59 18.7H1V5.35h6.443zm-.394 5.54c.544 0 .99-.148 1.336-.395.346-.247.494-.692.494-1.286 0-.346-.05-.643-.197-.84a1.17 1.17 0 0 0-.494-.494 1.93 1.93 0 0 0-.692-.247 4.15 4.15 0 0 0-.791-.05H4.17v3.312h2.879zm.197 5.838c.297 0 .594-.05.84-.099a2.03 2.03 0 0 0 .693-.296c.197-.148.346-.346.445-.594.099-.247.198-.544.198-.94 0-.742-.198-1.287-.593-1.583-.395-.297-.94-.445-1.583-.445H4.17v3.957h3.076zM15.3 14.04c.346.395.84.593 1.484.593.445 0 .84-.099 1.138-.346.297-.198.494-.395.593-.593h2.573c-.395 1.188-.94 2.03-1.682 2.524-.742.445-1.632.692-2.721.692-.742 0-1.434-.099-2.03-.346a4.42 4.42 0 0 1-1.534-1.04c-.444-.445-.79-.94-1.04-1.583-.247-.594-.346-1.286-.346-2.03 0-.742.099-1.385.346-2.029.247-.593.593-1.138 1.04-1.583a4.42 4.42 0 0 1 1.534-1.04c.593-.247 1.287-.395 2.029-.395.84 0 1.534.148 2.128.494.594.346 1.04.792 1.435 1.385.395.594.642 1.237.84 1.98.098.742.148 1.484.049 2.326h-7.612c.049.791.395 1.385.791 1.78l-.034.01zM17.68 10.63c-.296-.346-.791-.544-1.385-.544-.395 0-.692.05-.94.198-.247.099-.445.247-.593.445-.148.148-.247.346-.297.544-.049.148-.098.297-.098.445h4.216c-.099-.494-.346-.94-.89-1.088h-.013zM14.58 6.28h4.81v1.287h-4.81V6.28z" /></svg>
  ),
};

export function Footer() {
  const [email, setEmail] = useState("");
  const { mutate, isPending } = useSubscribeNewsletter();
  const { data: settings } = useStrapiQuery<GlobalSettings>("globalSettings", getGlobalSettings, fallbackGlobalSettings);
  const { data: services } = useStrapiQuery<Service[]>("footerServices", getServices, fallbackServices);
  const logoImg = settings?.logoUrl;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutate(email, {
      onSuccess: () => setEmail("")
    });
  };

  const newsletterHeading = settings?.newsletterHeading || "Iratkozz fel hírlevelünkre";
  const newsletterDescription = settings?.newsletterDescription || "Heti inspiráció, UX trendek és szakmai tartalmak egyenesen a postaládádba.";
  const footerTagline = settings?.footerTagline || "Digitális élményeket tervezünk és építünk modern vállalatok számára.";
  const contactEmail = settings?.contactEmail || "hello@works.hu";
  const address = settings?.address || "1054 Budapest, Szabadság tér 7.";
  const copyrightText = settings?.copyrightText || `${new Date().getFullYear()} Works. Minden jog fenntartva.`;
  const socialLinks = settings?.socialLinks || [];
  const footerServices = (services || []).slice(0, 4);

  return (
    <footer className="w-full relative z-10">
      <div className="bg-works-dark text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
          <div className="lg:flex-1">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">{newsletterHeading}</h2>
            <p className="text-works-light/80 text-lg">
              {newsletterDescription}
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg lg:max-w-none lg:flex-1">
            <label htmlFor="newsletter-email" className="sr-only">E-mail címed</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail címed"
              className="flex-1 px-5 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-works-primary focus:border-transparent transition-all"
              required
            />
            <button
              type="submit"
              disabled={isPending}
              className="group px-8 py-4 border border-white text-white font-semibold hover:bg-white hover:text-works-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isPending ? "Küldés..." : "Feliratkozás"}
              {!isPending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-works-deepdark pt-20 pb-10 px-4 sm:px-6 lg:px-8 text-works-muted">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            {logoImg ? (
              <img src={logoImg} alt="Works. Logo" className="h-8 w-auto object-contain brightness-0 invert mb-6" />
            ) : (
              <span className="text-xl font-bold text-white mb-6 block">Works.</span>
            )}
            <p className="text-works-muted/80 leading-relaxed mb-8 whitespace-pre-line">
              {footerTagline}
            </p>
            <div className="flex gap-4">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const key = link.platform.toLowerCase();
                  return (
                    <a
                      key={key}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-works-primary hover:text-white transition-colors duration-300"
                    >
                      {SOCIAL_ICONS[key] || <span className="text-xs font-bold">{link.platform.slice(0, 2).toUpperCase()}</span>}
                    </a>
                  );
                })
              ) : (
                <>
                  <a href="#" aria-label="LinkedIn" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-works-primary hover:text-white transition-colors duration-300">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" aria-label="Instagram" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-works-primary hover:text-white transition-colors duration-300">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" aria-label="Dribbble" className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-works-primary hover:text-white transition-colors duration-300">
                    <Dribbble className="w-5 h-5" />
                  </a>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Szolgáltatások</h4>
            <ul className="space-y-4">
              {footerServices.length > 0 ? (
                footerServices.map((svc) => (
                  <li key={svc.slug}>
                    <Link href={`/szolgaltatasok/${svc.slug}`} className="hover:text-works-primary transition-colors">
                      {svc.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><a href="#services" className="hover:text-works-primary transition-colors">UX Kutatás</a></li>
                  <li><a href="#services" className="hover:text-works-primary transition-colors">UI Tervezés</a></li>
                  <li><a href="#services" className="hover:text-works-primary transition-colors">Service Design</a></li>
                  <li><a href="#services" className="hover:text-works-primary transition-colors">Webfejlesztés</a></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Cég</h4>
            <ul className="space-y-4">
              <li><Link href="/rolunk" className="hover:text-works-primary transition-colors">Rólunk</Link></li>
              <li><Link href="/karrier" className="hover:text-works-primary transition-colors">Karrier</Link></li>
              <li><Link href="/blog" className="hover:text-works-primary transition-colors">Blog</Link></li>
              <li><Link href="/projektek" className="hover:text-works-primary transition-colors">Esettanulmányok</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Kapcsolat</h4>
            <ul className="space-y-4">
              <li className="flex flex-col">
                <span className="text-sm text-works-muted/60 mb-1">Cím</span>
                <span className="text-works-muted">{address}</span>
              </li>
              <li className="flex flex-col">
                <span className="text-sm text-works-muted/60 mb-1">Email</span>
                <a href={`mailto:${contactEmail}`} className="text-works-primary font-semibold hover:underline">{contactEmail}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-works-muted/60">
          <p>&copy; {copyrightText}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Adatvédelmi tájékoztató</a>
            <a href="#" className="hover:text-white transition-colors">Impresszum</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
