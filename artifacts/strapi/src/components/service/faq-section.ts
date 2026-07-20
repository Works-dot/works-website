export default {
  "collectionName": "components_service_faq_sections",
  "info": {
    "displayName": "GYIK szekció",
    "icon": "question",
    "description": "Gyakran ismételt kérdések"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "items": {
      "type": "component",
      "repeatable": true,
      "component": "service.faq-item"
    }
  }
};
