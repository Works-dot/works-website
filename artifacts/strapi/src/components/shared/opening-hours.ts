export default {
  "collectionName": "components_shared_opening_hours",
  "info": {
    "displayName": "Opening Hours",
    "icon": "clock",
    "description": "Nyitvatartási idő"
  },
  "options": {},
  "attributes": {
    "day": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "hours": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    }
  }
};
