import { useEffect, useState } from "react";

export const CURRENCIES = [
  { code: "NPR", symbol: "Rs.", label: "Nepali Rupee" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "QAR", symbol: "﷼", label: "Qatari Riyal" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

const KEY = "expense_currency";
const EVT = "expense_currency_change";

export const getCurrencyCode = (): string => {
  if (typeof window === "undefined") return "USD";
  return localStorage.getItem(KEY) ?? "USD";
};

export const setCurrencyCode = (code: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, code);
  window.dispatchEvent(new CustomEvent(EVT, { detail: code }));
};

export const currencyInfo = (code: string) =>
  CURRENCIES.find(c => c.code === code) ?? CURRENCIES[4];

export const formatMoney = (n: number, code?: string) => {
  const c = currencyInfo(code ?? getCurrencyCode());
  const decimals = c.code === "JPY" ? 0 : 2;
  return `${c.symbol}${Number(n).toFixed(decimals)}`;
};

export function useCurrency() {
  const [code, setCode] = useState<string>(getCurrencyCode);
  useEffect(() => {
    const onChange = () => setCode(getCurrencyCode());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const info = currencyInfo(code);
  const decimals = info.code === "JPY" ? 0 : 2;
  return {
    code,
    setCode: setCurrencyCode,
    symbol: info.symbol,
    label: info.label,
    decimals,
    format: (n: number) => `${info.symbol}${Number(n).toFixed(decimals)}`,
  };
}
