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

export const OFFICE_ADDRESS = "1118 Budapest, Himfy utca 1.";
export const REGISTERED_ADDRESS = "1118 Budapest, Ménesi út 18.";

export function companyAddresses(settings?: { address?: string; registeredAddress?: string } | null) {
  // Normalize only historical spellings, not arbitrary editor-authored addresses.
  const office = settings?.address?.trim();
  return {
    office: !office || [
      "1118 Budapest Himfy utca 1.", "1118 Budapest, Himfy utca 1.",
      "1054 Budapest, Szabadság tér 7.",
    ].includes(office) ? OFFICE_ADDRESS : office,
    registered: settings?.registeredAddress?.trim() || REGISTERED_ADDRESS,
    legalName: organizationIdentity.legalName,
  };
}

export function registeredPostalAddress(settings?: { registeredAddress?: string } | null) {
  const address = settings?.registeredAddress?.trim() || REGISTERED_ADDRESS;
  const match = address.match(/^(\d{4}) ([^,]+), (.+)$/);
  if (!match) throw new Error("Registered address must use: postal code city, street number.");
  return { "@type": "PostalAddress", postalCode: match[1], addressLocality: match[2], streetAddress: match[3], addressCountry: "HU" };
}

/** Only the company's address rows, before the bank/hosting-provider sections. */
export function companyImprint(body: string, settings?: { address?: string; registeredAddress?: string } | null) {
  const addresses = companyAddresses(settings);
  const boundary = body.indexOf("\n## Banki adatok");
  if (boundary < 0) return body;
  return body.slice(0, boundary)
    .replace(/^\| Székhely \|[^\n]*$/m, `| Székhely | ${addresses.legalName}, ${addresses.registered} |`)
    .replace(/^\| (?:Levelezési cím|Iroda) \|[^\n]*$/m, `| Iroda | ${addresses.office} |`)
    + body.slice(boundary);
}