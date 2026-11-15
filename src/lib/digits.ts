const bangla = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;
const latin = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => bangla[Number(d)]);
}

export function fromAnyDigits(input: string): string {
  const map: Record<string, string> = Object.fromEntries(bangla.map((b, i) => [b, latin[i]]));
  return input.replace(/[০-৯]/g, (c) => map[c] ?? c);
}

function groupFromRight(intPart: string, firstGroupSize: number): string {
  if (intPart.length <= firstGroupSize) return intPart;
  const head = intPart.slice(0, intPart.length - firstGroupSize);
  const tail = intPart.slice(intPart.length - firstGroupSize);
  let grouped = "";
  for (let i = head.length; i > 0; i -= 2) {
    const start = Math.max(0, i - 2);
    const chunk = head.slice(start, i);
    grouped = grouped === "" ? chunk : `${chunk},${grouped}`;
  }
  return `${grouped},${tail}`;
}

/**
 * South Asian lakh-style grouping for the integer part of a digit string
 * (rightmost 3 digits, then pairs of 2): "1234567" -> "12,34,567".
 * Script-agnostic: works on Latin or Bangla digits alike; the decimal
 * part is passed through untouched. en UI uses plain western grouping.
 */
export function groupLakh(digits: string): string {
  const [intPart, fracPart] = digits.split(".");
  const grouped = groupFromRight(intPart, 3);
  // groupFromRight chunks the head in pairs of 2, which is lakh style.
  return fracPart === undefined ? grouped : `${grouped}.${fracPart}`;
}

/** Western 3-digit grouping: "1234567" -> "1,234,567". */
export function groupWestern(digits: string): string {
  const [intPart, fracPart] = digits.split(".");
  if (intPart.length <= 3) {
    return fracPart === undefined ? intPart : `${intPart}.${fracPart}`;
  }
  let grouped = "";
  for (let i = intPart.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    const chunk = intPart.slice(start, i);
    grouped = grouped === "" ? chunk : `${chunk},${grouped}`;
  }
  return fracPart === undefined ? grouped : `${grouped}.${fracPart}`;
}

/** Locale-aware integer grouping for already-rendered digit strings. */
export function groupDigits(digits: string, locale: "bn" | "en"): string {
  return locale === "bn" ? groupLakh(digits) : groupWestern(digits);
}
