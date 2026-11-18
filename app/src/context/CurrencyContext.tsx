import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // relative to USD (base price stored as USD in DB)
}

// Illustrative display rates, rebased from the existing estimates. Checkout charges USD.
export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',        rate: 1 },
  { code: 'EUR', symbol: '€',   name: 'Euro',             rate: 1 / 1.08 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',    rate: 0.86 / 1.08 },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', rate: 1.65 / 1.08 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (code: string) => void;
  convert: (usdPrice: number) => number;
  format: (usdPrice: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<string>('USD');

  const currency = CURRENCIES.find(c => c.code === currencyCode) ?? CURRENCIES[0];

  const setCurrency = useCallback((code: string) => {
    if (CURRENCIES.some(c => c.code === code)) {
      setCurrencyCode(code);
    }
  }, []);

  const convert = useCallback(
    (usdPrice: number) => parseFloat((usdPrice * currency.rate).toFixed(2)),
    [currency]
  );

  const format = useCallback(
    (usdPrice: number) => {
      const converted = usdPrice * currency.rate;
      return `${currency.symbol}${converted.toFixed(2)}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
