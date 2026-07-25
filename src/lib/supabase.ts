import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  // Falla fuerte y claro en desarrollo en vez de un error confuso más
  // adelante al primer query. Si ves esto, faltan las variables en .env.
  throw new Error(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copiá .env.example a .env y completá.",
  );
}

// El tipo <Database> viene del archivo que generaste con
// `npx supabase gen types typescript`. Si todavía no lo pegaste en
// src/types/database.types.ts, este import va a fallar — ver README.
export const supabase = createClient<Database>(url, key);
