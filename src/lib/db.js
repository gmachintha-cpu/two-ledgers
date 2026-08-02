import { supabase } from "./supabaseClient";

const TABLES = [
  "users",
  "accounts",
  "vehicles",
  "categories",
  "transactions",
  "budgets",
  "opening_balances",
  "fuel_logs",
  "subscriptions",
  "quick_tiles",
];

// Fetches every table in one go on app load. Returns an object keyed by
// table name, e.g. { users: [...], transactions: [...] }.
export async function fetchAllTables() {
  const results = await Promise.all(TABLES.map((t) => supabase.from(t).select("*")));
  const out = {};
  results.forEach((res, i) => {
    const table = TABLES[i];
    if (res.error) {
      console.error(`Supabase fetch failed for "${table}":`, res.error.message);
      out[table] = [];
    } else {
      out[table] = res.data;
    }
  });
  return out;
}

// Inserts a row and returns the DB-generated row (with its real uuid).
export async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) {
    console.error(`Supabase insert failed for "${table}":`, error.message);
    return null;
  }
  return data;
}

export async function updateRow(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single();
  if (error) {
    console.error(`Supabase update failed for "${table}":`, error.message);
    return null;
  }
  return data;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    console.error(`Supabase delete failed for "${table}":`, error.message);
    return false;
  }
  return true;
}

// Opening balances have a unique (user_id, month) constraint — upsert on that
// so editing an already-confirmed month updates it instead of duplicating.
export async function upsertOpeningBalance(row) {
  const { data, error } = await supabase
    .from("opening_balances")
    .upsert(row, { onConflict: "user_id,month" })
    .select()
    .single();
  if (error) {
    console.error("Supabase upsert failed for \"opening_balances\":", error.message);
    return null;
  }
  return data;
}
