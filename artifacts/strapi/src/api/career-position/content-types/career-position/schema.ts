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
    "team": {
      "type": "string"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "careerPositions"
    },
    "excerpt": {
      "type": "text"
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    },
    "contentBlocks": {
      "type": "dynamiczone",
      "components": [
        "content.text-block",
        "content.image-block",
        "content.highlight-block"
      ]
    },
    "isActive": {
      "type": "boolean",
      "default": true
    }
  }
};
