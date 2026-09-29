export default {
  "kind": "singleType",
  "collectionName": "legal_documents",
  "info": {
    "singularName": "legal-document",
    "pluralName": "legal-documents",
    "displayName": "Jogi dokumentumok",
    "description": "Lokalizált jogi szövegek és letölthető PDF-mellékletek"
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
    "privacyTitle": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "privacyBody": {
      "type": "richtext",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "cookieTitle": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "cookieBody": {
      "type": "richtext",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "imprintTitle": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "imprintBody": {
      "type": "richtext",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "privacyPdf": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["files"],
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "cookiePdf": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["files"],
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "imprintPdf": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["files"],
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
