export default {
  "kind": "singleType",
  "collectionName": "about_pages",
  "info": {
    "singularName": "about-page",
    "pluralName": "about-pages",
    "displayName": "About page",
    "description": "Rólunk oldal"
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
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "about.intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "galleryImages": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    }
  }
};
