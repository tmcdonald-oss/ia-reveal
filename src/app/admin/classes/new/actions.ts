'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const payload = {
    school: (formData.get('school') as string)?.trim(),
    course: (formData.get('course') as string)?.trim(),
    section: (formData.get('section') as string)?.trim() || null,
    instructor: (formData.get('instructor') as string)?.trim() || null,
    term: (formData.get('term') as string)?.trim(),
    start_date: formData.get('start_date') as string,
    drop_deadline: formData.get('drop_deadline') as string,
    opt_out_deadline: (formData.get('opt_out_deadline') as string) || null,
    publisher: (formData.get('publisher') as string)?.trim() || null,
    redemption_url: (formData.get('redemption_url') as string)?.trim() || null,
    redemption_instructions: (formData.get('redemption_instructions') as string)?.trim() || null,
    redemption_button_label: (formData.get('redemption_button_label') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('classes')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/admin/classes/${data.id}`);
}
