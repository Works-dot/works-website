import defaultServiceHeroGraphic from "@/assets/heroes/Hero_ux_kutatas_1789027068382.png";
import uxResearchHeroGraphic from "@/assets/heroes/Hero_ux_kutatas_1789027068382.png";
import uxUiDesignHeroGraphic from "@/assets/heroes/UI_Design_1789027068381.png";
import serviceDesignHeroGraphic from "@/assets/heroes/Hero_service_design_1789027068382.png";
import aiProductDevelopmentHeroGraphic from "@/assets/heroes/Hero_ai_product_1789027068382.png";
import accessibleServicesHeroGraphic from "@/assets/heroes/Hero_akadalymentes_1789027068382.png";
import digitalSkillsHeroGraphic from "@/assets/heroes/Hero_digitalis_kepessegfejlesztes_1789027068383.png";
import serviceHeroGraphicManifest from "./service-hero-graphics.json";

type ServiceHeroGraphicKey = keyof typeof serviceHeroGraphicManifest.graphics;

const dedicatedServiceHeroGraphics: Record<ServiceHeroGraphicKey, string> = {
  uxResearch: uxResearchHeroGraphic,
  uxUiDesign: uxUiDesignHeroGraphic,
  serviceDesign: serviceDesignHeroGraphic,
  aiProductDevelopment: aiProductDevelopmentHeroGraphic,
  accessibleServices: accessibleServicesHeroGraphic,
  digitalSkills: digitalSkillsHeroGraphic,
};

function getDedicatedGraphicKey(slug: string): ServiceHeroGraphicKey | undefined {
  const key = (serviceHeroGraphicManifest.slugs as Record<string, string>)[slug];
  return key && Object.hasOwn(dedicatedServiceHeroGraphics, key)
    ? (key as ServiceHeroGraphicKey)
    : undefined;
}

export function getServiceHeroGraphic(slug: string): string {
  const key = getDedicatedGraphicKey(slug);
  return key ? dedicatedServiceHeroGraphics[key] : defaultServiceHeroGraphic;
}