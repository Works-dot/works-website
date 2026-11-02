import { AsyncLocalStorage } from "node:async_hooks";
import { errors } from "@strapi/utils";

const FILE_UID = "plugin::upload.file";
const uploadContext = new AsyncLocalStorage<{ decorative: boolean; alternativeText: string }>();
export function isImage(file: any) {
  return String(file?.mime ?? file?.detectedMimeType ?? file?.mimetype ?? "").startsWith("image/") ||
    /\.(avif|bmp|gif|heic|jpe?g|png|svg|tiff?|webp)$/i.test(file?.originalFilename ?? file?.name ?? "");
}
export function validateImageInfo(info: any, file: any, previous?: any) {
  const merged = { ...previous, ...info };
  if (!isImage(file)) return merged;
  if (merged.decorative != null && typeof merged.decorative !== "boolean") {
    throw new errors.ValidationError("A Díszítő kép jelölés logikai érték legyen.");
  }
  const decorative = merged.decorative === true;
  const alt = typeof merged.alternativeText === "string" ? merged.alternativeText.trim() : "";
  if (!decorative && !alt) {
    throw new errors.ValidationError("A képhez adj alt szöveget, vagy jelöld Díszítő képként.", {
      errors: [{ path: ["alternativeText"], message: "Alt szöveg vagy Díszítő kép jelölés szükséges.", name: "ValidationError" }],
    });
  }
  return { ...merged, decorative, alternativeText: decorative ? "" : alt };
}

export function extendUploadWithEditorialRules(plugin: any) {
  plugin.contentTypes.file.schema.attributes.decorative = {
    type: "boolean", default: false, configurable: false,
  };
  const originalUpload = plugin.services.upload;
  plugin.services.upload = (args: any) => {
    const service = originalUpload(args);
    return {
      ...service,
      async upload({ data = {}, files }: any, opts: any) {
        const list = Array.isArray(files) ? files : [files];
        const infos = Array.isArray(data.fileInfo) ? data.fileInfo : [data.fileInfo ?? {}];
        // Validate every image before any provider writes in a batch.
        const normalized = list.map((file, index) => validateImageInfo(infos[index] ?? {}, file));
        const completed: any[] = [];
        try {
          for (const [index, file] of list.entries()) {
            const info = normalized[index];
            const rows = await uploadContext.run(info, () => service.upload({ data: { ...data, fileInfo: info }, files: file }, opts));
            completed.push(...rows);
          }
          return completed;
        } catch (error) {
          // Do not leave successful earlier items behind after a rejected batch.
          for (const row of completed) await service.remove(row);
          throw error;
        }
      },
      async updateFileInfo(id: any, info: any, opts: any) {
        const previous = await service.findOne(id);
        if (!previous) throw new errors.NotFoundError();
        const normalized = validateImageInfo(info, previous, previous);
        return uploadContext.run(normalized, () => service.updateFileInfo(id, normalized, opts));
      },
      async replace(id: any, { data = {}, file }: any, opts: any) {
        const previous = await service.findOne(id);
        if (!previous) throw new errors.NotFoundError();
        const normalized = validateImageInfo(data.fileInfo ?? {}, isImage(file) ? file : previous, previous);
        // Validation occurs before the stock replacement deletes old bytes.
        return uploadContext.run(normalized, () => service.replace(id, { data: { ...data, fileInfo: normalized }, file }, opts));
      },
    };
  };
  const originalProvider = plugin.services.provider;
  plugin.services.provider = (args: any) => {
    const provider = originalProvider(args);
    return {
      ...provider,
      async upload(file: any) {
        // Actual detected image type is known here, before bytes are persisted.
        if (isImage(file)) validateImageInfo(uploadContext.getStore() ?? file, file);
        return provider.upload(file);
      },
    };
  };
  const originalBootstrap = plugin.bootstrap;
  plugin.bootstrap = async (args: any) => {
    await originalBootstrap?.(args);
    const { strapi } = args;
    strapi.db.lifecycles.subscribe({
      models: [FILE_UID],
      async beforeCreate(event: any) {
        const data = event.params.data;
        const normalized = validateImageInfo({ ...data, ...uploadContext.getStore() }, data);
        if (isImage(data)) Object.assign(data, { decorative: normalized.decorative, alternativeText: normalized.alternativeText });
      },
      async beforeUpdate(event: any) {
        const previous = await strapi.db.query(FILE_UID).findOne({ where: event.params.where });
        if (!previous) return;
        const data = event.params.data;
        const normalized = validateImageInfo({ ...data, ...uploadContext.getStore() }, { ...previous, ...data }, previous);
        if (isImage({ ...previous, ...data })) Object.assign(data, { decorative: normalized.decorative, alternativeText: normalized.alternativeText });
      },
      beforeCreateMany() {
        throw new errors.ValidationError("Képeket a médiatár feltöltési folyamatán keresztül adj hozzá.");
      },
      beforeUpdateMany(event: any) {
        if (["alternativeText", "decorative", "mime"].some(key => Object.hasOwn(event.params.data, key))) {
          throw new errors.ValidationError("A képek alt szövegét és díszítő jelölését képenként módosítsd.");
        }
      },
    });
  };
  return plugin;
}
