import { createServiceClient } from '@/lib/supabase/server';

export type RevealClass = {
  course: string;
  section: string | null;
  instructor: string | null;
  school: string;
  term: string;
  drop_deadline: string;
  publisher: string | null;
  redemption_url: string | null;
  redemption_instructions: string | null;
  redemption_button_label: string | null;
};

export type RevealSubject = {
  // 'student' = imported from a roster, we know who they are.
  // 'code'    = pool code sold through the POS, identity lives in the POS.
  kind: 'student' | 'code';
  id: string;
  code: string;
  firstName: string | null;
  klass: RevealClass | null;
};

const CLASS_FIELDS =
  'course, section, instructor, school, term, drop_deadline, publisher, redemption_url, redemption_instructions, redemption_button_label';

/**
 * Resolve a reveal token to whatever it points at. Roster students are
 * checked first because that is the older and more specific binding; pool
 * codes are the fallback. Tokens are unique across both tables in practice
 * (140 bits of entropy), so order only matters for cost, not correctness.
 */
export async function resolveToken(token: string): Promise<RevealSubject | null> {
  const supabase = createServiceClient();

  const { data: student } = await supabase
    .from('students')
    .select(`id, first_name, code, classes(${CLASS_FIELDS})`)
    .eq('reveal_token', token)
    .maybeSingle();

  if (student) {
    const s = student as unknown as {
      id: string;
      first_name: string;
      code: string;
      classes: RevealClass | null;
    };
    return {
      kind: 'student',
      id: s.id,
      code: s.code,
      firstName: s.first_name,
      klass: s.classes,
    };
  }

  const { data: pooled } = await supabase
    .from('codes')
    .select(`id, code, status, classes(${CLASS_FIELDS})`)
    .eq('reveal_token', token)
    .maybeSingle();

  if (pooled) {
    const c = pooled as unknown as {
      id: string;
      code: string;
      status: string;
      classes: RevealClass | null;
    };
    // A voided code should not hand out its value, even if someone still
    // holds the link.
    if (c.status === 'void') return null;
    return { kind: 'code', id: c.id, code: c.code, firstName: null, klass: c.classes };
  }

  return null;
}

/** The reveal_events column this subject records against. */
export function subjectColumn(subject: RevealSubject): 'student_id' | 'code_id' {
  return subject.kind === 'student' ? 'student_id' : 'code_id';
}

export async function countReveals(subject: RevealSubject): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('reveal_events')
    .select('id', { count: 'exact', head: true })
    .eq(subjectColumn(subject), subject.id);
  return count || 0;
}
