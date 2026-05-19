import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from './_components/Nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify auth here in addition to the proxy, per the Next.js 16 guidance.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length && !allowed.includes((user.email || '').toLowerCase())) {
    redirect('/login?error=not-authorized');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav email={user.email || ''} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
