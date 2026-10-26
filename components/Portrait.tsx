import { portraits } from '@/data/portraits';
import type { Role } from '@/data/workforce';

// Shows the licensed portrait when one is registered, otherwise an initials placeholder.
export function Portrait({ role, size = 48 }: { role: Role; size?: number }) {
  const p = portraits[role.id];
  const radius = Math.round(size * 0.28);
  if (p) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.src} alt={p.alt} width={size} height={size} className="portrait" style={{ borderRadius: radius }} />;
  }
  const initials = role.name.split(' ').map((x) => x[0]).join('');
  return (
    <div className="avatar" role="img" aria-label={`Placeholder for ${role.name}, no portrait supplied yet`}
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size / 3.2), background: `linear-gradient(135deg, ${role.color}, #657798)` }}>
      {initials}
    </div>
  );
}
