export default {
  "kind": "singleType",
  "collectionName": "blog_pages",
  "info": {
    "singularName": "blog-page",
    "pluralName": "blog-pages",
    "displayName": "Blog page",
    "description": "Blog oldal"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    },
    "hero": {
      "type": "component",
      "repeatable": false,
      "component": "shared.hero"
    }
  }
};
