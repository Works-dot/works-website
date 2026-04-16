export default {
  "collectionName": "components_service_generals",
  "info": {
    "displayName": "General (listing + hero)",
    "icon": "layout",
    "description": "Általános szolgáltatási adatok"
  },
  "options": {},
  "attributes": {
    "slug": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "title": {
      "type": "string",
      "required": true
    },
    "subtitle": {
      "type": "string"
    },
    "heroDescription": {
      "type": "text"
    },
    "icon": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "heroImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
