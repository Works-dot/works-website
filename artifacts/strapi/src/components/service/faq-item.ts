export default {
  "collectionName": "components_service_faq_items",
  "info": {
    "displayName": "GYIK elem",
    "icon": "question",
    "description": "Kérdés-válasz pár"
  },
  "options": {},
  "attributes": {
    "question": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "answer": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
