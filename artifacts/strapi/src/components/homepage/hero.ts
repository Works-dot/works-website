export default {
  "collectionName": "components_homepage_heroes",
  "info": {
    "displayName": "Homepage Hero",
    "icon": "layout",
    "description": "Főoldal hero szekció"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string",
      "required": true
    },
    "highlightedWord": {
      "type": "string"
    },
    "description": {
      "type": "text"
    },
    "primaryCtaText": {
      "type": "string"
    },
    "primaryCtaLink": {
      "type": "string"
    },
    "secondaryCtaText": {
      "type": "string"
    },
    "secondaryCtaLink": {
      "type": "string"
    },
    "backgroundImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
