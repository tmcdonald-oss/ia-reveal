import { createClient } from '@/lib/supabase/server';
import { buildCsv } from '@/lib/csv';
import { formatFilenameDateTime } from '@/lib/dates';
import { buildRevealUrl } from '@/lib/tokens';

const POOL_COLUMNS = [
  'pos_access_code_id',
  'reveal_url',
  'url_length',
  'ean',
  'batch_label',
  'status',
];

type PoolRow = {
  reveal_token: string;
  pos_access_code_id: number | null;
  ean: string | null;
  batch_label: string | null;
  status: string;
};

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const batch = url.searchParams.get('batch');

  let query = supabase
    .from('codes')
    .select('reveal_token, pos_access_code_id, ean, batch_label, status')
    .order('pos_access_code_id');

  // Only codes that have not gone out yet are useful to load into the POS.
  if (url.searchParams.get('all') !== '1') {
    query = query.eq('status', 'available');
  }
  if (batch) query = query.eq('batch_label', batch);

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const codes = (data as PoolRow[]) || [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const rows = [];
  for (const c of codes) {
    // Throws rather than emitting a URL the POS would silently truncate.
    const revealUrl = buildRevealUrl(appUrl, c.reveal_token);
    rows.push({
      pos_access_code_id: c.pos_access_code_id ?? '',
      reveal_url: revealUrl,
      url_length: revealUrl.length,
      ean: c.ean || '',
      batch_label: c.batch_label || '',
      status: c.status,
    });
  }

  const csv = buildCsv(POOL_COLUMNS, rows);
  const filename = `IAReveal_PoolURLs_${formatFilenameDateTime()}.csv`;

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
