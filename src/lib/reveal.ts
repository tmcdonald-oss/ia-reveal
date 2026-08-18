import { createServiceClient } from '@/lib/supabase/server';

export type RevealClass = {
  course: string;
  section: string | null;
  instructor: string | null;
  school: string;
  term: string;
  drop_deadline: string;
  opt_out_deadline: string | null;
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
  'course, section, instructor, school, term, drop_deadline, opt_out_deadline, publisher, redemption_url, redemption_instructions, redemption_button_label';

/**
 * A lookup that fails should never look the same as a token that does not
 * exist. Both used to render the same bare 404, which made a stale
 * PostgREST schema cache indistinguishable from a bad link. Log loudly.
 */
function logLookupError(where: string, error: { message: string; code?: string }) {
  console.error(
    `[reveal] ${where} lookup failed: ${error.message}` +
      (error.code ? ` (code ${error.code})` : '') +
      `. If this says the table is missing from the schema cache, run ` +
      `"NOTIFY pgrst, 'reload schema';" in the Supabase SQL editor.`,
  );
}

async function fetchClass(classId: string | null): Promise<RevealClass | null> {
  if (!classId) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_FIELDS)
    .eq('id', classId)
    .maybeSingle();
  if (error) {
    logLookupError('class', error);
    return null;
  }
  return (data as unknown as RevealClass) || null;
}

/**
 * Resolve a reveal token to whatever it points at. Roster students are
 * checked first because that is the older and more specific binding; pool
 * codes are the fallback. Tokens are unique across both tables in practice
 * (116 bits of entropy), so order only matters for cost, not correctness.
 *
 * Class details are fetched separately rather than embedded. The embedded
 * form depends on PostgREST having the foreign key in its schema cache,
 * and a cache miss there would drop the whole row rather than just the
 * class - turning a cosmetic problem into a 404 on a code the student paid
 * for.
 */
export async function resolveToken(token: string): Promise<RevealSubject | null> {
  const supabase = createServiceClient();

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, code, class_id')
    .eq('reveal_token', token)
    .maybeSingle();

  if (studentError) logLookupError('student', studentError);

  if (student) {
    const s = student as {
      id: string;
      first_name: string;
      code: string;
      class_id: string | null;
    };
    return {
      kind: 'student',
      id: s.id,
      code: s.code,
      firstName: s.first_name,
      klass: await fetchClass(s.class_id),
    };
  }

  const { data: pooled, error: poolError } = await supabase
    .from('codes')
    .select('id, code, status, class_id')
    .eq('reveal_token', token)
    .maybeSingle();

  if (poolError) logLookupError('code pool', poolError);

  if (pooled) {
    const c = pooled as {
      id: string;
      code: string;
      status: string;
      class_id: string | null;
    };
    // A voided code should not hand out its value, even if someone still
    // holds the link.
    if (c.status === 'void') return null;
    return {
      kind: 'code',
      id: c.id,
      code: c.code,
      firstName: null,
      klass: await fetchClass(c.class_id),
    };
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
