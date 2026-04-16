export default {
  "kind": "singleType",
  "collectionName": "projects_pages",
  "info": {
    "singularName": "projects-page",
    "pluralName": "projects-pages",
    "displayName": "Projects page",
    "description": "Projektek oldal"
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
