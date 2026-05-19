'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  token: string;
  alreadyRevealed: boolean;
  initialCode: string | null;
};

const REVEAL_THRESHOLD = 0.55;

export function ScratchReveal({ token, alreadyRevealed, initialCode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealed, setRevealed] = useState(alreadyRevealed);
  const [code, setCode] = useState<string | null>(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scratchedPct, setScratchedPct] = useState(0);

  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#475569';
    ctx.font = '600 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch here to reveal your code', w / 2, h / 2);

    ctx.globalCompositeOperation = 'destination-out';

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    function getXY(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function scratch(x: number, y: number) {
      ctx!.beginPath();
      ctx!.lineWidth = 32;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.moveTo(lastX, lastY);
      ctx!.lineTo(x, y);
      ctx!.stroke();
      lastX = x;
      lastY = y;
    }

    function measureScratched(): number {
      const imgData = ctx!.getImageData(0, 0, canvas!.width, canvas!.height);
      let cleared = 0;
      const total = imgData.data.length / 4;
      for (let i = 3; i < imgData.data.length; i += 4 * 50) {
        if (imgData.data[i] === 0) cleared++;
      }
      return cleared / (total / 50);
    }

    function onDown(e: PointerEvent) {
      drawing = true;
      const { x, y } = getXY(e);
      lastX = x;
      lastY = y;
      scratch(x, y);
      canvas!.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent) {
      if (!drawing) return;
      const { x, y } = getXY(e);
      scratch(x, y);
    }

    function onUp() {
      if (!drawing) return;
      drawing = false;
      const pct = measureScratched();
      setScratchedPct(pct);
      if (pct >= REVEAL_THRESHOLD) {
        doReveal();
      }
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  async function doReveal() {
    if (revealed || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/r/${token}/reveal`, { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Could not reveal code');
      }
      const { code: c } = await res.json();
      setCode(c);
      setRevealed(true);
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  if (revealed && code) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-xs uppercase tracking-wide text-emerald-700 font-medium">
          Your access code
        </div>
        <div className="mt-3 font-mono text-2xl font-semibold text-emerald-950 break-all select-all">
          {code}
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(code)}
          className="mt-4 text-sm text-emerald-800 underline hover:text-emerald-900"
        >
          Copy to clipboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden border border-slate-300" style={{ height: 140 }}>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <span className="text-slate-400 text-sm">{loading ? 'Revealing…' : ''}</span>
        </div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {scratchedPct > 0 && scratchedPct < REVEAL_THRESHOLD && (
        <div className="mt-2 text-xs text-slate-500 text-center">
          Keep scratching · {Math.round((scratchedPct / REVEAL_THRESHOLD) * 100)}%
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={doReveal}
        disabled={loading}
        className="mt-4 w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Reveal without scratching
      </button>
    </div>
  );
}
