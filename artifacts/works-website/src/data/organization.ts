/**
 * Registered company identity, verified against the published /impresszum.
 * The CMS contact address is a mailing address, not the registered office.
 * Keep this identity shared across locales; contact details remain CMS-driven.
 */
export const organizationIdentity = {
  legalName: "Works. Hungary Kft.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Ménesi út 18.",
    postalCode: "1118",
    addressLocality: "Budapest",
    addressCountry: "HU",
  },
  logoPath: "/organization-logo.png",
};