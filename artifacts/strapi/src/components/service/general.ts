export default {
  "collectionName": "components_service_generals",
  "info": {
    "displayName": "1. Általános adatok + fejléc (hero)",
    "icon": "layout",
    "description": "Az oldal tetején megjelenő cím, alcím, leírás és szolgáltatásikon, valamint a szolgáltatás webcíme (slug)"
  },
  "options": {},
  "attributes": {
    "slug": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "title": {
      "type": "string",
      "required": true
    },
    "subtitle": {
      "type": "string"
    },
    "heroDescription": {
      "type": "text"
    },
    "icon": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    }
  }
};
