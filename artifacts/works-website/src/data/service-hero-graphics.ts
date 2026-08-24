import defaultServiceHeroGraphic from "@assets/works-background_1774441334981.png";
import uxResearchHeroGraphic from "@assets/UX_kutatas_1787571512457.png";
import uxUiDesignHeroGraphic from "@assets/UXUI_design_1787571512458.png";
import serviceDesignHeroGraphic from "@assets/Service_design_1787571512457.png";
import aiProductDevelopmentHeroGraphic from "@assets/ai_termekfejlesztes_1787571512455.png";
import accessibleServicesHeroGraphic from "@assets/akadalymentes_szolgaltatasok_1787571512456.png";
import digitalSkillsHeroGraphic from "@assets/digitalis_kepessegfejlesztes_1787571512456.png";

const serviceHeroGraphics: Record<string, string> = {
  "ux-kutatas": uxResearchHeroGraphic,
  "ui-design": uxUiDesignHeroGraphic,
  "service-design": serviceDesignHeroGraphic,
  "ai-termekfejlesztes": aiProductDevelopmentHeroGraphic,
  "akadalymentesites": accessibleServicesHeroGraphic,
  "digitalis-kepessegfejlesztes": digitalSkillsHeroGraphic,
};

export function getServiceHeroGraphic(slug: string): string {
  return serviceHeroGraphics[slug] ?? defaultServiceHeroGraphic;
}