'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function login(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) { setErr('Login fehlgeschlagen — E-Mail oder Passwort prüfen.'); setBusy(false); return; }
    router.push('/intern');
    router.refresh();
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={login}>
        <div className="logo" style={{ marginBottom: 20 }}>
          <div className="logo-badge">D4</div>
          <div className="logo-name">Deal 4 Wheels<small>Interner Bereich</small></div>
        </div>
        <div className="field"><label>E-Mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div className="field"><label>Passwort</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></div>
        <button className="btn primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Einen Moment…' : 'Anmelden'}</button>
        {err && <p className="red" style={{ marginTop: 12, fontSize: 13.5 }}>{err}</p>}
        <p className="faint" style={{ marginTop: 16, fontSize: 12.5 }}>Zugänge werden von GF oder IT angelegt. Kein Konto? Meld dich im Team.</p>
      </form>
    </div>
  );
}
