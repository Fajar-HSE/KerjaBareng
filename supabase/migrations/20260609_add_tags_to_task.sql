-- Tambah kolom tags ke tabel Task (jika belum ada)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Tambah kolom isActive ke tabel Profile (jika belum ada)  
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
