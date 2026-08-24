import defaultServiceHeroGraphic from "@assets/works-background_1774441334981.png";
import uxResearchHeroGraphic from "@assets/UX_kutatas_1787571512457.png";
import uxUiDesignHeroGraphic from "@assets/UXUI_design_1787571512458.png";
import serviceDesignHeroGraphic from "@assets/Service_design_1787571512457.png";
import aiProductDevelopmentHeroGraphic from "@assets/ai_termekfejlesztes_1787571512455.png";
import accessibleServicesHeroGraphic from "@assets/akadalymentes_szolgaltatasok_1787571512456.png";
import digitalSkillsHeroGraphic from "@assets/digitalis_kepessegfejlesztes_1787571512456.png";
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