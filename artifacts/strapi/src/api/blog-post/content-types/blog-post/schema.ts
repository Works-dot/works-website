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
    "excerpt": {
      "type": "text"
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
      "inversedBy": "blogPosts"
    },
    "readingTime": {
      "type": "string"
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
    }
  }
};
