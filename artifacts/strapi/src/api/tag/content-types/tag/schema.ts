export default {
  "kind": "collectionType",
  "collectionName": "tags",
  "info": {
    "singularName": "tag",
    "pluralName": "tags",
    "displayName": "Tags",
    "description": "Címke"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "required": true
    },
    "projects": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::project.project",
      "mappedBy": "tags"
    },
    "blogPosts": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::blog-post.blog-post",
      "mappedBy": "tags"
    },
    "careerPositions": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::career-position.career-position",
      "mappedBy": "tags"
    }
  }
};
