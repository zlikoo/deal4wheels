'use client';
import { useState } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

export default function WunschPage() {
  const supabase = createClient();
  const [f, setF] = useState({ name: '', telefon: '', fahrzeug: '', preiswunsch: '', sonderwunsch: '', sonstiges: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function senden() {
    if (!f.name || !f.telefon || !f.fahrzeug) { setMsg('Name, Telefon und Wunschfahrzeug sind Pflicht.'); return; }
    const { error } = await supabase.from('suchauftraege').insert(f);
    setMsg(error ? 'Senden fehlgeschlagen — ruf uns gern unter 995 an.' : 'Suchauftrag eingegangen — wir melden uns, sobald wir was haben!');
    if (!error) setF({ name: '', telefon: '', fahrzeug: '', preiswunsch: '', sonderwunsch: '', sonstiges: '' });
  }

  return (
    <>
      <PublicNav />
      <div className="wrap section" style={{ maxWidth: 700 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <h2 className="disp" style={{ fontSize: 27 }}>Wunschfahrzeug anfragen</h2>
          <p className="sec-sub" style={{ marginTop: 6 }}>Kein Stress, wenn&apos;s gerade nicht im Fuhrpark steht — sag uns, was du suchst, und wir kümmern uns drum.</p>
        </div>
        <div className="card">
          <div className="field-2">
            <div className="field"><label>Dein Name</label><input value={f.name} onChange={set('name')} placeholder="Vorname Nachname" /></div>
            <div className="field"><label>Telefon</label><input value={f.telefon} onChange={set('telefon')} placeholder="555…" /></div>
          </div>
          <div className="field"><label>Wunschfahrzeug</label><input value={f.fahrzeug} onChange={set('fahrzeug')} placeholder="z. B. Itali GTO" /></div>
          <div className="field-2">
            <div className="field"><label>Preiswunsch</label><input value={f.preiswunsch} onChange={set('preiswunsch')} placeholder="z. B. $ 150.000" /></div>
            <div className="field"><label>Sonderwunsch</label><input value={f.sonderwunsch} onChange={set('sonderwunsch')} placeholder="Farbe, Tuning, …" /></div>
          </div>
          <div className="field"><label>Sonstiges</label><textarea value={f.sonstiges} onChange={set('sonstiges')} placeholder="Alles, was wir noch wissen sollten — z. B. Tausch + Draufzahlung" /></div>
          <button className="btn primary" style={{ width: '100%' }} onClick={senden}>Suchauftrag absenden</button>
          {msg && <p className="muted" style={{ marginTop: 12, fontSize: 13.5 }}>{msg}</p>}
        </div>
      </div>
      <Footer />
    </>
  );
}
