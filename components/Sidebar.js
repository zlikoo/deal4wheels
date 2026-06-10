'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { atLeast } from '@/lib/raenge';

const NAV = [
  { eyebrow: 'Tagesgeschäft' },
  { href: '/intern', label: 'Dashboard' },
  { href: '/intern/bestand', label: 'Bestand' },
  { href: '/intern/ankauf', label: 'Ankauf', min: 'dealer' },
  { href: '/intern/verkauf', label: 'Verkauf', min: 'dealer' },
  { href: '/intern/raten', label: 'Ratenverträge' },
  { href: '/intern/suchauftraege', label: 'Suchaufträge' },
  { href: '/intern/kunden', label: 'Kunden' },
  { eyebrow: 'Leitung', min: 'gfa' },
  { href: '/intern/finanzen', label: 'Finanzen', min: 'gfa' },
  { href: '/intern/ankuendigungen', label: 'Ankündigungen', min: 'gfa' },
  { href: '/intern/mitarbeiter', label: 'Mitarbeiter', min: 'gfa' },
];

export default function Sidebar({ rang }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="logo" style={{ padding: '4px 8px 14px' }}>
        <div className="logo-badge">D4</div>
        <div className="logo-name">Deal 4 Wheels<small>Intern · Autopia Pkwy</small></div>
      </Link>
      {NAV.filter((n) => !n.min || atLeast(rang, n.min)).map((n, i) =>
        n.eyebrow ? (
          <div key={i} className="nav-eyebrow">{n.eyebrow}</div>
        ) : (
          <Link key={n.href} href={n.href} className={'nav-item' + (path === n.href ? ' active' : '')}>{n.label}</Link>
        )
      )}
      <div className="nav-eyebrow">Konto</div>
      <button className="nav-item" onClick={logout}>Logout</button>
      <div className="side-foot">Fiktive Webseite für das Roleplay-Projekt Unity-life.de</div>
    </aside>
  );
}
