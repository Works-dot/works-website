/**
 * Publikus CV-feltöltő végpont a weboldal kapcsolat űrlapjához.
 *
 * A statikus weboldal karrier tárgyú üzenetnél ide tölti fel az önéletrajzot
 * (multipart/form-data, "file" mező). A fájl szerveroldali validálás után a
 * Strapi Médiatárba kerül "CV — ..." névvel, így az adminban könnyen kereshető.
 */

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx).toLowerCase();
}

export function registerCvUploadRoutes(strapi: any) {
  strapi.server.routes([
      {
        method: "POST",
        path: "/api/cv-upload",
        handler: async (ctx: any) => {
          const files = ctx.request.files || {};
          let file = files.file;
          if (Array.isArray(file)) file = file[0];

          if (!file) {
            ctx.status = 400;
            ctx.body = { error: "missing_file", message: "Hiányzik a feltöltendő fájl." };
            return;
          }

          const originalName = file.originalFilename || "cv";
          const ext = fileExtension(originalName);
          const mime = (file.mimetype || "").toLowerCase();

          if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
            ctx.status = 400;
            ctx.body = {
              error: "invalid_type",
              message: "Csak PDF, DOC vagy DOCX formátumú önéletrajz tölthető fel.",
            };
            return;
          }

          if (typeof file.size !== "number" || file.size <= 0 || file.size > MAX_CV_SIZE_BYTES) {
            ctx.status = 400;
            ctx.body = {
              error: "too_large",
              message: "A fájl mérete legfeljebb 10 MB lehet.",
            };
            return;
          }

          try {
            const uploaded = await strapi
              .plugin("upload")
              .service("upload")
              .upload({
                data: {
                  fileInfo: {
                    name: `CV — ${originalName}`,
                    caption: `Önéletrajz a kapcsolat űrlapról (${new Date().toISOString()})`,
                  },
                },
                files: {
                  filepath: file.filepath,
                  originalFilename: originalName,
                  mimetype: mime,
                  size: file.size,
                },
              });

            const saved = uploaded?.[0];
            if (!saved?.id) {
              throw new Error("upload service returned no file");
            }
            ctx.body = { ok: true, fileId: saved.id, url: saved.url };
          } catch (err: any) {
            strapi.log.error(`CV upload failed: ${err.stack || err.message}`);
            ctx.status = 500;
            ctx.body = {
              error: "upload_failed",
              message: "A feltöltés nem sikerült, kérjük próbáld újra később.",
            };
          }
        },
        config: { auth: false, policies: [] },
      },
  ]);
}
