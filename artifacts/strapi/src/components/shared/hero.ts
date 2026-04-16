export default {
  "collectionName": "components_shared_heroes",
  "info": {
    "displayName": "Hero",
    "icon": "layout",
    "description": "Hero szekció"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "backgroundImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
