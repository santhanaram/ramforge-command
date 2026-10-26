'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BookOpen, ClipboardList, FlaskConical, LayoutDashboard, Settings2, ShieldCheck, Users } from 'lucide-react';

export const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/workforce', label: 'Workforce', icon: Users },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/runs', label: 'Agent runs', icon: Activity },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { href: '/contextforge', label: 'ContextForge', icon: FlaskConical },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path.startsWith(href));

export function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={`navbtn ${isActive(path, href) ? 'active' : ''}`} aria-current={isActive(path, href) ? 'page' : undefined}>
          <Icon size={17} aria-hidden /> {label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="mobilemenu" aria-label="Main">
      {NAV.map(({ href, label }) => (
        <Link key={href} href={href} className={isActive(path, href) ? 'active' : ''} aria-current={isActive(path, href) ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
