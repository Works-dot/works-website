import React, { Fragment, useMemo, type ReactNode } from "react";
import { useI18n } from "@/i18n";
import {
  splitTerminologyText,
  type TerminologyLocale,
} from "@/lib/terminology";

export interface TermTextProps {
  children: string;
  locale?: TerminologyLocale;
}

/**
 * Marks known English terms without changing the visible copy. Acronyms keep
 * their visible text in the accessibility name and receive one localized,
 * visually-hidden expansion per TermText call.
 */
export function TermText({ children, locale }: TermTextProps): ReactNode {
  let contextLocale: TerminologyLocale = "hu";
  try {
    contextLocale = useI18n().locale;
  } catch (error) {
    // An explicit locale makes this primitive useful in isolated SSR/tests
    // too; without one, preserve the provider's required-context behaviour.
    if (!locale) throw error;
  }

  const activeLocale = locale ?? contextLocale;
  const parts = useMemo(
    () => splitTerminologyText(children, activeLocale),
    [children, activeLocale],
  );

  if (parts.length === 1 && parts[0]?.type === "text") {
    return children;
  }
  const definitions = parts.flatMap(part =>
    part.type === "term" && part.acronym && part.definition && !part.expansionAlreadyPresent
      ? [part.definition]
      : [],
  );

  return (
    <span data-terminology="">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <Fragment key={`text-${index}`}>{part.value}</Fragment>;
        }

        return (
          <Fragment key={`term-${part.termKey ?? index}-${index}`}>
            <span lang="en">{part.value}</span>
            {part.suffix}
          </Fragment>
        );
      })}
      {definitions.length > 0 && (
        <span className="sr-only"> ({definitions.join("; ")})</span>
      )}
    </span>
  );
}
