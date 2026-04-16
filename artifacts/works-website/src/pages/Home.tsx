import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Projects } from "@/components/sections/Projects";
import { Clients } from "@/components/sections/Clients";
import { BlogPreview } from "@/components/sections/BlogPreview";
import { CtaBanner } from "@/components/sections/CtaBanner";
import SEOHead from "@/components/SEOHead";

export default function Home() {
  return (
    <div className="min-h-screen bg-works-bg flex flex-col selection:bg-works-primary selection:text-white">
      <SEOHead />
      <Header />
      
      <main className="flex-grow">
        <Hero />
        <Services />
        <Projects />
        <CtaBanner />
        <Clients />
        <BlogPreview />
      </main>
      
      <Footer />
    </div>
  );
}
