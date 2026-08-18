import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center">
        <p className="text-7xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Az oldal nem található
        </h1>
        <p className="text-muted-foreground mb-8">
          A keresett oldal nem létezik, vagy időközben elköltözött. Nézz körül a
          főoldalon, a projektjeink vagy a blogunk között!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Vissza a főoldalra
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/projektek"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors"
          >
            Projektjeink
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors"
          >
            Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
