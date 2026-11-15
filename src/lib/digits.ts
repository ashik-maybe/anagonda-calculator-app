const bangla = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;
const latin = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => bangla[Number(d)]);
}

export function fromAnyDigits(input: string): string {
  const map: Record<string, string> = Object.fromEntries(bangla.map((b, i) => [b, latin[i]]));
  return input.replace(/[০-৯]/g, (c) => map[c] ?? c);
}
