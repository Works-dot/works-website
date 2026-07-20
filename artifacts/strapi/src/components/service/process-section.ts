export default {
  "collectionName": "components_service_process_sections",
  "info": {
    "displayName": "4. „Hogyan dolgozunk?” szekció",
    "icon": "arrow-right",
    "description": "Számozott folyamatlépések idővonalon"
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
