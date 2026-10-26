'use client';
import { useEffect, useRef, useState } from 'react';
import type { Tiktoken } from 'js-tiktoken/lite';

// Live ContextForge tool T-05 (Tiktoken). Runs entirely in the visitor's browser: no server call, no key, no network
// beyond loading the vocabulary file from this site. The encoder is loaded on first use to keep the page light.
const encodings = {
  o200k_base: { label: 'o200k_base (GPT-4o and newer OpenAI models)', load: () => import('js-tiktoken/ranks/o200k_base') },
  cl100k_base: { label: 'cl100k_base (GPT-4 and GPT-3.5)', load: () => import('js-tiktoken/ranks/cl100k_base') },
} as const;
type EncodingName = keyof typeof encodings;

export function TokenCounter() {
  const [text, setText] = useState('');
  const [name, setName] = useState<EncodingName>('o200k_base');
  const [encoder, setEncoder] = useState<{ name: EncodingName; enc: Tiktoken } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = useRef<EncodingName | null>(null);

  useEffect(() => {
    if (!text || encoder?.name === name || loading.current === name) return;
    loading.current = name;
    Promise.all([import('js-tiktoken/lite'), encodings[name].load()])
      .then(([{ Tiktoken }, ranks]) => setEncoder({ name, enc: new Tiktoken(ranks.default) }))
      .catch(() => setError('The tokenizer could not be loaded. Check your connection and try again.'))
      .finally(() => { loading.current = null; });
  }, [text, name, encoder]);

  const ready = encoder?.name === name;
  const tokens = ready && text ? encoder.enc.encode(text).length : 0;

  return (
    <div className="form">
      <label>Encoding
        <select className="field" value={name} onChange={(e) => setName(e.target.value as EncodingName)}>
          {Object.entries(encodings).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      <label>Text to count
        <textarea className="field" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a prompt or a passage to see how many tokens it uses." />
      </label>
      {error
        ? <div className="alert bad" role="alert">{error}</div>
        : (
          <p className="small" role="status" aria-live="polite">
            {!text ? 'Type or paste text to count.' : ready ? <><strong>{tokens.toLocaleString()} tokens</strong> · {text.length.toLocaleString()} characters</> : 'Loading tokenizer...'}
          </p>
        )}
    </div>
  );
}
