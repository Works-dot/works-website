// Kliensoldali útvonal-táblázat: minden oldal lazy-betöltésű, így a
// kezdő csomag kicsi marad (a markdown-stack pl. csak a tartalmi oldalakon töltődik).
// A prerenderelt HTML-t a React 18 szelektív hidratálása megőrzi, amíg a chunk betölt.
import { lazy } from "react";
import type { AppRoutes } from "./routes.types";

export const routes: AppRoutes = {
  Home: lazy(() => import("@/pages/Home")),
  Projektek: lazy(() => import("@/pages/Projektek")),
  CaseStudy: lazy(() => import("@/pages/CaseStudy")),
  Blog: lazy(() => import("@/pages/Blog")),
  BlogPost: lazy(() => import("@/pages/BlogPost")),
  ServicePage: lazy(() => import("@/pages/ServicePage")),
  About: lazy(() => import("@/pages/About")),
  Contact: lazy(() => import("@/pages/Contact")),
  Karrier: lazy(() => import("@/pages/Karrier")),
  Adatkezeles: lazy(() => import("@/pages/Adatkezeles")),
  CareerDetail: lazy(() => import("@/pages/CareerDetail")),
  NotFound: lazy(() => import("@/pages/not-found")),
};
