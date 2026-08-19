/**
 * context.tsx — Lightweight i18n provider and hook.
 *
 * - Active locale is hardcoded to DEFAULT_LOCALE ("hu") today.
 * - SSR/hydration safe: no client-only state involved; the locale is constant.
 * - Named interpolation: t("states.clientLabel", { client: "Acme" })
 *   replaces {{client}} → "Ügyfél: Acme".
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n-routes";
import { MESSAGES, type Messages } from "./messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Interpolations = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  /** Translate a dot-path key, optionally interpolating {{name}} placeholders. */
  t: (key: string, vars?: Interpolations) => string;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const I18nContext = createContext<I18nContextValue | null>(null);

// ---------------------------------------------------------------------------
// Interpolation helper
// ---------------------------------------------------------------------------

function interpolate(template: string, vars?: Interpolations): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ---------------------------------------------------------------------------
// Resolver: dot-path access into the message tree
// ---------------------------------------------------------------------------

function resolvePath(obj: unknown, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path; // fallback: return the key itself
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === "string") return current;
  return path; // fallback: return the key itself
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface I18nProviderProps {
  children: ReactNode;
  /** Override locale (for future use / tests). Defaults to DEFAULT_LOCALE. */
  locale?: Locale;
}

export function I18nProvider({ children, locale = DEFAULT_LOCALE }: I18nProviderProps) {
  const messages = MESSAGES[locale];

  const t = (key: string, vars?: Interpolations): string => {
    const raw = resolvePath(messages, key);
    return interpolate(raw, vars);
  };

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
