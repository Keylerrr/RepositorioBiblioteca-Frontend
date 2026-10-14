export function clampPage(page, totalPages) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const safePage = Number.isFinite(Number(page)) ? Number(page) : 1;
  return Math.min(Math.max(1, Math.trunc(safePage)), safeTotal);
}

export function sanitizePageValue(value, totalPages) {
  const safeTotal = Math.max(1, Number(totalPages) || 1);
  const trimmed = String(value ?? "").trim();

  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, page: null };
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > safeTotal) {
    return { valid: false, page: null };
  }

  return { valid: true, page: parsed };
}
