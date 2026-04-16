import { Search } from "lucide-react";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getHomepage, getServices } from "@/lib/strapi";
import type { HomepageData, Service } from "@/lib/strapi";
import { fallbackServices, fallbackHomepage, bgGraphic1FallbackImg } from "@/data/fallback";

export function Services() {
  const { data: homepage } = useStrapiQuery<HomepageData>("homepage", getHomepage, fallbackHomepage);
  const { data: services } = useStrapiQuery<Service[]>("services", getServices, fallbackServices);
  const section = homepage?.servicesSection;

  const heading = section?.heading || "Miben tudunk segíteni?";
  const bgGraphic = bgGraphic1FallbackImg;

  const serviceCards = services && services.length > 0
    ? services.map((s) => ({
        iconSrc: s.icon,
        title: s.title,
        desc: s.heroDescription,
      }))
    : [];

  return (
    <section id="services" className="py-24 lg:py-32 bg-works-light relative overflow-hidden">
      {bgGraphic && (
        <img
          src={bgGraphic}
          alt=""
          aria-hidden="true"
          className="absolute -bottom-32 -left-40 w-[500px] md:w-[650px] lg:w-[800px] opacity-30 pointer-events-none select-none z-0"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="mb-16 md:mb-24 flex flex-col max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight">
            {heading}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {serviceCards.map((s, i) => (
            <ServiceCard 
              key={i} 
              iconSrc={s.iconSrc}
              title={s.title} 
              description={s.desc} 
              index={i} 
            />
          ))}
          
          <div className="bg-works-primary p-8 flex flex-col justify-center items-start text-left text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <h3 className="text-2xl font-bold mb-4 relative z-10">Nem találod amit keresel?</h3>
            <p className="text-white/90 mb-8 relative z-10">Vedd fel velünk a kapcsolatot egyedi igényeiddel kapcsolatban.</p>
            <a href="/kapcsolat" className="px-6 py-3 border border-white text-white font-semibold hover:bg-white hover:text-works-primary transition-colors relative z-10">
              Kapcsolatfelvétel
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
