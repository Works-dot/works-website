/**
 * Narrow adapters for the installed Strapi editor/media dialogs.
 * All replacements fail the build if upstream source contracts change.
 */
export function editorialAdapter(fieldsPath: string) {
  function replace(source: string, from: string | RegExp, to: string, id: string) {
    const next = source.replace(from, to);
    if (next === source) throw new Error(`Strapi editorial adapter incompatible: ${id}`);
    return next;
  }
  return {
    name: "works-editorial-rules",
    enforce: "pre" as const,
    transform(source: string, id: string) {
      const modulePath = id.split("?")[0];
      if (!modulePath.includes("/@strapi/")) return;
      if (modulePath.endsWith("/Wysiwyg/WysiwygNav.mjs")) {
        return replace(source, /\/\*#__PURE__\*\/ jsx\(SingleSelectOption, \{\s+value: "h1",[\s\S]*?\n                        \}\),\n/, "", id);
      }
      if (modulePath.endsWith("/EditAssetDialog/EditAssetContent.mjs")) {
        let next = `import { ImageEditorialFields, validateImageEditorialForm } from ${JSON.stringify(fieldsPath)};\n${source}`;
        next = replace(next, "alternativeText: asset?.alternativeText ?? undefined,", "alternativeText: asset?.alternativeText ?? undefined,\n        decorative: asset?.decorative === true,", id);
        next = replace(next, "validationSchema: fileInfoSchema,", "validationSchema: fileInfoSchema,\n        validate: (values) => validateImageEditorialForm(asset, values),", id);
        next = replace(next, "!omitFields?.includes('alternativeText') &&", "jsx(ImageEditorialFields, {asset, values, setFieldValue, disabled: formDisabled}),\n                                                    !omitFields?.includes('alternativeText') &&", id);
        next = replace(next, "value: values.alternativeText,\n                                                                onChange: handleChange,\n                                                                disabled: formDisabled,", "value: values.alternativeText,\n                                                                onChange: handleChange,\n                                                                disabled: formDisabled || values.decorative === true,", id);
        return next;
      }
      if (modulePath.endsWith("/hooks/useEditAsset.mjs") || modulePath.endsWith("/hooks/useUpload.mjs")) {
        return replace(source, "alternativeText: asset.alternativeText,", "alternativeText: asset.alternativeText,\n            decorative: asset.decorative === true,", id);
      }
      if (modulePath.endsWith("/PendingAssetStep/PendingAssetStep.mjs")) {
        let next = `import { missingImageAlternatives } from ${JSON.stringify(fieldsPath)};\n${source}`;
        next = replace(next, "e.stopPropagation();", `e.stopPropagation();
        if (missingImageAlternatives(assets)) {
            window.alert("Minden képhez adj alt szöveget vagy Díszítő kép jelölést. A képkártya szerkesztés gombjával állíthatod be.");
            return;
        }`, id);
        return next;
      }
    },
  };
}
