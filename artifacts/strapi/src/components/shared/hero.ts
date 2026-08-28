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
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "backgroundImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
