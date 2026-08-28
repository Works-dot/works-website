export default {
  "kind": "singleType",
  "collectionName": "career_pages",
  "info": {
    "singularName": "career-page",
    "pluralName": "career-pages",
    "displayName": "Career page",
    "description": "Karrier oldal"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "hero": {
      "type": "component",
      "repeatable": false,
      "component": "shared.hero",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "workWithUs": {
      "type": "component",
      "repeatable": false,
      "component": "career.work-with-us",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "whyUs": {
      "type": "component",
      "repeatable": false,
      "component": "career.why-us-section",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
