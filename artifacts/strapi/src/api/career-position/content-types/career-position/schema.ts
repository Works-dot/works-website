export default {
  "kind": "collectionType",
  "collectionName": "career_positions",
  "info": {
    "singularName": "career-position",
    "pluralName": "career-positions",
    "displayName": "Career positions",
    "description": "Karrier pozíció"
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
    "team": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "careerPositions",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "excerpt": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo",
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
    "isActive": {
      "type": "boolean",
      "default": true
    }
  }
};
