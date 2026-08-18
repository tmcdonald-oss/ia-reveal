-- 0003: opt-out deadline
--
-- Inclusive Access has two dates a student cares about and they are not
-- the same: the last day to opt out of the program, and the last day a
-- refund can be issued. The reveal page warned about refunds only, which
-- left students with no idea when their chance to opt out ran out.

alter table classes add column if not exists opt_out_deadline date;
