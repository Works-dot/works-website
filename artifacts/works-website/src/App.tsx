import { Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieConsentProvider } from "@/lib/cookie-consent";
import { CookieBanner } from "@/components/CookieBanner";
import { I18nProvider } from "@/i18n";
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
              <Suspense fallback={null}>
                <Router routes={routes} />
              </Suspense>
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
