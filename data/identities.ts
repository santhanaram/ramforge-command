// Visual identity sheet for each fictional character, so every portrait of a character stays consistent
// across images and tools. The appearance comes from the portrait manifest once a portrait exists;
// nothing is assumed from a character's name.
import { portraits } from './portraits';
import { workforce, type Role } from './workforce';

const PROPS: [RegExp, string][] = [
  [/citation|library|metadata|catalog/i, 'a slim reference book with coloured index tabs'],
  [/transcript|timestamp|timing/i, 'over-ear headphones resting on the shoulders'],
  [/rights|copyright|intake|permission/i, 'a document folder stamped with a check mark'],
  [/privacy|security|guardrail|auth/i, 'a small glowing shield badge on the lapel'],
  [/search|retrieval|vector|semantic|chunk/i, 'a holographic magnifying lens'],
  [/test|regression|benchmark|rubric|quality|qa/i, 'a clipboard with a checklist'],
  [/deploy|devops|environment|monitor|observability/i, 'a compact tablet showing a green status light'],
  [/frontend|experience|design|instruction/i, 'a stylus pen'],
  [/api|backend|supabase|pipeline|orchestrat|runtime|route/i, 'a lanyard with a small circuit-pattern tag'],
  [/decision|tree|tradeoff|criteria|framework|principle|ontology/i, 'a small geometric puzzle cube'],
  [/number|kpi|measurement|uncertainty|priority/i, 'a pocket notebook with a tiny bar chart'],
  [/client|consult|advisory|message|roleplay|facilitat/i, 'a warm, open-handed gesture'],
  [/case|narrative|scenario|program|learning/i, 'a rolled storyboard'],
  [/identity|governance|compliance|verify|evidence|claim|conflict|adversarial/i, 'a balanced scales pin'],
];

export type Identity = { style: string; framing: string; palette: string; prop: string; expression: string; appearance: string };

export function identityFor(role: Role): Identity {
  const prop = PROPS.find(([re]) => re.test(role.title))?.[1] ?? 'a tablet held at chest height';
  return {
    style: 'Photorealistic corporate studio headshot of a fictional person, soft key light, consistent across all 75 characters',
    framing: 'Shoulders-up, facing camera, centred, square 1:1, plain smooth backdrop',
    palette: `Backdrop tinted to match the ${role.division} division colour ${role.color}`,
    prop,
    expression: role.level === 'head' ? 'Confident and calm' : role.level === 'lead' ? 'Focused and approachable' : 'Friendly and attentive',
    appearance: portraits[role.id]?.appearance ?? 'To be chosen by RAM and recorded here, then reused for every image of this character',
  };
}

export function portraitBrief(role: Role) {
  const i = identityFor(role);
  return `${i.style}. Fictional character "${role.name}", ${role.title}. ${i.framing}. ${i.palette}. Expression: ${i.expression}. Appearance: ${i.appearance}. Original character, not based on any real person.`;
}

export const identities = Object.fromEntries(workforce.map((r) => [r.id, identityFor(r)]));
