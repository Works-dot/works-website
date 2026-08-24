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
  "pluginOptions": {},
  "attributes": {
    "privacyPdf": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["files"]
    },
    "cookiePdf": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["files"]
    },
    "imprintPdf": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["files"]
    }
  }
};
