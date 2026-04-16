export default {
  "collectionName": "components_content_image_blocks",
  "info": {
    "displayName": "Image Block",
    "icon": "picture",
    "description": "Képes blokk"
  },
  "options": {},
  "attributes": {
    "image": {
      "type": "media",
      "multiple": false,
      "required": true,
      "allowedTypes": ["images"]
    },
    "caption": {
      "type": "string"
    }
  }
};
