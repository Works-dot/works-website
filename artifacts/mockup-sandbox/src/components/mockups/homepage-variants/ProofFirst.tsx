import React from "react";
import { ArrowRight, ChevronRight, Menu, Mail, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function ProofFirst() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#3F1C4A] font-sans" style={{ fontFamily: "Mulish, sans-serif" }}>
      {/* Navigation */}
      <nav className="border-b border-[#E73352]/10 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <a href="#" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-black text-[#E73352] tracking-tighter">Works.</span>
              </a>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors">Szolgáltatások</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors">Projektek</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors">Blog</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors">Karrier</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors">Rólunk</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors">Kapcsolat</a>
              <a href="#" className="bg-[#E73352] text-white px-6 py-3 text-sm font-bold hover:bg-[#3F1C4A] transition-colors">
                Kezdjük el
              </a>
            </div>
            <div className="flex items-center md:hidden">
              <button type="button" className="text-[#3F1C4A] hover:text-[#E73352]">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero: Featured Project */}
      <section className="relative bg-[#2A1232] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-r from-[#2A1232] via-[#2A1232]/90 to-transparent absolute z-10" />
          <div className="w-full h-full bg-[#959EF1] opacity-40 mix-blend-multiply absolute" />
          {/* Placeholder for actual image */}
          <div className="w-full h-full bg-[#E73352] opacity-20" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-24 lg:py-32 flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2 pr-0 lg:pr-12">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-white tracking-tight">
              Eredményeink beszélnek.
            </h1>
            <div className="h-1 w-24 bg-[#E73352] mb-8"></div>
            
            <div className="bg-white/10 p-8 backdrop-blur-sm border border-white/20">
              <div className="text-[#959EF1] font-bold tracking-widest uppercase text-sm mb-3">Kiemelt Projekt</div>
              <h2 className="text-3xl font-bold mb-4">Banki applikáció újratervezése a jobb konverzióért</h2>
              <p className="text-[#f0edf1] mb-8 text-lg leading-relaxed">
                Hogyan alakítottuk át a régió egyik vezető bankjának mobil applikációját, hogy drasztikusan növeljük a felhasználói elégedettséget és az online tranzakciók számát.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-4xl font-black text-[#E73352] mb-1">+32%</div>
                  <div className="text-sm font-bold text-[#C4BFC8] uppercase tracking-wider">Konverzió</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-[#E73352] mb-1">4.8</div>
                  <div className="text-sm font-bold text-[#C4BFC8] uppercase tracking-wider">App Store értékelés</div>
                </div>
              </div>
              
              <a href="#" className="inline-flex items-center text-white font-bold hover:text-[#E73352] transition-colors group text-lg">
                Esettanulmány megtekintése
                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="bg-white py-12 border-b border-[#f0edf1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-bold text-[#C4BFC8] uppercase tracking-widest mb-8">
            Akik már ránk bízták a digitális terméküket
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-black text-[#3F1C4A]">Fintech Innovator</span>
            <span className="text-2xl font-bold italic text-[#3F1C4A]">EcoStart</span>
            <span className="text-2xl font-light tracking-widest text-[#3F1C4A]">HealthPlus</span>
            <span className="text-2xl font-black uppercase text-[#3F1C4A]">RetailGiant</span>
            <span className="text-2xl font-serif text-[#3F1C4A]">LogisticsPro</span>
            <span className="text-xl font-bold text-[#3F1C4A]">EduTech Solutions</span>
          </div>
        </div>
      </section>

      {/* Services (Compact Ribbon) */}
      <section className="py-16 bg-[#FAFAFA] border-b border-[#f0edf1] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-[#3F1C4A]">Miben segítünk?</h2>
              <p className="text-[#C4BFC8] font-bold mt-2">Szakértelmünk a kutatástól a fejlesztésig.</p>
            </div>
            <a href="#" className="hidden md:flex items-center text-[#E73352] font-bold hover:text-[#3F1C4A] transition-colors">
              Minden szolgáltatás
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex space-x-4 px-4 sm:px-6 lg:px-8 pb-4 overflow-x-auto snap-x hide-scrollbar">
            {[
              "UX kutatás", "Service design", "UI tervezés", 
              "Akadálymentességi audit", "User research", 
              "AI-alapú tervezés", "Webfejlesztés"
            ].map((service, index) => (
              <div key={index} className="flex-none w-64 snap-start group cursor-pointer">
                <div className="bg-white p-6 border border-[#f0edf1] hover:border-[#E73352] transition-colors h-full flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-[#3F1C4A] group-hover:text-[#E73352] transition-colors mb-4">{service}</h3>
                  <div className="flex justify-between items-center text-[#C4BFC8] group-hover:text-[#E73352]">
                    <span className="text-xs font-bold uppercase tracking-wider">Részletek</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#3F1C4A]">További munkáink</h2>
            <a href="#" className="hidden md:flex items-center text-[#E73352] font-bold text-lg hover:text-[#3F1C4A] transition-colors group">
              Összes projekt
              <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Project 2 */}
            <div className="group cursor-pointer">
              <div className="w-full aspect-[4/3] bg-[#959EF1] mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#3F1C4A] opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10" />
                <div className="absolute bottom-0 left-0 bg-[#E73352] text-white font-bold px-4 py-2 text-sm z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  E-kereskedelem
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#3F1C4A] mb-3 group-hover:text-[#E73352] transition-colors">
                E-kereskedelmi platform akadálymentesítése
              </h3>
              <p className="text-[#6b7280] mb-4">
                Hogyan tettük elérhetővé a vásárlást mindenki számára, miközben az átlagos kosárértéket is növeltük.
              </p>
              <div className="flex items-center space-x-6 mb-6">
                <div>
                  <div className="text-2xl font-black text-[#3F1C4A]">100%</div>
                  <div className="text-xs font-bold text-[#C4BFC8] uppercase tracking-wider">WCAG megfelelés</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#3F1C4A]">+15%</div>
                  <div className="text-xs font-bold text-[#C4BFC8] uppercase tracking-wider">Bevétel növekedés</div>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="group cursor-pointer md:mt-24">
              <div className="w-full aspect-[4/3] bg-[#C4BFC8] mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#3F1C4A] opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10" />
                <div className="absolute bottom-0 left-0 bg-[#E73352] text-white font-bold px-4 py-2 text-sm z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  Egészségügy
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#3F1C4A] mb-3 group-hover:text-[#E73352] transition-colors">
                Egészségügyi alkalmazás UX kutatása
              </h3>
              <p className="text-[#6b7280] mb-4">
                Komplex orvosi adatok vizualizációja és a beteg-orvos kommunikáció egyszerűsítése egy modern felületen.
              </p>
              <div className="flex items-center space-x-6 mb-6">
                <div>
                  <div className="text-2xl font-black text-[#3F1C4A]">45h</div>
                  <div className="text-xs font-bold text-[#C4BFC8] uppercase tracking-wider">Kutatási idő</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#3F1C4A]">-40%</div>
                  <div className="text-xs font-bold text-[#C4BFC8] uppercase tracking-wider">Adminisztrációs idő</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center md:hidden">
            <a href="#" className="inline-flex items-center justify-center w-full bg-[#FAFAFA] text-[#3F1C4A] font-bold py-4 border border-[#f0edf1] hover:border-[#E73352] hover:text-[#E73352] transition-colors">
              Összes projekt megtekintése
            </a>
          </div>
        </div>
      </section>

      {/* Minimal Blog Section */}
      <section className="py-24 bg-[#f0edf1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-12">
            <h2 className="text-3xl font-black text-[#3F1C4A]">Gondolataink</h2>
            <div className="flex-grow h-px bg-[#C4BFC8]/50"></div>
            <a href="#" className="text-[#E73352] font-bold text-sm uppercase tracking-widest hover:text-[#3F1C4A] transition-colors">
              Blog archívum
            </a>
          </div>

          <div className="space-y-0 divide-y divide-[#C4BFC8]/30">
            <a href="#" className="block py-6 group">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-xl md:text-2xl font-bold text-[#3F1C4A] group-hover:text-[#E73352] transition-colors mb-2 md:mb-0">
                  Az akadálymentes tervezés jövője
                </h3>
                <span className="text-[#C4BFC8] font-bold text-sm tracking-widest uppercase">2024. Május 12.</span>
              </div>
            </a>
            <a href="#" className="block py-6 group">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-xl md:text-2xl font-bold text-[#3F1C4A] group-hover:text-[#E73352] transition-colors mb-2 md:mb-0">
                  UX kutatási módszerek 2024-ben
                </h3>
                <span className="text-[#C4BFC8] font-bold text-sm tracking-widest uppercase">2024. Április 28.</span>
              </div>
            </a>
            <a href="#" className="block py-6 group">
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
                <h3 className="text-xl md:text-2xl font-bold text-[#3F1C4A] group-hover:text-[#E73352] transition-colors mb-2 md:mb-0">
                  Service design az egészségügyben
                </h3>
                <span className="text-[#C4BFC8] font-bold text-sm tracking-widest uppercase">2024. Április 15.</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA / Newsletter */}
      <section className="bg-[#2A1232] text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#E73352] opacity-10 transform skew-x-12 translate-x-32"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
            Kezdjünk el<br />együtt dolgozni
          </h2>
          <p className="text-xl text-[#f0edf1] mb-12 max-w-2xl mx-auto font-light">
            Legyen szó egy új digitális termék tervezéséről vagy egy meglévő optimalizálásáról, 
            csapatunk készen áll a kihívásra.
          </p>
          
          <form className="flex flex-col sm:flex-row max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Az Ön email címe" 
              className="flex-grow px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#E73352] focus:bg-white/20 transition-all font-bold"
              required
            />
            <button 
              type="submit" 
              className="mt-4 sm:mt-0 px-8 py-4 bg-[#E73352] text-white font-black uppercase tracking-widest hover:bg-white hover:text-[#E73352] transition-colors whitespace-nowrap"
            >
              Érdekel
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a0b1f] text-[#f0edf1] py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <span className="text-3xl font-black text-[#E73352] tracking-tighter mb-6 block">Works.</span>
              <p className="text-[#C4BFC8] text-sm leading-relaxed mb-6">
                Digitális design ügynökség, amely üzleti eredményeket szállít kimagasló felhasználói élményen keresztül.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors"><Linkedin className="h-5 w-5" /></a>
                <a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors"><Instagram className="h-5 w-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Szolgáltatások</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">UX kutatás</a></li>
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">UI tervezés</a></li>
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Service design</a></li>
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Webfejlesztés</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Ügynökség</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Rólunk</a></li>
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Projektek</a></li>
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Karrier</a></li>
                <li><a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Kapcsolat</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Mail className="h-5 w-5 text-[#E73352] mr-3 mt-0.5" />
                  <span className="text-[#C4BFC8] text-sm font-bold">hello@works.hu</span>
                </li>
                <li className="text-[#C4BFC8] text-sm font-bold">
                  1052 Budapest,<br />Deák Ferenc tér 3.
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#C4BFC8] text-sm font-bold mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Works. Minden jog fenntartva.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Adatkezelési tájékoztató</a>
              <a href="#" className="text-[#C4BFC8] hover:text-[#E73352] transition-colors text-sm font-bold">Impresszum</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
