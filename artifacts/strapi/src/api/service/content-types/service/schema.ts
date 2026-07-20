export default {
  "kind": "collectionType",
  "collectionName": "services",
  "info": {
    "singularName": "service",
    "pluralName": "services",
    "displayName": "Services",
    "description": "Szolgáltatás"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string"
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "general": {
      "type": "component",
      "repeatable": false,
      "component": "service.general"
    },
    "questionsSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.questions-section"
    },
    "helpSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.help-section"
    },
    "processSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.process-section"
    },
    "deliverablesSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.deliverables-section"
    },
    "projectExamplesIntro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "relatedProjects": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::project.project",
      "inversedBy": "services"
    },
    "faqSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.faq-section"
    },
    "relatedServicesIntro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "relatedServices": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::service.service"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
};
