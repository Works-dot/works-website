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
  "pluginOptions": {},
  "attributes": {
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    },
    "hero": {
      "type": "component",
      "repeatable": false,
      "component": "shared.hero"
    },
    "formHeading": {
      "type": "string"
    },
    "formSubjects": {
      "type": "component",
      "repeatable": true,
      "component": "contact.form-subject"
    },
    "successTitle": {
      "type": "string"
    },
    "successMessage": {
      "type": "text"
    },
    "mapHeading": {
      "type": "string"
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
