export default {
  "collectionName": "components_service_questions_sections",
  "info": {
    "displayName": "Kérdések szekció",
    "icon": "question",
    "description": "Milyen kérdésekre segítünk választ találni?"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "cards": {
      "type": "component",
      "repeatable": true,
      "component": "service.question-card"
    }
  }
};
