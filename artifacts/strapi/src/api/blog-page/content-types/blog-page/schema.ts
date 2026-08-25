export default {
  "kind": "singleType",
  "collectionName": "blog_page_settings",
  "info": {
    "singularName": "blog-page",
    "pluralName": "blog-pages",
    "displayName": "Blog page",
    "description": "A blog gyűjtőoldalának címe, leírása és SEO beállításai"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    "heading": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text",
      "required": true
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo"
    }
  }
};