import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Digunakan di frontend (client-side) atau route biasa yang tidak butuh bypass RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Digunakan khusus di backend API route untuk operasi yang butuh akses penuh (bypass RLS)
// Ini mensimulasikan perilaku Prisma sebelumnya yang punya full access ke tabel.
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
