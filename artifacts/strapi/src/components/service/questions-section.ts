export default {
  "collectionName": "components_service_questions_sections",
  "info": {
    "displayName": "2. „Milyen kérdésekre segítünk választ találni?” szekció",
    "icon": "question",
    "description": "A fejléc alatti kérdéskártyás szekció"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "cards": {
      "type": "component",
      "repeatable": true,
      "component": "service.question-card",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
