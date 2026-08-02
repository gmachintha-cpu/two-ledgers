// This is a per-device preference, not household data — Husband's phone and
// Wife's phone should each remember their own default, so it lives in
// localStorage rather than the database. That's the whole point of it.
const KEY = "two-ledgers:default-payer-id";

export function getDefaultPayerId() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setDefaultPayerId(userId) {
  try {
    if (userId) {
      localStorage.setItem(KEY, userId);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    // Storage unavailable (private browsing etc) — fail silently, form still works with manual selection.
  }
}
