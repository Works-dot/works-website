import type { ComponentType, LazyExoticComponent } from "react";

type RouteComponent = ComponentType<any> | LazyExoticComponent<ComponentType<any>>;

export interface AppRoutes {
  Home: RouteComponent;
  Projektek: RouteComponent;
  CaseStudy: RouteComponent;
  Blog: RouteComponent;
  BlogPost: RouteComponent;
  ServicePage: RouteComponent;
  About: RouteComponent;
  Contact: RouteComponent;
  Karrier: RouteComponent;
  Adatkezeles: RouteComponent;
  CareerDetail: RouteComponent;
  NotFound: RouteComponent;
}
