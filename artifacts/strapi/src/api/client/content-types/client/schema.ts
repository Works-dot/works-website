export default {
  "kind": "collectionType",
  "collectionName": "clients",
  "info": {
    "singularName": "client",
    "pluralName": "clients",
    "displayName": "Clients",
    "description": "Ügyfél"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "initials": {
      "type": "string"
    },
    "logo": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "website": {
      "type": "string"
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "featured": {
      "type": "boolean",
      "default": false
    }
  }
};
