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
    "valueProposition": {
      "type": "component",
      "repeatable": false,
      "component": "service.value-proposition"
    },
    "activities": {
      "type": "component",
      "repeatable": true,
      "component": "service.activity"
    },
    "benefits": {
      "type": "component",
      "repeatable": true,
      "component": "service.benefit"
    },
    "tools": {
      "type": "component",
      "repeatable": true,
      "component": "service.tool"
    },
    "howWeWork": {
      "type": "richtext"
    },
    "relatedProjects": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::project.project",
      "inversedBy": "services"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
};
