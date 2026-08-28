export default {
  "kind": "singleType",
  "collectionName": "global_settings",
  "info": {
    "singularName": "global-setting",
    "pluralName": "global-settings",
    "displayName": "Global settings",
    "description": "Globális beállítások"
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
    "siteName": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "logo": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "favicon": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "ogImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "socialLinks": {
      "type": "component",
      "repeatable": true,
      "component": "shared.social-link"
    },
    "contactEmail": {
      "type": "email"
    },
    "contactPhone": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "address": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "openingHours": {
      "type": "component",
      "repeatable": true,
      "component": "shared.opening-hours",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "footerTagline": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "newsletterHeading": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "newsletterDescription": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "copyrightText": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "legalLinks": {
      "type": "component",
      "repeatable": true,
      "component": "shared.legal-link",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "heroBackgroundPattern": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "bgGraphic1": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "bgGraphic2": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "englishSiteEnabled": {
      "type": "boolean",
      "default": false,
      "required": false
    }
  }
};
