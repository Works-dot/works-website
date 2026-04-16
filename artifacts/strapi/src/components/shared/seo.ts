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
      "required": true
    },
    "metaDescription": {
      "type": "text"
    },
    "ogImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
