export default {
  "kind": "singleType",
  "collectionName": "career_pages",
  "info": {
    "singularName": "career-page",
    "pluralName": "career-pages",
    "displayName": "Career page",
    "description": "Karrier oldal"
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
    },
    "workWithUs": {
      "type": "component",
      "repeatable": false,
      "component": "career.work-with-us"
    },
    "whyUs": {
      "type": "component",
      "repeatable": false,
      "component": "career.why-us-section"
    }
  }
};
