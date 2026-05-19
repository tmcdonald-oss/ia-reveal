-- IA Reveal schema
-- Apply this in the Supabase SQL editor on a fresh project.

-- =====================================================
-- Tables
-- =====================================================

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  school text not null,
  course text not null,
  section text,
  instructor text,
  term text not null,
  start_date date not null,
  drop_deadline date not null,
  publisher text,
  redemption_url text,
  redemption_instructions text,
  redemption_button_label text,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  country text default 'US',
  zip text,
  phone text,
  isbn text,
  condition text,
  price numeric(10, 2),
  code text not null,
  reveal_token text not null unique,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists reveal_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  revealed_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  is_first_reveal boolean not null default false
);

create index if not exists students_class_id_idx on students(class_id);
create index if not exists students_reveal_token_idx on students(reveal_token);
create index if not exists reveal_events_student_id_idx on reveal_events(student_id);
create index if not exists reveal_events_revealed_at_idx on reveal_events(revealed_at);

-- =====================================================
-- Row Level Security
-- =====================================================

alter table classes enable row level security;
alter table students enable row level security;
alter table reveal_events enable row level security;

-- Admins (authenticated users) have full access.
-- The reveal page uses the service role key on the server to look up by token,
-- so we deliberately do NOT grant anon read access to students.

drop policy if exists "admins manage classes" on classes;
create policy "admins manage classes"
  on classes for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admins manage students" on students;
create policy "admins manage students"
  on students for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admins manage reveal_events" on reveal_events;
create policy "admins manage reveal_events"
  on reveal_events for all
  to authenticated
  using (true)
  with check (true);

-- =====================================================
-- Convenience view: latest reveal per student
-- =====================================================

create or replace view student_reveal_status as
select
  s.id as student_id,
  s.class_id,
  s.first_name,
  s.last_name,
  s.email,
  s.student_id as bookstore_student_id,
  (
    select min(revealed_at) from reveal_events e
    where e.student_id = s.id
  ) as first_revealed_at,
  (
    select max(revealed_at) from reveal_events e
    where e.student_id = s.id
  ) as last_revealed_at,
  (
    select count(*) from reveal_events e
    where e.student_id = s.id
  ) as reveal_count
from students s;
