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
      "component": "service.section-intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "cards": {
      "type": "component",
      "repeatable": true,
      "component": "service.help-card",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
