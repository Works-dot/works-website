import React, { forwardRef } from "react";
import { useField } from "@strapi/strapi/admin";
import { Field, Textarea } from "@strapi/design-system";

export const EditorialText = forwardRef<HTMLTextAreaElement, any>(function EditorialText(props, ref) {
  const field = useField<string>(props.name);
  const isDescription = props.name.split(".").at(-1) === "metaDescription";
  const value = field.value ?? "";
  const length = value.length;
  const tooLong = isDescription && length > 160;
  const hint = isDescription ? <>{length}/160 karakter{tooLong ? " – rövidítsd a szöveget a mentéshez." : ""}{props.hint && <> · {props.hint}</>}</> : props.hint;
  return <Field.Root name={props.name} required={props.required} hint={hint} error={tooLong ? "Legfeljebb 160 karakter menthető." : field.error}>
    <Field.Label action={props.labelAction}>{props.label}</Field.Label>
    <Textarea ref={ref} value={value} onChange={field.onChange} disabled={props.disabled} placeholder={props.placeholder} />
    <Field.Hint />
    <Field.Error />
  </Field.Root>;
});
