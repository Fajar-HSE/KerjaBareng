-- ─────────────────────────────────────────────────────────────
-- DirectMessage table — DM antar user
-- ─────────────────────────────────────────────────────────────
create table if not exists "DirectMessage" (
  id           uuid primary key default gen_random_uuid(),
  "senderId"   uuid not null references "Profile"(id) on delete cascade,
  "receiverId" uuid not null references "Profile"(id) on delete cascade,
  content      text not null check (char_length(content) between 1 and 2000),
  "isRead"     boolean not null default false,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);

-- Index untuk query percakapan antara dua user
create index if not exists idx_dm_sender_receiver
  on "DirectMessage"("senderId", "receiverId");

create index if not exists idx_dm_receiver_unread
  on "DirectMessage"("receiverId", "isRead")
  where "isRead" = false;

create index if not exists idx_dm_created
  on "DirectMessage"("createdAt" desc);

-- Auto-update updatedAt
create or replace function update_dm_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists trg_dm_updated_at on "DirectMessage";
create trigger trg_dm_updated_at
  before update on "DirectMessage"
  for each row execute function update_dm_updated_at();

-- RLS: aktifkan (supabaseAdmin bypass RLS via service role key)
alter table "DirectMessage" enable row level security;

-- Policy: user hanya bisa baca pesan miliknya (via service role di API, ini fallback)
create policy "dm_select_own" on "DirectMessage"
  for select using (
    auth.uid() = "senderId" or auth.uid() = "receiverId"
  );

create policy "dm_insert_own" on "DirectMessage"
  for insert with check (auth.uid() = "senderId");

create policy "dm_update_own" on "DirectMessage"
  for update using (auth.uid() = "receiverId")
  with check (auth.uid() = "receiverId");
