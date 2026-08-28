export default {
  "collectionName": "components_contact_form_subjects",
  "info": {
    "displayName": "Form Subject",
    "icon": "list",
    "description": "Kapcsolati űrlap tárgy"
  },
  "options": {},
  "attributes": {
    "label": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "value": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "isCareer": {
      "type": "boolean",
      "default": false
    }
  }
};
