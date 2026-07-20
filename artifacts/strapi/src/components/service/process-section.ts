export default {
  "collectionName": "components_service_process_sections",
  "info": {
    "displayName": "Hogyan dolgozunk szekció",
    "icon": "arrow-right",
    "description": "Számozott folyamatlépések"
  },
  "options": {},
  "attributes": {
    "intro": {
      "type": "component",
      "repeatable": false,
      "component": "service.section-intro"
    },
    "steps": {
      "type": "component",
      "repeatable": true,
      "component": "service.process-step"
    }
  }
};
