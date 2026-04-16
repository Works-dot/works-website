import React from 'react';
import { ArrowRight, Search, Layout, FileText, CheckCircle, Smartphone, Code, Lightbulb, Play, ArrowUpRight, Mail } from 'lucide-react';

const colors = {
  primary: '#E73352',
  dark: '#3F1C4A',
  light: '#f0edf1',
  accent: '#959EF1',
  bg: '#FAFAFA',
  deepdark: '#2A1232',
  muted: '#C4BFC8',
};

export default function EditorialHomepage() {
  return (
    <div className="min-h-screen font-['Mulish',sans-serif] text-[#3F1C4A] bg-[#FAFAFA] selection:bg-[#E73352] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-sm border-b border-[#3F1C4A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <a href="#" className="text-3xl font-black tracking-tight text-[#E73352]">Works.</a>
          
          <nav className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-[#E73352] transition-colors">Szolgáltatások</a>
            <a href="#" className="hover:text-[#E73352] transition-colors">Projektek</a>
            <a href="#" className="hover:text-[#E73352] transition-colors">Blog</a>
            <a href="#" className="hover:text-[#E73352] transition-colors">Karrier</a>
            <a href="#" className="hover:text-[#E73352] transition-colors">Rólunk</a>
            <a href="#" className="hover:text-[#E73352] transition-colors">Kapcsolat</a>
          </nav>
          
          <button className="md:hidden p-2">
            <div className="w-6 h-0.5 bg-[#3F1C4A] mb-1.5" />
            <div className="w-6 h-0.5 bg-[#3F1C4A]" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-4 max-w-7xl mx-auto pt-24">
        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black leading-[0.9] tracking-tighter mb-8 max-w-5xl">
          Ahol a kutatás<br />
          <span className="text-[#E73352]">designná</span> válik.
        </h1>
        <p className="text-xl md:text-2xl font-light text-[#3F1C4A]/70 max-w-2xl mb-16">
          Adatalapú tervezés és digitális stratégia a jövő piacvezetőinek.
        </p>
        <a 
          href="#" 
          className="group flex items-center gap-4 text-sm font-bold uppercase tracking-widest border-b-2 border-[#3F1C4A] pb-2 hover:border-[#E73352] hover:text-[#E73352] transition-all"
        >
          Kezdjük el a közös munkát
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </a>
      </section>

      {/* Services (Editorial List) */}
      <section className="py-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl font-black tracking-tighter mb-16">Szolgáltatások</h2>
        
        <div className="flex flex-col border-t-2 border-[#3F1C4A]">
          {[
            { icon: Search, title: "UX kutatás", desc: "Mélyfúrás a felhasználói viselkedésbe. Kvalitatív és kvantitatív módszerekkel tárjuk fel az igazi igényeket." },
            { icon: Layout, title: "Service design", desc: "Komplex szolgáltatások tervezése a digitális és fizikai tér metszéspontjában." },
            { icon: Smartphone, title: "UI tervezés", desc: "Gyönyörű, funkcionális és hozzáférhető vizuális felületek, amik konvertálnak." },
            { icon: CheckCircle, title: "Akadálymentességi audit", desc: "WCAG megfelelőség vizsgálata és javítási stratégia készítése minden platformra." },
            { icon: FileText, title: "User research", desc: "Folyamatos felhasználói visszajelzések integrálása a termékfejlesztési ciklusba." },
            { icon: Lightbulb, title: "AI-alapú tervezés", desc: "Mesterséges intelligencia integrálása a tervezési folyamatba és a végtermékbe." },
            { icon: Code, title: "Webfejlesztés", desc: "A tervek milliméterpontos, gyors és skálázható megvalósítása modern technológiákkal." }
          ].map((service, i) => (
            <div key={i} className="group flex flex-col md:flex-row md:items-center gap-6 md:gap-12 py-10 border-b border-[#3F1C4A]/20 hover:border-[#3F1C4A] transition-colors cursor-default">
              <div className="text-[#E73352] shrink-0">
                <service.icon strokeWidth={1.5} className="w-12 h-12" />
              </div>
              <div className="flex-1 md:flex md:items-baseline md:justify-between gap-8">
                <h3 className="text-3xl font-bold tracking-tight mb-2 md:mb-0 w-1/3 group-hover:text-[#E73352] transition-colors">
                  {service.title}
                </h3>
                <p className="text-lg text-[#3F1C4A]/70 w-2/3">
                  {service.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pull Quote */}
      <section className="py-40 bg-[#2A1232] text-white px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-4xl md:text-5xl lg:text-6xl font-light italic leading-tight">
            "A jó design nem dekoráció — <span className="text-[#E73352] font-semibold">üzleti stratégia.</span>"
          </p>
        </div>
      </section>

      {/* Projects (Cinematic Stack) */}
      <section className="bg-[#3F1C4A]">
        {[
          { 
            title: "Banki applikáció újratervezése a jobb konverzióért", 
            category: "Fintech / UX / UI", 
            color: "bg-[#959EF1]" 
          },
          { 
            title: "E-kereskedelmi platform akadálymentesítése", 
            category: "E-commerce / Accessibility", 
            color: "bg-[#E73352]" 
          },
          { 
            title: "Egészségügyi alkalmazás UX kutatása", 
            category: "HealthTech / Research", 
            color: "bg-[#C4BFC8]" 
          }
        ].map((project, i) => (
          <div key={i} className={`h-screen w-full relative ${project.color} flex items-center group overflow-hidden`}>
            {/* Pattern Overlay Placeholder */}
            <div className="absolute inset-0 opacity-10 mix-blend-multiply bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />
            
            <div className="relative z-10 p-8 md:p-16 lg:p-24 w-full h-full flex flex-col justify-end text-white">
              <div className="max-w-4xl transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-lg font-bold uppercase tracking-widest mb-4 opacity-80">{project.category}</p>
                <h3 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-8">
                  {project.title}
                </h3>
                <a href="#" className="inline-flex items-center gap-4 text-xl font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  Esettanulmány megtekintése
                  <ArrowUpRight className="w-8 h-8 bg-white text-black p-1" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Clients (Elegant Text List) */}
      <section className="py-32 px-4 border-b border-[#3F1C4A]/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E73352] mb-12">Akik velünk dolgoztak</p>
          <div className="text-3xl md:text-5xl lg:text-6xl font-light leading-relaxed text-[#3F1C4A]/80">
            <span className="hover:text-[#3F1C4A] transition-colors cursor-pointer">Fintech Innovator</span>
            <span className="mx-4 text-[#E73352] font-black">/</span>
            <span className="hover:text-[#3F1C4A] transition-colors cursor-pointer">EcoStart</span>
            <span className="mx-4 text-[#E73352] font-black">/</span>
            <span className="hover:text-[#3F1C4A] transition-colors cursor-pointer">HealthPlus</span>
            <span className="mx-4 text-[#E73352] font-black">/</span>
            <br className="hidden md:block" />
            <span className="hover:text-[#3F1C4A] transition-colors cursor-pointer">RetailGiant</span>
            <span className="mx-4 text-[#E73352] font-black">/</span>
            <span className="hover:text-[#3F1C4A] transition-colors cursor-pointer">LogisticsPro</span>
            <span className="mx-4 text-[#E73352] font-black">/</span>
            <span className="hover:text-[#3F1C4A] transition-colors cursor-pointer">EduTech Solutions</span>
          </div>
        </div>
      </section>

      {/* Blog (Magazine Style) */}
      <section className="py-32 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-baseline mb-16 border-b-2 border-[#3F1C4A] pb-6">
          <h2 className="text-5xl font-black tracking-tighter">Folyóirat</h2>
          <a href="#" className="text-sm font-bold uppercase tracking-widest hover:text-[#E73352] transition-colors">Összes cikk &rarr;</a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Featured Post */}
          <div className="lg:col-span-2 group cursor-pointer">
            <div className="aspect-[16/9] bg-[#C4BFC8] mb-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[#3F1C4A]/5 group-hover:bg-transparent transition-colors" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#E73352] mb-4">Design Systems • 5 perc</p>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 group-hover:text-[#E73352] transition-colors">
              Az akadálymentes tervezés jövője
            </h3>
            <p className="text-xl text-[#3F1C4A]/70 line-clamp-3">
              Hogyan építsünk olyan digitális termékeket, amelyek mindenki számára hozzáférhetőek? Az inkluzív design nem csak etikai kérdés, hanem komoly üzleti előny is.
            </p>
          </div>

          {/* Sidebar Posts */}
          <div className="flex flex-col gap-12">
            <div className="group cursor-pointer">
              <div className="aspect-[3/2] bg-[#f0edf1] mb-6 relative overflow-hidden" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#E73352] mb-3">Research • 4 perc</p>
              <h3 className="text-2xl font-bold tracking-tight group-hover:text-[#E73352] transition-colors">
                UX kutatási módszerek 2024-ben
              </h3>
            </div>
            
            <div className="h-px bg-[#3F1C4A]/20" />

            <div className="group cursor-pointer">
              <div className="aspect-[3/2] bg-[#959EF1] mb-6 relative overflow-hidden" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#E73352] mb-3">Strategy • 6 perc</p>
              <h3 className="text-2xl font-bold tracking-tight group-hover:text-[#E73352] transition-colors">
                Service design az egészségügyben
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Newsletter */}
      <footer className="bg-[#2A1232] text-white pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
            <div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
                Indítsuk el a projektet.
              </h2>
              <a href="mailto:hello@works.hu" className="text-2xl md:text-4xl font-light hover:text-[#E73352] transition-colors border-b border-transparent hover:border-[#E73352]">
                hello@works.hu
              </a>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-6">Hírlevél</h3>
              <p className="text-white/60 mb-8 text-lg">
                Havi egy levél designról, kutatásról és stratégiáról. Nincs spam.
              </p>
              <form className="flex" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="E-mail címed" 
                  className="bg-transparent border-b-2 border-white/30 text-white placeholder:text-white/30 text-xl py-4 flex-1 focus:outline-none focus:border-white transition-colors"
                />
                <button type="submit" className="border-b-2 border-white/30 py-4 px-6 hover:text-[#E73352] hover:border-[#E73352] transition-colors font-bold uppercase tracking-widest flex items-center gap-2">
                  Feliratkozás <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-t border-white/10 pt-16">
            <div className="text-4xl font-black text-[#E73352]">Works.</div>
            
            <div className="flex flex-col md:flex-row gap-12 md:gap-24 text-white/60">
              <div className="flex flex-col gap-4">
                <p className="font-bold text-white uppercase tracking-widest text-sm mb-2">Iroda</p>
                <p>1051 Budapest<br />Sas utca 14.</p>
              </div>
              <div className="flex flex-col gap-4">
                <p className="font-bold text-white uppercase tracking-widest text-sm mb-2">Közösség</p>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
                <a href="#" className="hover:text-white transition-colors">Behance</a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mt-24 text-sm text-white/40">
            <p>&copy; {new Date().getFullYear()} Works. Design Agency.</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Adatkezelési tájékoztató</a>
              <a href="#" className="hover:text-white transition-colors">Impresszum</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
