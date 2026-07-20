export default {
  "collectionName": "components_service_faq_sections",
  "info": {
    "displayName": "7. GYIK szekció",
    "icon": "question",
    "description": "Gyakran ismételt kérdések lenyíló listája"
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
