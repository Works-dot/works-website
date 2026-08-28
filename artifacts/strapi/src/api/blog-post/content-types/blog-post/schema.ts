export default {
  "kind": "collectionType",
  "collectionName": "blog_posts",
  "info": {
    "singularName": "blog-post",
    "pluralName": "blog-posts",
    "displayName": "Blog posts",
    "description": "Blog bejegyzés"
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
    "excerpt": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "date": {
      "type": "date"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::team-member.team-member"
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag",
      "inversedBy": "blogPosts",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "readingTime": {
      "type": "string",
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "featured": {
      "type": "boolean",
      "default": false
    },
    "order": {
      "type": "integer"
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
    }
  }
};
