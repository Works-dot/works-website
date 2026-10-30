export const employmentTypes: string[];
export interface JobFields {
  isActive?: boolean | null;
  originalPublishedAt?: string | null;
  validThrough?: string | null;
  employmentType?: string | null;
  streetAddress?: string | null;
  postalCode?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  addressCountry?: string | null;
}
export function jobIso(value: unknown): string | null;
export function isOpenJob(job: (JobFields & { publishedAt?: string | null }) | null | undefined, now?: number): boolean;
export function jobFields(job: JobFields): JobFields;
export function jobLocationLabel(job: JobFields): string;
export function jobTypeLabel(type?: string | null, locale?: string): string;
export function missingJobFields(job: any): string[];
export function jobSchema(job: any, options: {url: string; locale: string; organization: object}, now?: number): object | null;
