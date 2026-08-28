export default {
  "collectionName": "components_homepage_heroes",
  "info": {
    "displayName": "Homepage Hero",
    "icon": "layout",
    "description": "Főoldal hero szekció"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "highlightedWord": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "primaryCtaText": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "primaryCtaLink": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "secondaryCtaText": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "secondaryCtaLink": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "backgroundImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
