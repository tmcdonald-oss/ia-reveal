import Link from 'next/link';

export function Nav({ email }: { email: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-semibold text-slate-900">
            IA Reveal
          </Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/admin" className="hover:text-slate-900">Classes</Link>
            <Link href="/admin/pool" className="hover:text-slate-900">Code pool</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">{email}</span>
          <form action="/admin/logout" method="post">
            <button type="submit" className="text-slate-600 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
