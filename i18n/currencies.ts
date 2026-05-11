export type CurrencyEntry = { code: string; symbol: string; label: string };

export const SUPPORTED_CURRENCIES: CurrencyEntry[] = [
  { code: "USD", symbol: "$",    label: "US Dollar (USD)" },
  { code: "EUR", symbol: "€",    label: "Euro (EUR)" },
  { code: "GBP", symbol: "£",    label: "British Pound (GBP)" },
  { code: "JPY", symbol: "¥",    label: "Japanese Yen (JPY)" },
  { code: "CAD", symbol: "CA$",  label: "Canadian Dollar (CAD)" },
  { code: "AUD", symbol: "A$",   label: "Australian Dollar (AUD)" },
  { code: "CHF", symbol: "Fr",   label: "Swiss Franc (CHF)" },
  { code: "CNY", symbol: "¥",    label: "Chinese Yuan (CNY)" },
  { code: "INR", symbol: "₹",    label: "Indian Rupee (INR)" },
  { code: "BRL", symbol: "R$",   label: "Brazilian Real (BRL)" },
  { code: "MXN", symbol: "MX$",  label: "Mexican Peso (MXN)" },
  { code: "KRW", symbol: "₩",    label: "South Korean Won (KRW)" },
  { code: "SGD", symbol: "S$",   label: "Singapore Dollar (SGD)" },
  { code: "HKD", symbol: "HK$",  label: "Hong Kong Dollar (HKD)" },
  { code: "NOK", symbol: "kr",   label: "Norwegian Krone (NOK)" },
  { code: "SEK", symbol: "kr",   label: "Swedish Krona (SEK)" },
  { code: "DKK", symbol: "kr",   label: "Danish Krone (DKK)" },
  { code: "NZD", symbol: "NZ$",  label: "New Zealand Dollar (NZD)" },
  { code: "ZAR", symbol: "R",    label: "South African Rand (ZAR)" },
  { code: "TRY", symbol: "₺",    label: "Turkish Lira (TRY)" },
  { code: "RUB", symbol: "₽",    label: "Russian Ruble (RUB)" },
  { code: "AED", symbol: "د.إ",  label: "UAE Dirham (AED)" },
  { code: "THB", symbol: "฿",    label: "Thai Baht (THB)" },
  { code: "IDR", symbol: "Rp",   label: "Indonesian Rupiah (IDR)" },
  { code: "MYR", symbol: "RM",   label: "Malaysian Ringgit (MYR)" },
  { code: "PHP", symbol: "₱",    label: "Philippine Peso (PHP)" },
  { code: "VND", symbol: "₫",    label: "Vietnamese Dong (VND)" },
  { code: "ETB", symbol: "Br",   label: "Ethiopian Birr (ETB)" },
  { code: "KES", symbol: "KSh",  label: "Kenyan Shilling (KES)" },
  { code: "PLN", symbol: "zł",   label: "Polish Złoty (PLN)" },
  { code: "HUF", symbol: "Ft",   label: "Hungarian Forint (HUF)" },
  { code: "CZK", symbol: "Kč",   label: "Czech Koruna (CZK)" },
  { code: "RON", symbol: "lei",  label: "Romanian Leu (RON)" },
  { code: "ILS", symbol: "₪",    label: "Israeli Shekel (ILS)" },
  { code: "UAH", symbol: "₴",    label: "Ukrainian Hryvnia (UAH)" },
  { code: "SAR", symbol: "﷼",   label: "Saudi Riyal (SAR)" },
  { code: "TWD", symbol: "NT$",  label: "Taiwan Dollar (TWD)" },
  { code: "CLP", symbol: "CL$",  label: "Chilean Peso (CLP)" },
  { code: "COP", symbol: "CO$",  label: "Colombian Peso (COP)" },
  { code: "PKR", symbol: "₨",    label: "Pakistani Rupee (PKR)" },
  { code: "BDT", symbol: "৳",    label: "Bangladeshi Taka (BDT)" },
  { code: "NGN", symbol: "₦",    label: "Nigerian Naira (NGN)" },
  { code: "EGP", symbol: "E£",   label: "Egyptian Pound (EGP)" },
  { code: "GHS", symbol: "₵",    label: "Ghanaian Cedi (GHS)" },
  { code: "MAD", symbol: "د.م.", label: "Moroccan Dirham (MAD)" },
];

// Currencies that show 0 decimal places
const NO_DECIMALS = new Set(["JPY", "KRW", "VND", "IDR", "HUF", "CLP", "COP", "BDT"]);

// Currencies where the symbol goes after the number
const SYMBOL_AFTER = new Set(["NOK", "SEK", "DKK", "PLN", "HUF", "CZK", "RON"]);

const SYMBOL_MAP: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.symbol])
);

export function getCurrencySymbol(code: string): string {
  return SYMBOL_MAP[code] ?? "$";
}

export function fmtCurrency(n: number, code: string): string {
  const symbol = SYMBOL_MAP[code] ?? "$";
  const decimals = NO_DECIMALS.has(code) ? 0 : 2;
  const formatted = n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return SYMBOL_AFTER.has(code) ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}
