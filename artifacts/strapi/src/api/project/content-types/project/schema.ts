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
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "title": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
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
    "order": {
      "type": "integer"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "projects",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "caseStudy": {
      "type": "component",
      "repeatable": false,
      "component": "project.case-study",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "contentBlocks": {
      "type": "dynamiczone",
      "components": [
        "content.text-block",
        "content.image-block",
        "content.highlight-block"
      ],
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "services": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::service.service",
      "mappedBy": "relatedProjects",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
