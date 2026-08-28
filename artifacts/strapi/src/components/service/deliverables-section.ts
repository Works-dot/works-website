export default {
  "collectionName": "components_service_deliverables_sections",
  "info": {
    "displayName": "5. „Amit a projektből kapsz” szekció",
    "icon": "gift",
    "description": "Két megjelenítési változat: kis kártyák (A) vagy nagy kártyák felsorolással (B)"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "variant": {
      "type": "enumeration",
      "enum": ["smallCards", "largeCards"],
      "default": "smallCards",
      "required": true
    },
    "smallCards": {
      "type": "component",
      "repeatable": true,
      "component": "service.deliverable-card",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "largeCards": {
      "type": "component",
      "repeatable": true,
      "component": "service.deliverable-group",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
