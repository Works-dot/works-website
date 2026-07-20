export default {
  "collectionName": "components_service_deliverables_sections",
  "info": {
    "displayName": "Amit a projektből kapsz szekció",
    "icon": "gift",
    "description": "Két megjelenítési változat: kis kártyák vagy nagy kártyák felsorolással"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "variant": {
      "type": "enumeration",
      "enum": ["smallCards", "largeCards"],
      "default": "smallCards",
      "required": true
    },
    "smallCards": {
      "type": "component",
      "repeatable": true,
      "component": "service.deliverable-card"
    },
    "largeCards": {
      "type": "component",
      "repeatable": true,
      "component": "service.deliverable-group"
    }
  }
};
