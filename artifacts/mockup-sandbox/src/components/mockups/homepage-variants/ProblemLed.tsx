import React from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Frown, 
  AlertCircle,
  TrendingDown,
  ArrowDownRight,
  ChevronRight,
  Search,
  Layout,
  MousePointerClick,
  Accessibility,
  Users,
  Cpu,
  Code
} from 'lucide-react';

const ProblemLed = () => {
  return (
    <div className="min-h-screen bg-[#2A1232] font-['Mulish',sans-serif] text-[#f0edf1] flex flex-col selection:bg-[#E73352] selection:text-white transition-colors duration-1000">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#2A1232]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <a href="#" className="text-2xl font-black text-white tracking-tighter hover:text-[#E73352] transition-colors">
                Works.
              </a>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-sm font-medium text-[#C4BFC8] hover:text-white transition-colors">Szolgáltatások</a>
              <a href="#" className="text-sm font-medium text-[#C4BFC8] hover:text-white transition-colors">Projektek</a>
              <a href="#" className="text-sm font-medium text-[#C4BFC8] hover:text-white transition-colors">Blog</a>
              <a href="#" className="text-sm font-medium text-[#C4BFC8] hover:text-white transition-colors">Karrier</a>
              <a href="#" className="text-sm font-medium text-[#C4BFC8] hover:text-white transition-colors">Rólunk</a>
              <a href="#" className="text-sm font-medium text-[#C4BFC8] hover:text-white transition-colors">Kapcsolat</a>
            </nav>
            <div className="hidden md:flex">
              <a href="#" className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-white bg-[#E73352] hover:bg-white hover:text-[#E73352] transition-colors rounded-none">
                Beszéljünk!
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-40 lg:pt-48 lg:pb-56 overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-[#3F1C4A] blur-[150px] opacity-60 pointer-events-none"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-[#959EF1]/20 blur-[150px] opacity-60 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8">
              Tudod, mit akarnak valójában a <span className="text-[#E73352]">felhasználóid?</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#C4BFC8] mb-12 max-w-2xl leading-relaxed">
              A legtöbb digitális termék feltételezésekre épül. Mi megmutatjuk az utat az adatalapú tervezésig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-[#E73352] hover:bg-white hover:text-[#E73352] transition-all rounded-none group">
                Beszéljünk!
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#megoldasok" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white border border-[#C4BFC8]/30 hover:bg-white hover:text-[#2A1232] transition-all rounded-none">
                Így dolgozunk
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-24 bg-[#2A1232] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#3F1C4A]/30 p-10 border border-white/5 hover:border-[#E73352]/50 transition-colors group">
              <TrendingDown className="w-12 h-12 text-[#E73352] mb-6 opacity-80 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold text-white mb-4">Magas lemorzsolódás a funnelben</h3>
              <p className="text-[#C4BFC8] leading-relaxed">A felhasználók jelentős része elhagyja a folyamatot még a konverzió előtt, de nem érted pontosan miért, és hol akadnak el.</p>
            </div>
            
            <div className="bg-[#3F1C4A]/30 p-10 border border-white/5 hover:border-[#E73352]/50 transition-colors group">
              <Frown className="w-12 h-12 text-[#E73352] mb-6 opacity-80 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold text-white mb-4">Alacsony felhasználói elégedettség</h3>
              <p className="text-[#C4BFC8] leading-relaxed">Bár a funkciók működnek, a visszajelzések alapján az ügyfelek frusztráltak, és az alkalmazás használata nehézkes.</p>
            </div>
            
            <div className="bg-[#3F1C4A]/30 p-10 border border-white/5 hover:border-[#E73352]/50 transition-colors group">
              <AlertCircle className="w-12 h-12 text-[#E73352] mb-6 opacity-80 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-bold text-white mb-4">Költséges fejlesztési zsákutcák</h3>
              <p className="text-[#C4BFC8] leading-relaxed">Hónapokat töltöttetek egy új funkció fejlesztésével, amit végül alig használ valaki, rengeteg erőforrást elégetve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Transition */}
      <section className="py-32 bg-[#E73352] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pattern-diagonal-lines"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
            Mi más utat mutatunk.
          </h2>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-medium">
            Kutatásra épülő tervezéssel megszüntetjük a bizonytalanságot, hogy olyan terméket építhess, amit a felhasználóid imádni fognak.
          </p>
        </div>
      </section>

      {/* Services as Solutions */}
      <section id="megoldasok" className="py-32 bg-[#3F1C4A] border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Minden problémára van megoldásunk</h2>
            <div className="w-24 h-1 bg-[#E73352]"></div>
          </div>

          <div className="space-y-6">
            {/* Service 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-white/10 group hover:border-[#E73352]/50 transition-colors">
              <div className="lg:col-span-5 p-8 md:p-12 bg-[#2A1232]/50 flex flex-col justify-center">
                <span className="text-[#959EF1] text-sm font-bold uppercase tracking-wider mb-4">A probléma</span>
                <p className="text-xl text-[#C4BFC8] font-medium">"Nem tudjuk, mit szeretnének valójában a vásárlóink."</p>
              </div>
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center bg-[#2A1232]/20">
                <ArrowRight className="w-8 h-8 text-[#E73352]" />
              </div>
              <div className="lg:col-span-5 p-8 md:p-12 bg-white/5 flex flex-col justify-center relative overflow-hidden">
                <Search className="absolute -right-8 -bottom-8 w-48 h-48 text-white/[0.03]" />
                <span className="text-[#E73352] text-sm font-bold uppercase tracking-wider mb-4">A megoldás</span>
                <h4 className="text-3xl font-bold text-white mb-4 group-hover:text-[#959EF1] transition-colors">UX kutatás</h4>
                <p className="text-[#C4BFC8]">Feltérképezzük a valódi felhasználói igényeket és motivációkat mélyinterjúkkal és adatelemzéssel.</p>
              </div>
            </div>

            {/* Service 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-white/10 group hover:border-[#E73352]/50 transition-colors">
              <div className="lg:col-span-5 p-8 md:p-12 bg-[#2A1232]/50 flex flex-col justify-center">
                <span className="text-[#959EF1] text-sm font-bold uppercase tracking-wider mb-4">A probléma</span>
                <p className="text-xl text-[#C4BFC8] font-medium">"A szolgáltatásunk folyamatai összevisszák és nem logikusak."</p>
              </div>
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center bg-[#2A1232]/20">
                <ArrowRight className="w-8 h-8 text-[#E73352]" />
              </div>
              <div className="lg:col-span-5 p-8 md:p-12 bg-white/5 flex flex-col justify-center relative overflow-hidden">
                <Layout className="absolute -right-8 -bottom-8 w-48 h-48 text-white/[0.03]" />
                <span className="text-[#E73352] text-sm font-bold uppercase tracking-wider mb-4">A megoldás</span>
                <h4 className="text-3xl font-bold text-white mb-4 group-hover:text-[#959EF1] transition-colors">Service design</h4>
                <p className="text-[#C4BFC8]">Teljes körűen optimalizáljuk az ügyfélutat a különböző érintkezési pontokon keresztül.</p>
              </div>
            </div>

            {/* Service 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-white/10 group hover:border-[#E73352]/50 transition-colors">
              <div className="lg:col-span-5 p-8 md:p-12 bg-[#2A1232]/50 flex flex-col justify-center">
                <span className="text-[#959EF1] text-sm font-bold uppercase tracking-wider mb-4">A probléma</span>
                <p className="text-xl text-[#C4BFC8] font-medium">"Az applikációnk elavultnak tűnik és nehéz használni."</p>
              </div>
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center bg-[#2A1232]/20">
                <ArrowRight className="w-8 h-8 text-[#E73352]" />
              </div>
              <div className="lg:col-span-5 p-8 md:p-12 bg-white/5 flex flex-col justify-center relative overflow-hidden">
                <MousePointerClick className="absolute -right-8 -bottom-8 w-48 h-48 text-white/[0.03]" />
                <span className="text-[#E73352] text-sm font-bold uppercase tracking-wider mb-4">A megoldás</span>
                <h4 className="text-3xl font-bold text-white mb-4 group-hover:text-[#959EF1] transition-colors">UI tervezés</h4>
                <p className="text-[#C4BFC8]">Modern, letisztult és intuitív felületeket tervezünk, amelyek növelik a konverziót és az elkötelezettséget.</p>
              </div>
            </div>

            {/* Service grid for remaining */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white mb-8">További szakértelmünk</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Accessibility, title: "Akadálymentességi audit", desc: "Elérhetővé tesszük termékedet mindenki számára." },
                  { icon: Users, title: "User research", desc: "Validáljuk a koncepciókat fejlesztés előtt." },
                  { icon: Cpu, title: "AI-alapú tervezés", desc: "Mesterséges intelligencia integrálása a folyamatokba." },
                  { icon: Code, title: "Webfejlesztés", desc: "A terveket tökéletesen működő kóddá alakítjuk." }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-6 border border-white/5 hover:border-[#959EF1] transition-colors">
                    <s.icon className="w-8 h-8 text-[#959EF1] mb-4" />
                    <h5 className="text-lg font-bold text-white mb-2">{s.title}</h5>
                    <p className="text-sm text-[#C4BFC8]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Projects as Proof - The Light Section starts here */}
      <section className="py-32 bg-[#FAFAFA] text-[#2A1232]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">Bizonyítékok, nem ígéretek</h2>
              <div className="w-24 h-1 bg-[#E73352]"></div>
            </div>
            <a href="#" className="mt-6 md:mt-0 inline-flex items-center text-lg font-bold text-[#E73352] hover:text-[#2A1232] transition-colors group">
              Összes projekt megtekintése
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Project 1 */}
            <div className="bg-white border border-gray-200 hover:shadow-xl transition-shadow group">
              <div className="h-48 bg-[#3F1C4A] relative overflow-hidden flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#3F1C4A] to-[#E73352] opacity-80 mix-blend-multiply"></div>
                <h3 className="relative z-10 text-2xl font-bold text-white text-center">Banki applikáció újratervezése a jobb konverzióért</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#E73352] uppercase tracking-wider mb-2 block">Kihívás:</span>
                  <p className="text-sm text-gray-600 font-medium">Bonyolult onboarding folyamat, 60%-os lemorzsolódás a regisztráció során.</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#959EF1] uppercase tracking-wider mb-2 block">Megoldás:</span>
                  <p className="text-sm text-gray-600 font-medium">Felhasználói interjúk alapján egyszerűsített, lépcsőzetes regisztrációs flow tervezése.</p>
                </div>
                <div className="bg-[#f0edf1] p-4 border-l-4 border-[#2A1232]">
                  <span className="text-xs font-bold text-[#2A1232] uppercase tracking-wider mb-1 block">Eredmény:</span>
                  <p className="text-lg font-bold text-[#2A1232]">+45% sikeres regisztráció</p>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="bg-white border border-gray-200 hover:shadow-xl transition-shadow group">
              <div className="h-48 bg-[#959EF1] relative overflow-hidden flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#959EF1] to-[#3F1C4A] opacity-80 mix-blend-multiply"></div>
                <h3 className="relative z-10 text-2xl font-bold text-white text-center">E-kereskedelmi platform akadálymentesítése</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#E73352] uppercase tracking-wider mb-2 block">Kihívás:</span>
                  <p className="text-sm text-gray-600 font-medium">Az oldal nem felelt meg a WCAG 2.1 AA szintnek, elveszítve egy jelentős vásárlói réteget.</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#959EF1] uppercase tracking-wider mb-2 block">Megoldás:</span>
                  <p className="text-sm text-gray-600 font-medium">Teljes körű audit, majd a kontrasztok, navigáció és képernyőolvasó támogatás javítása.</p>
                </div>
                <div className="bg-[#f0edf1] p-4 border-l-4 border-[#2A1232]">
                  <span className="text-xs font-bold text-[#2A1232] uppercase tracking-wider mb-1 block">Eredmény:</span>
                  <p className="text-lg font-bold text-[#2A1232]">100% WCAG megfelelés</p>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="bg-white border border-gray-200 hover:shadow-xl transition-shadow group">
              <div className="h-48 bg-[#E73352] relative overflow-hidden flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#E73352] to-[#959EF1] opacity-80 mix-blend-multiply"></div>
                <h3 className="relative z-10 text-2xl font-bold text-white text-center">Egészségügyi alkalmazás UX kutatása</h3>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#E73352] uppercase tracking-wider mb-2 block">Kihívás:</span>
                  <p className="text-sm text-gray-600 font-medium">Az idősebb célcsoport nem tudta használni az új funkciókat a telemedicina appban.</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-[#959EF1] uppercase tracking-wider mb-2 block">Megoldás:</span>
                  <p className="text-sm text-gray-600 font-medium">Kontextuális interjúk az idősek otthonában, majd iteratív prototípus tesztelés.</p>
                </div>
                <div className="bg-[#f0edf1] p-4 border-l-4 border-[#2A1232]">
                  <span className="text-xs font-bold text-[#2A1232] uppercase tracking-wider mb-1 block">Eredmény:</span>
                  <p className="text-lg font-bold text-[#2A1232]">3x gyorsabb feladatvégzés</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 bg-[#f0edf1] text-[#2A1232] border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <svg className="w-16 h-16 text-[#E73352]/20 mx-auto mb-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <h3 className="text-2xl md:text-4xl font-light italic text-[#2A1232] leading-relaxed mb-10">
            "A Works. csapata nem egyszerűen szép felületeket rajzolt nekünk. Olyan mélyen megértették az ügyfeleink problémáit, hogy a közös munka eredményeként teljesen újrapozícionáltuk a fő termékünket. Ez az igazi értékteremtés."
          </h3>
          <div>
            <p className="font-bold text-[#2A1232] text-xl">Kovács Péter</p>
            <p className="text-[#E73352] font-medium">Product Director, Fintech Innovator</p>
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">Akik már ránk bízták a problémáikat</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {["Fintech Innovator", "EcoStart", "HealthPlus", "RetailGiant", "LogisticsPro", "EduTech Solutions"].map((logo, i) => (
              <div key={i} className="text-xl md:text-2xl font-black text-[#2A1232]">{logo}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-32 bg-[#FAFAFA] text-[#2A1232]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">Tudástár</h2>
              <div className="w-24 h-1 bg-[#E73352]"></div>
            </div>
            <a href="#" className="hidden md:inline-flex items-center text-lg font-bold text-[#E73352] hover:text-[#2A1232] transition-colors group">
              Tovább a blogra
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Az akadálymentes tervezés jövője", cat: "UX Design", date: "2024. Március 12." },
              { title: "UX kutatási módszerek 2024-ben", cat: "Research", date: "2024. Március 05." },
              { title: "Service design az egészségügyben", cat: "Esettanulmány", date: "2024. Február 28." }
            ].map((post, i) => (
              <a href="#" key={i} className="group block">
                <div className="aspect-[4/3] bg-[#f0edf1] mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#3F1C4A] opacity-5 group-hover:opacity-20 transition-opacity z-10"></div>
                  <div className="w-full h-full flex items-center justify-center text-[#C4BFC8]">
                    <Layout className="w-16 h-16 opacity-50" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-bold text-[#E73352] uppercase tracking-wider">{post.cat}</span>
                  <span className="text-xs text-gray-500">{post.date}</span>
                </div>
                <h3 className="text-2xl font-bold text-[#2A1232] group-hover:text-[#E73352] transition-colors leading-tight">{post.title}</h3>
              </a>
            ))}
          </div>
          
          <div className="mt-10 md:hidden flex justify-center">
            <a href="#" className="inline-flex items-center px-8 py-4 text-base font-bold text-[#2A1232] border border-[#2A1232] hover:bg-[#2A1232] hover:text-white transition-all rounded-none">
              Összes cikk
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#2A1232] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[#E73352] opacity-5 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #E73352 10%, transparent 80%)' }}></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Az első lépés a <span className="text-[#E73352]">megértés</span></h2>
          <p className="text-xl text-[#C4BFC8] mb-12 max-w-2xl mx-auto">
            Minden sikeres projekt egy őszinte beszélgetéssel kezdődik. Mondd el, min dolgozol, és megmutatjuk, hol lehetnek a vakfoltok.
          </p>
          <a href="#" className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-[#E73352] hover:bg-white hover:text-[#E73352] transition-all rounded-none group">
            Foglalj egy ingyenes konzultációt
            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a0b1f] text-[#C4BFC8] py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <span className="text-3xl font-black text-white tracking-tighter block mb-6">Works.</span>
              <p className="max-w-sm text-sm leading-relaxed mb-8">
                Adatalapú digitális terméktervezés és fejlesztés. Nem csak rajzolunk, hanem problémákat oldunk meg.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Navigáció</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Szolgáltatások</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Projektek</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Rólunk</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karrier</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kapcsolat</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Kapcsolat</h4>
              <ul className="space-y-3 text-sm">
                <li>Budapest, 1051</li>
                <li>Példa utca 12.</li>
                <li><a href="mailto:hello@works.hu" className="hover:text-[#E73352] transition-colors">hello@works.hu</a></li>
                <li><a href="tel:+3612345678" className="hover:text-[#E73352] transition-colors">+36 1 234 5678</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} Works. Minden jog fenntartva.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Adatvédelmi tájékoztató</a>
              <a href="#" className="hover:text-white transition-colors">Impresszum</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default ProblemLed;