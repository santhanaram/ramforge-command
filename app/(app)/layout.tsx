import { MobileNav, SideNav } from '@/components/Nav';
import { aiConfig, demoWritesAllowed, supabaseConfigured } from '@/lib/env';

// Every page reads per-request data (session cookies or demo state), so nothing here is prerendered.
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const live = supabaseConfigured();
  const ai = aiConfig();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brandicon" aria-hidden>R</div><div><strong>RAMFORGE</strong><small>WORKFORCE COMMAND</small></div></div>
        <SideNav />
        <div className="sidefoot">
          <p className="independence">Independent platform. Not affiliated with or endorsed by Alex Hormozi or Acquisition.com.</p>
        </div>
      </aside>
      <main className="main" id="main">
        <MobileNav />
        <div className="modebar" aria-label="What is live and what is simulated">
          <span className={`tag ${live ? 'good' : 'sim'}`}>{live ? 'Data: live Supabase database' : `Data: demo only, resets on restart${demoWritesAllowed() ? '' : ', read-only'}`}</span>
          <span className={`tag ${ai.live ? 'good' : 'sim'}`}>{ai.live ? `AI: live (${ai.model})` : 'AI: simulated, no model is called'}</span>
        </div>
        {children}
        <footer className="footer">
          RAMFORGE Command v2 · Character responsibilities are a job charter, not evidence of work · Agent output is labelled live or simulated on every run ·
          Independent, not affiliated with or endorsed by Alex Hormozi or Acquisition.com
        </footer>
      </main>
    </div>
  );
}
