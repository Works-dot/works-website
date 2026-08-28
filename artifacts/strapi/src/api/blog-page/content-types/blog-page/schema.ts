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
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "heading": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "description": {
      "type": "text",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "shared.seo",
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};