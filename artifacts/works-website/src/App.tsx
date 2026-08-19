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
import type { AppRoutes } from "./routes.types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router({ routes }: { routes: AppRoutes }) {
  return (
    <Switch>
      <Route path="/" component={routes.Home} />
      <Route path="/projektek" component={routes.Projektek} />
      <Route path="/projektek/:slug" component={routes.CaseStudy} />
      <Route path="/blog" component={routes.Blog} />
      <Route path="/blog/:slug" component={routes.BlogPost} />
      <Route path="/szolgaltatasok/:slug" component={routes.ServicePage} />
      <Route path="/rolunk" component={routes.About} />
      <Route path="/kapcsolat" component={routes.Contact} />
      <Route path="/karrier" component={routes.Karrier} />
      <Route path="/adatkezeles" component={routes.Adatkezeles} />
      <Route path="/sutik" component={routes.Sutik} />
      <Route path="/karrier/:slug" component={routes.CareerDetail} />
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
  const { t } = useI18n();

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
            href={import.meta.env.BASE_URL}
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

function App({ ssrPath, routes }: { ssrPath?: string; routes: AppRoutes }) {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <CookieConsentProvider>
            <WouterRouter
              base={import.meta.env.BASE_URL.replace(/\/$/, "")}
              ssrPath={ssrPath}
            >
              <ScrollToTop />
              <RouteContent routes={routes} />
              <CookieBanner />
            </WouterRouter>
            <Toaster />
          </CookieConsentProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;
