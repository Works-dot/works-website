export default {
  "kind": "singleType",
  "collectionName": "projects_page_settings",
  "info": {
    "singularName": "projects-page",
    "pluralName": "projects-pages",
    "displayName": "Projektek oldal",
    "description": "A projektek gyűjtőoldalának címe, leírása és SEO beállításai"
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