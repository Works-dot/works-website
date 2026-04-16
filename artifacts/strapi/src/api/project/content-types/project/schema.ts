export default {
  "kind": "collectionType",
  "collectionName": "projects",
  "info": {
    "singularName": "project",
    "pluralName": "projects",
    "displayName": "Projects",
    "description": "Projekt"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    },
    "title": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "homepageImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "projects"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    },
    "caseStudy": {
      "type": "component",
      "repeatable": false,
      "component": "project.case-study"
    },
    "contentBlocks": {
      "type": "dynamiczone",
      "components": [
        "content.text-block",
        "content.image-block",
        "content.highlight-block"
      ]
    },
    "services": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::service.service",
      "mappedBy": "relatedProjects"
    }
  }
};
