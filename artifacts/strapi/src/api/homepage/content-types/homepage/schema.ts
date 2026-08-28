export default {
  "kind": "singleType",
  "collectionName": "homepages",
  "info": {
    "singularName": "homepage",
    "pluralName": "homepages",
    "displayName": "Home page",
    "description": "Főoldal"
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
    "hero": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.hero",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "servicesSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.services-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "projectsSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.projects-section",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "ctaBanner": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.cta-banner",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "blogSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.blog-section",
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
