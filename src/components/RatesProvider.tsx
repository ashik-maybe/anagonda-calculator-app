import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_RATES, type Rates } from "../lib/units";
import {
  getRates,
  isDefaultRates,
  resetRates as clearPersisted,
  setRates as persistRates,
} from "../lib/rates";

type RatesContextValue = {
  readonly rates: Rates;
  readonly isCustom: boolean;
  readonly setRates: (rates: Rates) => void;
  readonly resetRates: () => void;
};

const RatesContext = createContext<RatesContextValue | null>(null);

/** SQLite-backed rates singleton. Read once at mount; every write persists + re-renders. */
export function RatesProvider({ children }: { children: ReactNode }) {
  const [rates, setRatesState] = useState<Rates>(() => getRates());

  const value: RatesContextValue = {
    rates,
    isCustom: !isDefaultRates(rates),
    setRates: (next) => {
      persistRates(next);
      setRatesState(next);
    },
    resetRates: () => {
      clearPersisted();
      setRatesState(DEFAULT_RATES);
    },
  };

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export function useRates(): RatesContextValue {
  const ctx = useContext(RatesContext);
  if (!ctx) throw new Error("useRates must be used within RatesProvider");
  return ctx;
}
