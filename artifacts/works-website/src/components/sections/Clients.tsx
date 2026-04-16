import { useStrapiQuery } from "@/hooks/useStrapiQuery";
import { getClients } from "@/lib/strapi";
import type { Client } from "@/lib/strapi";
import { fallbackClients } from "@/data/fallback";

const hardcodedClients: Client[] = [
  { name: "Fintech Innovator", initials: "FI", order: 0, featured: false },
  { name: "EcoStart", initials: "ES", order: 1, featured: false },
  { name: "HealthPlus", initials: "H+", order: 2, featured: false },
  { name: "RetailGiant", initials: "RG", order: 3, featured: false },
  { name: "LogisticsPro", initials: "LP", order: 4, featured: false },
  { name: "EduTech Solutions", initials: "ET", order: 5, featured: false },
  { name: "SmartHome Inc.", initials: "SH", order: 6, featured: false },
  { name: "TravelX", initials: "TX", order: 7, featured: false },
  { name: "FoodDelivery App", initials: "FD", order: 8, featured: false },
  { name: "CryptoWallet", initials: "CW", order: 9, featured: false },
];

const clientsFallback = fallbackClients.length > 0 ? fallbackClients : hardcodedClients;

export function Clients() {
  const { data: clients } = useStrapiQuery<Client[]>("clients", getClients, clientsFallback);

  const displayClients = clients || clientsFallback;
  
  return (
    <section className="py-20 bg-white border-y border-works-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
         <h2 className="text-4xl md:text-5xl font-bold text-works-dark tracking-tight">Ügyfeleink</h2>
      </div>
      
      <div className="relative w-full flex overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
        
        <div className="flex w-max animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused]">
          {[...displayClients, ...displayClients, ...displayClients].map((client, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 flex flex-col items-center justify-center w-56 h-24 mx-4 bg-works-bg border border-works-muted/50 hover:border-works-muted hover:shadow-md transition-all duration-300 cursor-default gap-1"
            >
              <span className="text-works-dark/20 font-bold text-2xl tracking-wider">{client.initials}</span>
              <span className="text-works-dark/30 text-xs font-medium">{client.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
