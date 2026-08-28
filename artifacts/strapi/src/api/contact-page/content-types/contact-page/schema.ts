export default {
  "kind": "singleType",
  "collectionName": "contact_pages",
  "info": {
    "singularName": "contact-page",
    "pluralName": "contact-pages",
    "displayName": "Contact page",
    "description": "Kapcsolat oldal"
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
    "formHeading": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "formSubjects": {
      "type": "component",
      "repeatable": true,
      "component": "contact.form-subject",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "careerConsent": {
      "type": "component",
      "repeatable": false,
      "component": "contact.career-consent",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "successTitle": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "successMessage": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "mapHeading": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "mapEmbedUrl": {
      "type": "text"
    },
    "backgroundImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
