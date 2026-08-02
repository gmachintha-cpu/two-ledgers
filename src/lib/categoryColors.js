// Fixed color per top-level expense category so the donut chart and legend
// stay consistent across renders (not assigned by array index, which would
// shift colors around whenever categories are added/removed).
export const CATEGORY_COLORS = {
  c10: "#EF9F27", // Housing & Utilities — amber
  c10a: "#C97B2E", // Rent — burnt amber
  c11: "#639922", // Groceries — green
  c12: "#D85A30", // Child — coral
  c13: "#378ADD", // Vehicles — blue
  c14: "#993556", // Dining Out — pink
  c15: "#B08A3E", // Subscriptions — gold
  c16: "#7F77DD", // Healthcare — purple
  c17: "#5DCAA5", // Personal — teal
  c18: "#A32D2D", // Pawning / Loan Interest — red
  c19: "#04342C", // Savings & Investment — dark teal
  c20: "#F0997B", // Gifts & Occasions — light coral
  c21: "#888780", // Miscellaneous — gray
  c22: "#2E8B7A", // Transport — deep teal
};

export function colorForCategory(categoryId) {
  return CATEGORY_COLORS[categoryId] ?? "#888780";
}
