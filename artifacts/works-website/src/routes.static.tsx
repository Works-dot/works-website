// Szerveroldali (prerender) útvonal-táblázat: statikus importok,
// mert a renderToString nem támogatja a lazy komponenseket.
import Home from "@/pages/Home";
import Projektek from "@/pages/Projektek";
import CaseStudy from "@/pages/CaseStudy";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import ServicePage from "@/pages/ServicePage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Karrier from "@/pages/Karrier";
import Adatkezeles from "@/pages/Adatkezeles";
import CareerDetail from "@/pages/CareerDetail";
import NotFound from "@/pages/not-found";
import type { AppRoutes } from "./routes.types";

export const routes: AppRoutes = {
  Home,
  Projektek,
  CaseStudy,
  Blog,
  BlogPost,
  ServicePage,
  About,
  Contact,
  Karrier,
  Adatkezeles,
  CareerDetail,
  NotFound,
};
