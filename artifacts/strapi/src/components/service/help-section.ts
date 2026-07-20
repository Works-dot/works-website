export default {
  "collectionName": "components_service_help_sections",
  "info": {
    "displayName": "3. „Miben tudunk segíteni?” szekció",
    "icon": "grid",
    "description": "Ikonos kártyarács a szolgáltatás területeiről"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "cards": {
      "type": "component",
      "repeatable": true,
      "component": "service.help-card"
    },
    "ctaText": {
      "type": "text"
    },
    "ctaButtonText": {
      "type": "string"
    },
    "ctaButtonLink": {
      "type": "string"
    }
  }
};
