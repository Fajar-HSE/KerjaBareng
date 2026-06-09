import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Digunakan di frontend (client-side) atau route biasa yang tidak butuh bypass RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Digunakan khusus di backend API route untuk operasi yang butuh akses penuh (bypass RLS)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey && typeof window === "undefined") {
  // Tampilkan warning di server startup — jangan crash production, tapi log jelas
  console.warn(
    "[supabase] SUPABASE_SERVICE_ROLE_KEY tidak di-set. " +
    "supabaseAdmin akan menggunakan anon key — operasi yang butuh bypass RLS akan gagal!"
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey ?? supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);
