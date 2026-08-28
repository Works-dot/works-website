export default {
  "collectionName": "components_service_deliverable_cards",
  "info": {
    "displayName": "Kis ikonos kártya (A változat)",
    "icon": "apps",
    "description": "Amit a projektből kapsz — kis kártya"
  },
  "options": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "icon": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
