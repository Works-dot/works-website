import React from 'react';
import { ArrowRight, Search, Palette, Code, Users, CheckCircle, Smartphone, Layout, Send } from 'lucide-react';

export default function BentoGridHomepage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-['Mulish',sans-serif] text-[#2A1232]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-sm border-b border-[#C4BFC8]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0">
              <a href="#" className="text-3xl font-black tracking-tighter text-[#E73352]">
                Works.
              </a>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors uppercase tracking-wider">Szolgáltatások</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors uppercase tracking-wider">Projektek</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors uppercase tracking-wider">Blog</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors uppercase tracking-wider">Karrier</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors uppercase tracking-wider">Rólunk</a>
              <a href="#" className="text-sm font-bold text-[#3F1C4A] hover:text-[#E73352] transition-colors uppercase tracking-wider">Kapcsolat</a>
            </nav>
            <div className="hidden md:flex">
              <a href="#" className="bg-[#3F1C4A] text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#E73352] transition-colors">
                Kezdjük el
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-black text-[#2A1232] leading-[1.1] mb-6 tracking-tight">
                Tervezünk.<br />
                <span className="text-[#E73352]">Kutatunk.</span><br />
                Építünk.
              </h1>
              <p className="text-xl text-[#3F1C4A] mb-8 max-w-lg leading-relaxed">
                Adatvezérelt digitális élményeket hozunk létre, amelyek valódi üzleti eredményeket szállítanak. Kompromisszumok nélkül.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#" className="inline-flex justify-center items-center bg-[#E73352] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#3F1C4A] transition-colors">
                  Projekt indítása <ArrowRight className="ml-2 w-4 h-4" />
                </a>
                <a href="#" className="inline-flex justify-center items-center bg-white border-2 border-[#3F1C4A] text-[#3F1C4A] px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#f0edf1] transition-colors">
                  Munkáink
                </a>
              </div>
            </div>
            
            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-8 border border-[#C4BFC8]/30 flex flex-col justify-center items-center text-center group hover:border-[#E73352] transition-colors">
                <span className="text-5xl font-black text-[#3F1C4A] group-hover:text-[#E73352] transition-colors mb-2">120+</span>
                <span className="text-sm font-bold uppercase tracking-widest text-[#959EF1]">Projekt</span>
              </div>
              <div className="bg-[#3F1C4A] p-8 flex flex-col justify-center items-center text-center">
                <span className="text-5xl font-black text-white mb-2">45+</span>
                <span className="text-sm font-bold uppercase tracking-widest text-[#959EF1]">Ügyfél</span>
              </div>
              <div className="bg-[#E73352] p-8 flex flex-col justify-center items-center text-center">
                <span className="text-5xl font-black text-white mb-2">8</span>
                <span className="text-sm font-bold uppercase tracking-widest text-[#f0edf1]">Év tapasztalat</span>
              </div>
              <div className="bg-white p-8 border border-[#C4BFC8]/30 flex flex-col justify-center items-center text-center group hover:border-[#959EF1] transition-colors">
                <span className="text-5xl font-black text-[#3F1C4A] group-hover:text-[#959EF1] transition-colors mb-2">15</span>
                <span className="text-sm font-bold uppercase tracking-widest text-[#E73352]">Szakértő</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Bento Grid */}
      <section className="py-24 bg-white border-y border-[#C4BFC8]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:flex md:justify-between md:items-end">
            <div>
              <h2 className="text-4xl font-black text-[#2A1232] mb-4">Szolgáltatásaink</h2>
              <p className="text-lg text-[#3F1C4A] max-w-2xl">Minden, amire egy modern digitális terméknek szüksége van, egyetlen fókuszált csapatból.</p>
            </div>
            <a href="#" className="hidden md:inline-flex items-center text-[#E73352] font-bold uppercase tracking-wider hover:text-[#3F1C4A] transition-colors mt-4 md:mt-0">
              Összes szolgáltatás <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* UX Kutatás (Spans 2 cols) */}
            <div className="md:col-span-2 bg-[#E73352] p-8 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Search className="w-48 h-48" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between min-h-[240px]">
                <Search className="w-10 h-10 mb-8 text-[#f0edf1]" />
                <div>
                  <h3 className="text-3xl font-black mb-3">UX kutatás</h3>
                  <p className="text-[#f0edf1] text-lg max-w-md">Mélyreható felhasználói kutatások a valódi problémák és igények feltárására.</p>
                </div>
              </div>
            </div>

            {/* UI Tervezés (Spans 2 cols) */}
            <div className="md:col-span-2 bg-[#3F1C4A] p-8 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Palette className="w-48 h-48" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between min-h-[240px]">
                <Palette className="w-10 h-10 mb-8 text-[#959EF1]" />
                <div>
                  <h3 className="text-3xl font-black mb-3">UI tervezés</h3>
                  <p className="text-[#f0edf1] text-lg max-w-md">Vizuálisan lenyűgöző és funkcionális felületek, amelyek vezetik a tekintetet.</p>
                </div>
              </div>
            </div>

            {/* Service design */}
            <div className="bg-white p-8 border border-[#C4BFC8]/30 hover:border-[#E73352] transition-colors group min-h-[240px] flex flex-col justify-between">
              <Users className="w-8 h-8 text-[#959EF1] mb-6 group-hover:text-[#E73352] transition-colors" />
              <div>
                <h3 className="text-xl font-bold text-[#2A1232] mb-2">Service design</h3>
                <p className="text-[#3F1C4A] text-sm">A teljes szolgáltatási élmény megtervezése végponttól végpontig.</p>
              </div>
            </div>

            {/* Akadálymentességi audit */}
            <div className="bg-[#959EF1] p-8 text-[#2A1232] min-h-[240px] flex flex-col justify-between hover:bg-[#E73352] hover:text-white transition-colors group">
              <CheckCircle className="w-8 h-8 mb-6 text-white" />
              <div>
                <h3 className="text-xl font-bold mb-2">Akadálymentesítési audit</h3>
                <p className="text-sm opacity-90">WCAG irányelveknek megfelelő, mindenki számára hozzáférhető termékek.</p>
              </div>
            </div>

            {/* User research */}
            <div className="bg-[#f0edf1] p-8 text-[#2A1232] min-h-[240px] flex flex-col justify-between hover:bg-[#C4BFC8] transition-colors">
              <Smartphone className="w-8 h-8 mb-6 text-[#E73352]" />
              <div>
                <h3 className="text-xl font-bold mb-2">User research</h3>
                <p className="text-sm opacity-80">Folyamatos tesztelés és validálás a fejlesztési ciklus során.</p>
              </div>
            </div>

            {/* Webfejlesztés */}
            <div className="bg-[#2A1232] p-8 text-white min-h-[240px] flex flex-col justify-between">
              <Code className="w-8 h-8 mb-6 text-[#959EF1]" />
              <div>
                <h3 className="text-xl font-bold mb-2">Webfejlesztés</h3>
                <p className="text-sm text-[#C4BFC8]">Pixel-perfekt, gyors és skálázható frontend és backend megoldások.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Mosaic */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl font-black text-[#2A1232] mb-4">Kiemelt Projektek</h2>
            <p className="text-lg text-[#3F1C4A]">Eredmények, amelyekre büszkék vagyunk.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Large Project */}
            <a href="#" className="lg:col-span-2 lg:row-span-2 group block">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[600px] bg-[#3F1C4A] overflow-hidden mb-4 border border-[#C4BFC8]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1232] to-transparent opacity-60 z-10"></div>
                {/* Abstract graphic placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 bg-[#E73352]/20 blur-3xl rounded-full"></div>
                  <div className="w-48 h-48 bg-[#959EF1]/30 blur-2xl rounded-full -ml-20 mt-20"></div>
                </div>
                <div className="absolute bottom-0 left-0 p-8 z-20 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <div className="flex gap-2 mb-3">
                    <span className="bg-[#E73352] text-white text-xs font-bold px-2 py-1 uppercase tracking-wider">UX/UI</span>
                    <span className="bg-white text-[#2A1232] text-xs font-bold px-2 py-1 uppercase tracking-wider">Pénzügy</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 group-hover:text-[#959EF1] transition-colors">Banki applikáció újratervezése a jobb konverzióért</h3>
                </div>
              </div>
            </a>

            {/* Small Project 1 */}
            <a href="#" className="group block">
              <div className="relative aspect-video lg:aspect-[4/3] lg:h-[288px] bg-[#959EF1] overflow-hidden mb-4 border border-[#C4BFC8]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1232]/80 to-transparent opacity-80 z-10"></div>
                <div className="absolute bottom-0 left-0 p-6 z-20 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <div className="flex gap-2 mb-2">
                    <span className="bg-[#2A1232] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Audit</span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">E-kereskedelmi platform akadálymentesítése</h3>
                </div>
              </div>
            </a>

            {/* Small Project 2 */}
            <a href="#" className="group block">
              <div className="relative aspect-video lg:aspect-[4/3] lg:h-[288px] bg-[#E73352] overflow-hidden mb-4 border border-[#C4BFC8]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A1232]/80 to-transparent opacity-80 z-10"></div>
                <div className="absolute bottom-0 left-0 p-6 z-20 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <div className="flex gap-2 mb-2">
                    <span className="bg-white text-[#E73352] text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Kutatás</span>
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight">Egészségügyi alkalmazás UX kutatása</h3>
                </div>
              </div>
            </a>
          </div>
          
          <div className="mt-12 text-center">
            <a href="#" className="inline-flex justify-center items-center bg-white border-2 border-[#3F1C4A] text-[#3F1C4A] px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#3F1C4A] hover:text-white transition-colors">
              Összes projekt megtekintése
            </a>
          </div>
        </div>
      </section>

      {/* Clients + Stats Band */}
      <section className="bg-[#2A1232] border-y border-[#3F1C4A] overflow-hidden">
        <div className="flex items-center whitespace-nowrap py-6">
          <div className="flex animate-[marquee_20s_linear_infinite] items-center space-x-12 px-6">
            <span className="text-2xl font-black text-[#959EF1] opacity-70">Fintech Innovator</span>
            <span className="text-2xl font-black text-[#E73352] opacity-70">EcoStart</span>
            <span className="text-2xl font-black text-[#f0edf1] opacity-70">HealthPlus</span>
            <span className="text-2xl font-black text-[#959EF1] opacity-70">RetailGiant</span>
            <span className="text-2xl font-black text-[#E73352] opacity-70">LogisticsPro</span>
            <span className="text-2xl font-black text-[#f0edf1] opacity-70">EduTech Solutions</span>
            {/* Repeat for continuous effect */}
            <span className="text-2xl font-black text-[#959EF1] opacity-70">Fintech Innovator</span>
            <span className="text-2xl font-black text-[#E73352] opacity-70">EcoStart</span>
            <span className="text-2xl font-black text-[#f0edf1] opacity-70">HealthPlus</span>
          </div>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      {/* Blog Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:flex md:justify-between md:items-end">
            <div>
              <h2 className="text-4xl font-black text-[#2A1232] mb-4">Gondolatok</h2>
              <p className="text-lg text-[#3F1C4A]">Tudásmegosztás és szakmai cikkek a csapatunktól.</p>
            </div>
            <a href="#" className="hidden md:inline-flex items-center text-[#E73352] font-bold uppercase tracking-wider hover:text-[#3F1C4A] transition-colors mt-4 md:mt-0">
              Ugrás a blogra <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Featured Post */}
            <a href="#" className="md:col-span-2 bg-[#f0edf1] border border-[#C4BFC8]/30 p-8 lg:p-12 group hover:border-[#E73352] transition-colors flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex gap-2 mb-6">
                  <span className="bg-[#E73352] text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">Tervezés</span>
                  <span className="text-[#3F1C4A] text-xs font-bold py-1.5">2024. Március 12.</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-black text-[#2A1232] mb-4 group-hover:text-[#E73352] transition-colors">Az akadálymentes tervezés jövője</h3>
                <p className="text-lg text-[#3F1C4A] max-w-xl line-clamp-3">Az akadálymentesség már nem csupán egy pipa a követelmény listán, hanem az inkluzív digitális termékek alapja. Hogyan tervezzünk mindenkinek 2024-ben?</p>
              </div>
              <div className="mt-8 flex items-center text-[#E73352] font-bold uppercase tracking-wider">
                Elolvasom <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
              </div>
            </a>

            <div className="flex flex-col gap-6">
              {/* Post 2 */}
              <a href="#" className="flex-1 bg-white border border-[#C4BFC8]/50 p-6 group hover:border-[#959EF1] transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 mb-4">
                    <span className="text-[#E73352] text-[10px] font-bold uppercase tracking-wider">Kutatás</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2A1232] mb-2 group-hover:text-[#959EF1] transition-colors leading-tight">UX kutatási módszerek 2024-ben</h3>
                </div>
                <div className="mt-4 flex items-center text-[#3F1C4A] text-xs font-bold uppercase tracking-wider group-hover:text-[#959EF1]">
                  Elolvasom <ArrowRight className="ml-2 w-3 h-3" />
                </div>
              </a>

              {/* Post 3 */}
              <a href="#" className="flex-1 bg-white border border-[#C4BFC8]/50 p-6 group hover:border-[#959EF1] transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 mb-4">
                    <span className="text-[#E73352] text-[10px] font-bold uppercase tracking-wider">Esettanulmány</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2A1232] mb-2 group-hover:text-[#959EF1] transition-colors leading-tight">Service design az egészségügyben</h3>
                </div>
                <div className="mt-4 flex items-center text-[#3F1C4A] text-xs font-bold uppercase tracking-wider group-hover:text-[#959EF1]">
                  Elolvasom <ArrowRight className="ml-2 w-3 h-3" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#E73352] py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#3F1C4A] rounded-full blur-[100px] opacity-20 -mr-40 -mt-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Készen áll a közös munkára?</h2>
              <p className="text-xl text-[#f0edf1] max-w-xl">Beszéljük meg, hogyan tudnánk segíteni vállalkozása digitális transzformációjában.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <a href="#" className="inline-flex justify-center items-center bg-[#2A1232] text-white px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-[#2A1232] transition-colors">
                Kapcsolatfelvétel <Send className="ml-2 w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2A1232] pt-20 pb-10 border-t border-[#3F1C4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <a href="#" className="text-3xl font-black tracking-tighter text-[#E73352] mb-6 inline-block">
                Works.
              </a>
              <p className="text-[#C4BFC8] mb-6">
                Digitális design ügynökség, amely felhasználóközpontú megoldásokat szállít ambiciózus márkáknak.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-6">Szolgáltatások</h4>
              <ul className="space-y-3 text-[#C4BFC8]">
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">UX Kutatás</a></li>
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">UI Tervezés</a></li>
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">Service Design</a></li>
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">Akadálymentesítés</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-6">Iroda</h4>
              <address className="text-[#C4BFC8] not-italic leading-loose">
                1051 Budapest,<br />
                Példa utca 12.<br />
                hello@works.hu<br />
                +36 1 234 5678
              </address>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-6">Kövess minket</h4>
              <ul className="space-y-3 text-[#C4BFC8]">
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">Behance</a></li>
                <li><a href="#" className="hover:text-[#959EF1] transition-colors">Dribbble</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#3F1C4A] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#C4BFC8] text-sm">
              &copy; {new Date().getFullYear()} Works. Minden jog fenntartva.
            </p>
            <div className="flex space-x-6 text-sm text-[#C4BFC8]">
              <a href="#" className="hover:text-white transition-colors">Adatvédelmi tájékoztató</a>
              <a href="#" className="hover:text-white transition-colors">Sütikezelés</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
