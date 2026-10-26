import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { AiConfig } from '../env';
import { simulatedProvider, type Provider } from './simulated';

export type { Provider } from './simulated';

export function anthropicProvider(cfg: AiConfig): Provider {
  const client = new Anthropic({ timeout: cfg.timeoutMs, maxRetries: 2 });
  return {
    name: 'anthropic',
    live: true,
    async generate({ system, user }) {
      const response = await client.beta.messages.create({
        model: cfg.model,
        max_tokens: cfg.maxOutputTokens,
        system,
        messages: [{ role: 'user', content: user }],
        thinking: { type: 'adaptive' },
        output_config: { effort: cfg.effort },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      });
      const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
      const notes: string[] = [];
      if (response.model !== cfg.model) notes.push(`Served by fallback model ${response.model} after ${cfg.model} declined.`);
      if (response.stop_reason === 'max_tokens') notes.push('Output hit the token limit and may be cut short.');
      const refused = response.stop_reason === 'refusal';
      if (refused) notes.push(`Model declined the request${response.stop_details?.category ? ` (category: ${response.stop_details.category})` : ''}.`);
      return {
        text,
        model: response.model,
        inputTokens: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0),
        outputTokens: response.usage.output_tokens,
        stopReason: response.stop_reason ?? 'unknown',
        refused,
        notes,
      };
    },
  };
}

export function providerFor(cfg: AiConfig): Provider {
  return cfg.live ? anthropicProvider(cfg) : simulatedProvider();
}
