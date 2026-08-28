export default {
  "kind": "singleType",
  "collectionName": "legal_documents",
  "info": {
    "singularName": "legal-document",
    "pluralName": "legal-documents",
    "displayName": "Jogi dokumentumok",
    "description": "Adatkezelési, sütikezelési és impresszum PDF-ek"
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
