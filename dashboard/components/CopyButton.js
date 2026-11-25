'use client';
import { useState } from 'react';

export default function CopyButton({ text, label = 'Copiar mensagem' }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); } catch {}
      }}
    >
      {ok ? 'Copiado ✓' : label}
    </button>
  );
}
