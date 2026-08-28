export default {
  "collectionName": "components_career_why_us_sections",
  "info": {
    "displayName": "Miért jó nálunk dolgozni?",
    "description": "Miért jó nálunk dolgozni szekció"
  },
  "attributes": {
    "sectionHeading": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "items": {
      "type": "component",
      "repeatable": true,
      "component": "career.why-us-item",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
