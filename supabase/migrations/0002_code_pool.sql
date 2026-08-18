-- 0002: code pool
--
-- The original model binds every code to a named student at import time.
-- That works when we mail the links ourselves, but not when the POS sells
-- the item: at load time we do not know who the buyer will be.
--
-- This adds a pool of codes that carry a reveal token but no student. The
-- POS holds the URL and assigns it to a customer at the point of sale, so
-- the POS is the system of record for identity. IA Reveal remains the
-- system of record for whether and when the code was revealed.

create table if not exists codes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete set null,
  ean text,
  code text not null,
  reveal_token text not null unique,
  status text not null default 'available',
  batch_label text,
  -- Traceability back to the row this code came from in the POS.
  pos_host text,
  pos_product_id bigint,
  pos_access_code_id bigint,
  notes text,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  constraint codes_status_check
    check (status in ('available', 'issued', 'revealed', 'void'))
);

-- One pool row per POS access code row, so re-importing a batch cannot
-- silently create duplicate URLs for the same underlying code.
create unique index if not exists codes_pos_unique_idx
  on codes (pos_host, pos_access_code_id)
  where pos_access_code_id is not null;

create index if not exists codes_class_id_idx on codes (class_id);
create index if not exists codes_reveal_token_idx on codes (reveal_token);
create index if not exists codes_status_idx on codes (status);

-- reveal_events now hangs off either a student or a pool code, never both.
alter table reveal_events
  add column if not exists code_id uuid references codes(id) on delete cascade;

alter table reveal_events alter column student_id drop not null;

do $$
begin
  alter table reveal_events add constraint reveal_events_subject_check
    check (num_nonnulls(student_id, code_id) = 1);
exception
  when duplicate_object then null;
end $$;

create index if not exists reveal_events_code_id_idx on reveal_events (code_id);

alter table codes enable row level security;

drop policy if exists "admins manage codes" on codes;
create policy "admins manage codes"
  on codes for all
  to authenticated
  using (true)
  with check (true);

-- Mirrors student_reveal_status so the admin screens can treat both the
-- same way.
create or replace view code_reveal_status as
select
  c.id as code_id,
  c.class_id,
  c.ean,
  c.status,
  c.batch_label,
  c.pos_host,
  c.pos_product_id,
  c.pos_access_code_id,
  (select min(revealed_at) from reveal_events e where e.code_id = c.id) as first_revealed_at,
  (select max(revealed_at) from reveal_events e where e.code_id = c.id) as last_revealed_at,
  (select count(*) from reveal_events e where e.code_id = c.id) as reveal_count
from codes c;
