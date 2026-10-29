// Explicitly approved company-address correction. No document publication:
// draft and published scalar rows are corrected independently, preserving drafts.
const OFFICE = "1118 Budapest, Himfy utca 1.";
const REGISTERED = "1118 Budapest, Ménesi út 18.";
const KEY = "company-addresses-canonical";

export function addressPatch(kind: string, row: any) {
  if (!["hu", "en"].includes(row.locale)) return {};
  if (kind === "global") {
    const data: any = {};
    if (row.address !== OFFICE) data.address = OFFICE;
    if (row.registeredAddress !== REGISTERED) data.registeredAddress = REGISTERED;
    return data;
  }
  if (row.locale !== "hu" || !row.imprintBody) return {};
  const end = row.imprintBody.indexOf("\n## Banki adatok");
  if (end < 0) throw new Error("Company address migration: unrecognized imprint structure");
  const head = row.imprintBody.slice(0, end);
  if (!/^\| Székhely \|[^\n]*$/m.test(head) ||
      !/^\| (?:Iroda|Levelezési cím) \|[^\n]*$/m.test(head)) {
    throw new Error("Company address migration: missing company address rows");
  }
  const body = head
    .replace(/^\| Székhely \|[^\n]*$/m, `| Székhely | Works. Hungary Kft., ${REGISTERED} |`)
    .replace(/^\| (?:Iroda|Levelezési cím) \|[^\n]*$/m, `| Iroda | ${OFFICE} |`)
    + row.imprintBody.slice(end);
  return body === row.imprintBody ? {} : { imprintBody: body };
}

export async function migrateCompanyAddresses(strapi: any) {
  const db = strapi.db.connection;
  const schema = strapi.config.get("database.connection.connection.schema", "strapi");
  // Ledger and before-values commit atomically with content. Replica startups
  // serialize on the advisory lock. A failure rolls back everything and retries
  // on next boot; later editor changes are not overwritten on every restart.
  await db.transaction(async (trx: any) => {
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [KEY]);
    const ledger = "company_address_migration_history";
    if (!await trx.schema.withSchema(schema).hasTable(ledger)) {
      await trx.schema.withSchema(schema).createTable(ledger, (t: any) => {
        t.string("key").primary();
        t.jsonb("before_values").notNullable();
        t.timestamp("completed_at").defaultTo(trx.fn.now());
      });
    }
    if (await trx.withSchema(schema).table(ledger).where({ key: KEY }).first()) return;
    const backup: any[] = [];
    for (const [kind, uid, fields] of [
      ["global", "api::global-setting.global-setting", ["address", "registeredAddress"]],
      ["legal", "api::legal-document.legal-document", ["imprintBody"]],
    ] as const) {
      const meta = strapi.db.metadata.get(uid);
      const columns = Object.fromEntries(["id", "locale", ...fields].map(f => [f, meta.attributes[f].columnName]));
      const rows = await trx.withSchema(schema).table(meta.tableName).select("*").forUpdate();
      for (const raw of rows) {
        const row = Object.fromEntries(Object.entries(columns).map(([f, c]) => [f, raw[c as string]]));
        const patch = addressPatch(kind, row);
        if (!Object.keys(patch).length) continue;
        backup.push({ table: meta.tableName, id: row.id,
          before: Object.fromEntries(Object.keys(patch).map(f => [columns[f], row[f]])) });
        await trx.withSchema(schema).table(meta.tableName).where({ id: row.id })
          .update(Object.fromEntries(Object.entries(patch).map(([f, value]) => [columns[f], value])));
      }
    }
    await trx.withSchema(schema).table(ledger).insert({ key: KEY, before_values: JSON.stringify(backup) });
    strapi.log.info(`Company addresses corrected: ${backup.length} rows; before-values saved in migration ledger`);
  });
}
