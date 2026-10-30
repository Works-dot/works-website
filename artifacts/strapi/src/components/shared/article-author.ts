export default {
  collectionName: "components_shared_article_authors",
  info: { displayName: "Kézzel megadott szerző", description: "Külső szerző adatai; csak kézi szerzőmódban jelenik meg." },
  attributes: {
    name: { type: "string" },
    title: { type: "string" },
    bio: { type: "text" },
    linkedinUrl: { type: "string", regex: "^(https://(www\\.)?linkedin\\.com/in/[^/?#\\s]+/?([?#][^\\s]*)?)?$" },
    image: { type: "media", multiple: false, allowedTypes: ["images"] },
  },
};
