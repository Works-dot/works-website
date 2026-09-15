import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { buildLocalePath } from "@/lib/i18n-routes";
import { Helmet } from "react-helmet-async";
import { TermText } from "@/components/Terminology";

export default function NotFound() {
  const { locale, t } = useI18n();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div className="max-w-lg text-center">
        <p className="text-7xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          <TermText>{t("pages.notFoundTitle")}</TermText>
        </h1>
        <p className="text-muted-foreground mb-8">
          <TermText>{t("pages.notFoundBody")}</TermText>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={buildLocalePath(locale, "home")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            <TermText>{t("pages.notFoundBackHome")}</TermText>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={buildLocalePath(locale, "projects")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors"
          >
            <TermText>{t("pages.notFoundProjects")}</TermText>
          </Link>
          <Link
            href={buildLocalePath(locale, "blog")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors"
          >
            <TermText>{t("pages.notFoundBlog")}</TermText>
          </Link>
        </div>
      </div>
    </div>
  );
}
