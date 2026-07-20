export default {
  "collectionName": "components_service_help_cards",
  "info": {
    "displayName": "Segítség kártya",
    "icon": "check-circle",
    "description": "Miben tudunk segíteni kártya"
  },
  "options": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "icon": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
