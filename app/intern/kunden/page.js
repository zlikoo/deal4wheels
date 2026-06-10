'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { geld, datum } from '@/lib/format';
import { atLeast } from '@/lib/raenge';

export default function Kunden() {
  const supabase = createClient();
  const [liste, setListe] = useState([]);
  const [q, setQ] = useState('');
  const [neu, setNeu] = useState({ vorname: '', nachname: '', telefon: '', kontonummer: '' });
  const [akte, setAkte] = useState(null);
  const [kaeufe, setKaeufe] = useState([]);
  const [rang, setRang] = useState('trainee');
  const darf = atLeast(rang, 'dealer');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data }, { data: me }] = await Promise.all([
      supabase.from('kunden').select('*').order('nachname'),
      supabase.from('mitarbeiter').select('rang').eq('id', user.id).single(),
    ]);
    setListe(data || []);
    setRang(me?.rang || 'trainee');
  }
  async function anlegen() {
    if (!neu.vorname || !neu.telefon) return;
    await supabase.from('kunden').insert(neu);
    setNeu({ vorname: '', nachname: '', telefon: '', kontonummer: '' });
    laden();
  }
  async function oeffnen(k) {
    setAkte(k);
    const { data } = await supabase.from('verkaeufe').select('preis,created_at,ratenkauf,fahrzeuge(name)').eq('kunde_id', k.id).order('created_at', { ascending: false });
    setKaeufe(data || []);
  }

  const gefiltert = liste.filter((k) => `${k.vorname} ${k.nachname} ${k.telefon} ${k.kontonummer || ''}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="view-head"><h1>Kunden</h1><span className="pill">{liste.length} gesamt</span></div>
      <div className="cols">
        <div>
          <div className="field" style={{ maxWidth: 420 }}>
            <input placeholder="Suchen: Name, Telefon, Kontonummer…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Name</th><th>Telefon</th><th>Kontonummer</th><th></th></tr></thead>
              <tbody>
                {gefiltert.map((k) => (
                  <tr key={k.id}>
                    <td><b>{k.vorname} {k.nachname}</b></td>
                    <td className="mono">{k.telefon}</td>
                    <td className="mono muted">{k.kontonummer || '—'}</td>
                    <td><button className="btn small" onClick={() => oeffnen(k)}>Akte</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gefiltert.length === 0 && <p className="empty" style={{ padding: 18 }}>Kein Kunde gefunden.</p>}
          </div>
        </div>
        <div>
          {darf && <div className="card">
            <h3>Neuer Kunde</h3>
            <div className="field-2">
              <div className="field"><label>Vorname</label><input value={neu.vorname} onChange={(e) => setNeu({ ...neu, vorname: e.target.value })} /></div>
              <div className="field"><label>Nachname</label><input value={neu.nachname} onChange={(e) => setNeu({ ...neu, nachname: e.target.value })} /></div>
            </div>
            <div className="field-2">
              <div className="field"><label>Telefon</label><input value={neu.telefon} onChange={(e) => setNeu({ ...neu, telefon: e.target.value })} /></div>
              <div className="field"><label>Kontonummer</label><input value={neu.kontonummer} onChange={(e) => setNeu({ ...neu, kontonummer: e.target.value })} /></div>
            </div>
            <button className="btn primary" onClick={anlegen}>Anlegen</button>
          </div>}
          {akte && (
            <div className="card section-gap">
              <h3>Kundenakte — {akte.vorname} {akte.nachname}</h3>
              <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>📞 {akte.telefon} · Konto {akte.kontonummer || '—'}</p>
              {kaeufe.length === 0 ? <p className="empty">Noch keine Käufe.</p> : kaeufe.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
                  <span style={{ flex: 1 }}>{v.fahrzeuge?.name}{v.ratenkauf ? ' · Ratenkauf' : ''}</span>
                  <span className="mono">{geld(v.preis)}</span>
                  <span className="faint">{datum(v.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
