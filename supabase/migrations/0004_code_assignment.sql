-- 0004: who holds each code
--
-- The pool deliberately has no student at load time, because the POS
-- assigns the buyer at checkout. But once that has happened the POS knows
-- something IA Reveal does not, and support questions ("which link is
-- mine?") and evidence packets both need it. These columns carry the
-- assignment back, with enough POS identifiers to trace any row to its
-- sale.

alter table codes add column if not exists assigned_student_name text;
alter table codes add column if not exists assigned_student_id text;
alter table codes add column if not exists assigned_email text;
alter table codes add column if not exists pos_customer_id bigint;
alter table codes add column if not exists pos_sale_item_id bigint;
alter table codes add column if not exists pos_order_number text;
alter table codes add column if not exists assignment_note text;

create index if not exists codes_assigned_student_id_idx on codes (assigned_student_id);
create index if not exists codes_pos_customer_id_idx on codes (pos_customer_id);
