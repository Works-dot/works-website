export default {
  "kind": "singleType",
  "collectionName": "privacy_pages",
  "info": {
    "singularName": "privacy-page",
    "pluralName": "privacy-pages",
    "displayName": "Privacy page",
    "description": "Adatkezelési tájékoztató oldal"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "heading": {
      "type": "string"
    },
    "body": {
      "type": "richtext"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
};
