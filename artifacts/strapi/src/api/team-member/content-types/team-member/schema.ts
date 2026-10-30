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
    "linkedinUrl": {
      "type": "string",
      "regex": "^(https://(www\\.)?linkedin\\.com/in/[^/?#\\s]+/?([?#][^\\s]*)?)?$"
    },
    "bio": {
      "type": "text",
      "pluginOptions": { "i18n": { "localized": true } }
    },
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
