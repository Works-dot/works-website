export default {
  "collectionName": "components_career_why_us_items",
  "info": {
    "displayName": "Why us item",
    "description": "Miért jó nálunk dolgozni kártya"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
