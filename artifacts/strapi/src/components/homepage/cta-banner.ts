export default {
  "collectionName": "components_homepage_cta_banners",
  "info": {
    "displayName": "CTA Banner",
    "icon": "megaphone",
    "description": "CTA banner szekció"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "ctaText": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "ctaLink": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
