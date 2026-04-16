export default {
  "kind": "singleType",
  "collectionName": "about_pages",
  "info": {
    "singularName": "about-page",
    "pluralName": "about-pages",
    "displayName": "About page",
    "description": "Rólunk oldal"
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
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "about.intro"
    },
    "teamSectionHeading": {
      "type": "string"
    },
    "gallerySectionHeading": {
      "type": "string"
    },
    "galleryImages": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    }
  }
};
