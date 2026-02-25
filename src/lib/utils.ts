const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars (0/O, 1/I)

export function generateCode(prefix: string, length: number): string {
  const randomPart = Array.from({ length }, () =>
    CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  ).join("");

  return prefix ? `${prefix}-${randomPart}` : randomPart;
}

export function generateBatchCodes(
  prefix: string,
  length: number,
  count: number
): string[] {
  const codes = new Set<string>();

  // Safety limit to prevent infinite loop
  let attempts = 0;
  const maxAttempts = count * 10;

  while (codes.size < count && attempts < maxAttempts) {
    codes.add(generateCode(prefix, length));
    attempts++;
  }

  return Array.from(codes);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
