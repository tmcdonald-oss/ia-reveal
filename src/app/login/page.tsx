'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="text-slate-500 text-sm">Loading…</div>
    </main>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const errorParam = params.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    setErrorMsg('');

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectParam = params.get('redirect') || '/admin';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?redirect=${encodeURIComponent(redirectParam)}`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-900">IA Reveal · Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in with a magic link sent to your bookstore email.
        </p>

        {errorParam === 'not-authorized' && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            That email is not authorized as an admin.
          </div>
        )}

        {status === 'sent' ? (
          <div className="mt-6 rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
            <strong>Check your email.</strong>
            <p className="mt-1">
              We sent a sign-in link to {email}. It expires in about an hour.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'sending'}
                placeholder="you@textbookbrokers.com"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>

            {errorMsg && (
              <div className="text-sm text-red-700">{errorMsg}</div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
