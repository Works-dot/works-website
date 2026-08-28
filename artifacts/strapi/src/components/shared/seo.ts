export default {
  "collectionName": "components_shared_seos",
  "info": {
    "displayName": "SEO",
    "icon": "search",
    "description": "SEO metaadatok"
  },
  "options": {},
  "attributes": {
    "metaTitle": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "metaDescription": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "ogImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
