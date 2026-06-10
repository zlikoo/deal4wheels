import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import { RANG_LABEL } from '@/lib/raenge';

export const dynamic = 'force-dynamic';

export default async function InternLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ich } = await supabase.from('mitarbeiter').select('*').eq('id', user.id).single();

  if (!ich || !ich.aktiv) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2 className="disp" style={{ fontSize: 22, marginBottom: 10 }}>Kein Zugang</h2>
          <p className="muted" style={{ fontSize: 13.5 }}>
            Dein Konto ist noch nicht freigeschaltet oder wurde deaktiviert.
            Meld dich bei GF oder IT — die schalten dich in der Mitarbeiterverwaltung frei.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar rang={ich.rang} />
      <div className="main">
        <header className="topbar">
          <span className="muted" style={{ fontSize: 13 }}>Internes System</span>
          <div className="userchip">
            <div className="avatar">{(ich.name || '?').split(' ').map((t) => t[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div>
              <b style={{ fontSize: 13.5, display: 'block', lineHeight: 1.2 }}>{ich.name}</b>
              <span className="rankchip">{RANG_LABEL[ich.rang]}</span>
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
