import React from "react";
import { Checkbox, Field, Flex, Typography } from "@strapi/design-system";

export function ImageEditorialFields({ asset, values, setFieldValue, disabled }: any) {
  const image = asset?.mime?.startsWith("image/") || asset?.type === "image";
  if (!image) return null;
  return <Flex direction="column" alignItems="stretch" gap={2} paddingTop={2} paddingBottom={2}>
    <Field.Root name="decorative">
      <Checkbox checked={values.decorative === true} disabled={disabled} onCheckedChange={(checked: boolean) => {
        setFieldValue("decorative", checked === true);
        if (checked === true) setFieldValue("alternativeText", "");
      }}>Díszítő kép</Checkbox>
    </Field.Root>
    <Typography variant="pi" textColor="neutral600">
      Díszítő képnél az alt üres. Ez a médiatári kép minden használatára érvényes; eltérő szerephez használj külön példányt.
    </Typography>
  </Flex>;
}

export function validateImageEditorialForm(asset: any, values: any) {
  const image = asset?.mime?.startsWith("image/") || asset?.type === "image";
  return image && values.decorative !== true && !values.alternativeText?.trim()
    ? { alternativeText: "Adj alt szöveget, vagy jelöld Díszítő képként." } : {};
}

export function missingImageAlternatives(assets: any[]) {
  return assets.some(asset => (asset.mime?.startsWith("image/") || asset.type === "image") && asset.decorative !== true && !asset.alternativeText?.trim());
}
