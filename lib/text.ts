/** Fold Arabic and Persian spellings together so keyword matching survives yeh/kaf variants. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesTerm(haystack: string, needle: string): boolean {
  const q = normalize(haystack);
  const k = normalize(needle);
  if (!k) return false;
  if (k.length <= 4) {
    return new RegExp(`(?:^|\\s)${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(q);
  }
  return q.includes(k);
}
