'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateRevealToken } from '@/lib/tokens';
import type { ImportRow } from '@/lib/csv';

export type ImportResult =
  | { ok: true; inserted: number }
  | { ok: false; error: string };

export async function importRoster(
  classId: string,
  rows: ImportRow[],
): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  if (!rows.length) return { ok: false, error: 'No rows to import' };

  const records = rows.map((r) => ({
    class_id: classId,
    student_id: r.student_id,
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email_address,
    address_line1: r.address_line1 || null,
    address_line2: r.address_line2 || null,
    city: r.city || null,
    state: r.state || null,
    country: r.country || 'US',
    zip: r.zip || null,
    phone: r.phone || null,
    isbn: r.isbn || null,
    condition: r.condition || null,
    price: r.price ? parseFloat(r.price) : null,
    code: r.code,
    reveal_token: generateRevealToken(),
  }));

  const { error } = await supabase.from('students').insert(records);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/classes/${classId}`);
  return { ok: true, inserted: records.length };
}
