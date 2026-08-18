'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

function classPayload(formData: FormData) {
  const text = (k: string) => (formData.get(k) as string)?.trim() || null;
  return {
    school: (formData.get('school') as string)?.trim(),
    course: (formData.get('course') as string)?.trim(),
    section: text('section'),
    instructor: text('instructor'),
    term: (formData.get('term') as string)?.trim(),
    start_date: formData.get('start_date') as string,
    drop_deadline: formData.get('drop_deadline') as string,
    opt_out_deadline: (formData.get('opt_out_deadline') as string) || null,
    publisher: text('publisher'),
    redemption_url: text('redemption_url'),
    redemption_instructions: text('redemption_instructions'),
    redemption_button_label: text('redemption_button_label'),
    notes: text('notes'),
  };
}

export async function updateClass(classId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('classes')
    .update(classPayload(formData))
    .eq('id', classId);

  if (error) throw new Error(error.message);

  // The reveal pages render class details, so clear their caches too.
  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath('/admin');

  redirect(`/admin/classes/${classId}`);
}
