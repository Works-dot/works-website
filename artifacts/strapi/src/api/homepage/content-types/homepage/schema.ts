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
  "pluginOptions": {},
  "attributes": {
    "hero": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.hero"
    },
    "servicesSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.services-section"
    },
    "projectsSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.projects-section"
    },
    "ctaBanner": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.cta-banner"
    },
    "clientsSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.clients-section"
    },
    "blogSection": {
      "type": "component",
      "repeatable": false,
      "component": "homepage.blog-section"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
};
