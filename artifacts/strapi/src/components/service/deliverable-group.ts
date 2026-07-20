export default {
  "collectionName": "components_service_deliverable_groups",
  "info": {
    "displayName": "Nagy kártya felsorolással (B változat)",
    "icon": "apps",
    "description": "Amit a projektből kapsz — nagy kártya felsorolással"
  },
  "options": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "description": {
      "type": "text"
    },
    "icon": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "bullets": {
      "type": "component",
      "repeatable": true,
      "component": "service.bullet-point"
    }
  }
};
