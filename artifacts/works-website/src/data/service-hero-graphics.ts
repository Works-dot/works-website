import defaultServiceHeroGraphic from "@/assets/heroes/Hero_ux_kutatas_1789027068382.png";
import uxResearchHeroGraphic from "@/assets/heroes/Hero_ux_kutatas_1789027068382.png";
import uxUiDesignHeroGraphic from "@/assets/heroes/UI_Design_1789027068381.png";
import serviceDesignHeroGraphic from "@/assets/heroes/Hero_service_design_1789027068382.png";
import aiProductDevelopmentHeroGraphic from "@/assets/heroes/Hero_ai_product_1789027068382.png";
import accessibleServicesHeroGraphic from "@/assets/heroes/Hero_akadalymentes_1789027068382.png";
import digitalSkillsHeroGraphic from "@/assets/heroes/Hero_digitalis_kepessegfejlesztes_1789027068383.png";
import uxResearchMobileHeroGraphic from "@/assets/heroes/Hero_service_ux_kutatas_mobile_1789374396076.png";
import uxUiDesignMobileHeroGraphic from "@/assets/heroes/Hero_service_uxui_design_mobile_1789374396077.png";
import serviceDesignMobileHeroGraphic from "@/assets/heroes/Hero_service_sevice_design_mobile_1789374396076.png";
import aiProductDevelopmentMobileHeroGraphic from "@/assets/heroes/Hero_service_ai_product_mobile_1789374396075.png";
import accessibleServicesMobileHeroGraphic from "@/assets/heroes/Hero_service_accesibility_mobile_1789374396075.png";
import digitalSkillsMobileHeroGraphic from "@/assets/heroes/Hero_service_digital_mobile_1789374396076.png";
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

const dedicatedServiceMobileHeroGraphics: Record<ServiceHeroGraphicKey, string> = {
  uxResearch: uxResearchMobileHeroGraphic,
  uxUiDesign: uxUiDesignMobileHeroGraphic,
  serviceDesign: serviceDesignMobileHeroGraphic,
  aiProductDevelopment: aiProductDevelopmentMobileHeroGraphic,
  accessibleServices: accessibleServicesMobileHeroGraphic,
  digitalSkills: digitalSkillsMobileHeroGraphic,
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

export function getServiceMobileHeroGraphic(slug: string): string {
  const key = getDedicatedGraphicKey(slug);
  return key ? dedicatedServiceMobileHeroGraphics[key] : defaultServiceHeroGraphic;
}