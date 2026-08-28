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
