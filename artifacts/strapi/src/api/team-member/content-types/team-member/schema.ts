export default {
  "kind": "collectionType",
  "collectionName": "team_members",
  "info": {
    "singularName": "team-member",
    "pluralName": "team-members",
    "displayName": "Team members",
    "description": "Csapattag"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "title": {
      "type": "string",
      "required": true,
      "pluginOptions": { "i18n": { "localized": true } }
    },
    "image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "order": {
      "type": "integer",
      "default": 0
    }
  }
};
