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
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "title": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "order": {
      "type": "integer",
      "default": 0
    },
    "general": {
      "type": "component",
      "repeatable": false,
      "component": "service.general",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "definitionSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "questionsSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.questions-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "helpSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.help-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "processSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.process-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "deliverablesSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.deliverables-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "ctaBanner": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.cta-banner",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "projectExamplesIntro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "relatedProjects": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::project.project",
      "inversedBy": "services",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "faqSection": {
      "type": "component",
      "repeatable": false,
      "component": "service.faq-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "relatedServicesIntro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "relatedServices": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::service.service",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
