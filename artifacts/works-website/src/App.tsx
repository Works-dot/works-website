import {
  Component,
  Suspense,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  Switch,
  Route,
  Router as WouterRouter,
  useLocation,
} from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieConsentProvider } from "@/lib/cookie-consent";
import { CookieBanner } from "@/components/CookieBanner";
import { I18nProvider, useI18n } from "@/i18n";
import {
  buildLocalePath,
  getLocaleFromPath,
  getRoutePath,
  ROUTE_LOCALES,
  type RouteKey,
} from "@/lib/i18n-routes";
import type { AppRoutes } from "./routes.types";
import { useStrapiQuery } from "@/hooks/useStrapiQuery";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const ROUTE_COMPONENTS: readonly [
  routeKey: RouteKey,
  componentKey: keyof Omit<AppRoutes, "NotFound">,
][] = [
  ["home", "Home"],
  ["projects", "Projektek"],
  ["projectDetail", "CaseStudy"],
  ["blog", "Blog"],
  ["blogPost", "BlogPost"],
  ["serviceDetail", "ServicePage"],
  ["about", "About"],
  ["contact", "Contact"],
  ["careers", "Karrier"],
  ["privacy", "Adatkezeles"],
  ["cookies", "Sutik"],
  ["careerDetail", "CareerDetail"],
];

function Router({ routes }: { routes: AppRoutes }) {
  return (
    <Switch>
      {ROUTE_LOCALES.flatMap((locale) =>
        ROUTE_COMPONENTS.map(([routeKey, componentKey]) => (
          <Route
            key={`${locale}:${routeKey}`}
            path={getRoutePath(locale, routeKey)}
            component={routes[componentKey]}
          />
        ))
      )}
      <Route component={routes.NotFound} />
    </Switch>
  );
}

function RouteLoading() {
  const { t } = useI18n();

  return (
    <main
      className="min-h-screen bg-works-bg flex items-center justify-center px-6"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-works-dark/60 font-semibold">{t("states.loading")}</p>
    </main>
  );
}

function RouteErrorFallback() {
  const { locale, t } = useI18n();

  return (
    <main
      className="min-h-screen bg-works-bg flex items-center justify-center px-6 text-center"
      role="alert"
    >
      <div className="max-w-lg">
        <p className="text-works-primary text-5xl font-bold mb-5">!</p>
        <h1 className="text-3xl md:text-4xl font-bold text-works-dark mb-4">
          {t("states.navigationErrorHeading")}
        </h1>
        <p className="text-works-dark/60 leading-relaxed mb-8">
          {t("states.navigationErrorBody")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-works-primary text-white font-semibold hover:bg-works-primary/90 transition-colors"
          >
            {t("states.reloadPage")}
          </button>
          <a
            href={buildLocalePath(locale, "home")}
            className="px-6 py-3 border border-works-dark/20 text-works-dark font-semibold hover:border-works-primary hover:text-works-primary transition-colors"
          >
            {t("cta.backToHome")}
          </a>
        </div>
      </div>
    </main>
  );
}

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route rendering failed", error, info);
  }

  render() {
    return this.state.hasError ? <RouteErrorFallback /> : this.props.children;
  }
}

function RouteContent({ routes }: { routes: AppRoutes }) {
  const [location] = useLocation();

  return (
    <RouteErrorBoundary key={location}>
      <Suspense fallback={<RouteLoading />}>
        <Router routes={routes} />
      </Suspense>
    </RouteErrorBoundary>
  );
}

function LocaleRuntime({ routes }: { routes: AppRoutes }) {
  const [location] = useLocation();
  const locale = getLocaleFromPath(location);

  return (
    <I18nProvider locale={locale}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <CookieConsentProvider>
            <ScrollToTop />
            <RouteContent routes={routes} />
            <CookieBanner />
            <Toaster />
          </CookieConsentProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

function App({ ssrPath, routes }: { ssrPath?: string; routes: AppRoutes }) {
  return (
    <WouterRouter
      base={import.meta.env.BASE_URL.replace(/\/$/, "")}
      ssrPath={ssrPath}
    >
      <LocaleRuntime routes={routes} />
    </WouterRouter>
  );
}

export default App;
