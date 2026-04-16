export default {
  "collectionName": "components_about_intros",
  "info": {
    "displayName": "About Intro",
    "icon": "information",
    "description": "Rólunk bemutatkozás"
  },
  "options": {},
  "attributes": {
    "heading": {
      "type": "string",
      "required": true
    },
    "body": {
      "type": "richtext"
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
