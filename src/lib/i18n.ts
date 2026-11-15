import { Fragment, createElement, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import bn from "../i18n/bn.json";
import en from "../i18n/en.json";

export type Locale = "bn" | "en";
type Dict = Record<string, string>;

const dicts: Record<Locale, Dict> = { bn: bn as Dict, en: en as Dict };

let current: Locale = "bn";
const subs = new Set<() => void>();

export function setLocale(locale: Locale): void {
  current = locale;
  subs.forEach((fn) => fn());
}

export function useLocale(): Locale {
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => current,
  );
  return current;
}

export function t(key: string): string {
  return dicts[current][key] ?? dicts.en[key] ?? key;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  useLocale();
  return createElement(Fragment, null, children);
}
