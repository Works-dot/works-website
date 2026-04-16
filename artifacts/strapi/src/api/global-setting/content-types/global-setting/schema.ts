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
  "pluginOptions": {},
  "attributes": {
    "siteName": {
      "type": "string",
      "required": true
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
    "defaultMetaTitle": {
      "type": "string"
    },
    "defaultMetaDescription": {
      "type": "text"
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
      "type": "string"
    },
    "address": {
      "type": "text"
    },
    "openingHours": {
      "type": "component",
      "repeatable": true,
      "component": "shared.opening-hours"
    },
    "footerTagline": {
      "type": "text"
    },
    "newsletterHeading": {
      "type": "string"
    },
    "newsletterDescription": {
      "type": "text"
    },
    "copyrightText": {
      "type": "string"
    },
    "legalLinks": {
      "type": "component",
      "repeatable": true,
      "component": "shared.legal-link"
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
    }
  }
};
