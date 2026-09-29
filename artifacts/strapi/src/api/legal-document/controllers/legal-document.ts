import { factories } from '@strapi/strapi';
export default factories.createCoreController('api::legal-document.legal-document', () => ({
  async find(ctx) {
    // Content API is public-facing even when a caller supplies preview parameters.
    // Admin editing uses the content-manager API, not this controller.
    ctx.query = {
      ...ctx.query,
      status: 'published',
      // Never allow relation traversal into localized draft documents.
      populate: ['privacyPdf', 'cookiePdf', 'imprintPdf'],
    };
    return super.find(ctx);
  },
}));
