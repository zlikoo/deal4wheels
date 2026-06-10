'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { geld, datum, monatsanfang } from '@/lib/format';
import { logAktion } from '@/lib/log';

export default function Finanzen() {
  const supabase = createClient();
  const [buchungen, setBuchungen] = useState([]);
  const [logEintraege, setLog] = useState([]);
  const [ziel, setZiel] = useState('');
  const [neu, setNeu] = useState({ typ: 'einnahme', grund: '', betrag: '', notiz: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const [{ data: b }, { data: l }, { data: z }] = await Promise.all([
      supabase.from('buchungen').select('*, mitarbeiter:mitarbeiter(name), fahrzeuge(name)').order('created_at', { ascending: false }).limit(80),
      supabase.from('aktivitaetslog').select('*, mitarbeiter:mitarbeiter(name)').order('created_at', { ascending: false }).limit(30),
      supabase.from('einstellungen').select('wert').eq('schluessel', 'monatsziel').single(),
    ]);
    setBuchungen(b || []); setLog(l || []); setZiel(z?.wert || '');
  }

  const monat = buchungen.filter((b) => b.created_at >= monatsanfang());
  const einnahmen = monat.filter((b) => b.typ === 'einnahme').reduce((s, b) => s + b.betrag, 0);
  const ausgaben = monat.filter((b) => b.typ === 'ausgabe').reduce((s, b) => s + b.betrag, 0);

  async function buchen() {
    if (!neu.grund || !neu.betrag) { setMsg('Grund und Betrag angeben.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('buchungen').insert({ ...neu, betrag: parseInt(neu.betrag, 10), mitarbeiter: user.id });
    if (error) { setMsg('Fehlgeschlagen: ' + error.message); return; }
    await logAktion(supabase, 'Manuelle Buchung', `${neu.typ}: ${neu.grund} (${geld(neu.betrag)})`);
    setNeu({ typ: 'einnahme', grund: '', betrag: '', notiz: '' }); setMsg('');
    laden();
  }
  async function zielSpeichern() {
    await supabase.from('einstellungen').upsert({ schluessel: 'monatsziel', wert: String(parseInt(ziel, 10) || 0) });
    await logAktion(supabase, 'Monatsziel geändert', geld(ziel));
    laden();
  }

  return (
    <>
      <div className="view-head"><h1>Finanzen</h1></div>
      <div className="kpi-row">
        <div className="kpi"><div className="label">Einnahmen (Monat)</div><div className="value green">{geld(einnahmen)}</div></div>
        <div className="kpi"><div className="label">Ausgaben (Monat)</div><div className="value red">{geld(ausgaben)}</div></div>
        <div className="kpi"><div className="label">Ergebnis (Monat)</div><div className={'value ' + (einnahmen - ausgaben < 0 ? 'red' : 'green')}>{geld(einnahmen - ausgaben)}</div></div>
        <div className="kpi">
          <div className="label">Monatsziel (Umsatz)</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={ziel} onChange={(e) => setZiel(e.target.value)} style={{ width: 120, background: 'var(--panel2)', border: '1px solid var(--line2)', borderRadius: 8, padding: '6px 9px' }} />
            <button className="btn small" onClick={zielSpeichern}>Speichern</button>
          </div>
        </div>
      </div>

      <div className="cols section-gap">
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Datum</th><th>Typ</th><th>Grund</th><th>Betrag</th><th>Von</th></tr></thead>
            <tbody>
              {buchungen.map((b) => (
                <tr key={b.id}>
                  <td className="muted">{datum(b.created_at)}</td>
                  <td><span className={'pill ' + (b.typ === 'einnahme' ? 'green' : 'red')}>{b.typ === 'einnahme' ? 'Einnahme' : 'Ausgabe'}</span></td>
                  <td>{b.grund}{(b.fahrzeuge?.name || b.notiz) ? <span className="faint"> · {b.fahrzeuge?.name || b.notiz}</span> : ''}</td>
                  <td className={'mono ' + (b.typ === 'einnahme' ? 'green' : 'red')}>{b.typ === 'einnahme' ? '+' : '−'}{geld(b.betrag)}</td>
                  <td className="muted">{b.mitarbeiter?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {buchungen.length === 0 && <p className="empty" style={{ padding: 18 }}>Noch keine Buchungen.</p>}
        </div>
        <div>
          <div className="card">
            <h3>Manuelle Buchung</h3>
            <div className="field"><label>Typ</label>
              <select value={neu.typ} onChange={(e) => setNeu({ ...neu, typ: e.target.value })}>
                <option value="einnahme">Einnahme</option><option value="ausgabe">Ausgabe</option>
              </select>
            </div>
            <div className="field"><label>Grund</label><input value={neu.grund} onChange={(e) => setNeu({ ...neu, grund: e.target.value })} placeholder="z. B. Werkstattmiete" /></div>
            <div className="field"><label>Betrag ($)</label><input type="number" value={neu.betrag} onChange={(e) => setNeu({ ...neu, betrag: e.target.value })} /></div>
            <div className="field"><label>Notiz</label><input value={neu.notiz} onChange={(e) => setNeu({ ...neu, notiz: e.target.value })} /></div>
            <button className="btn primary" onClick={buchen}>Buchen</button>
            {msg && <p className="red" style={{ marginTop: 10, fontSize: 13 }}>{msg}</p>}
          </div>
          <div className="card section-gap">
            <h3>Aktivitätslog</h3>
            {logEintraege.map((l) => (
              <div key={l.id} style={{ padding: '7px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <b>{l.aktion}</b> <span className="muted">{l.details}</span>
                <div className="faint" style={{ fontSize: 11.5 }}>{l.mitarbeiter?.name || '—'} · {datum(l.created_at)}</div>
              </div>
            ))}
            {logEintraege.length === 0 && <p className="empty">Noch keine Einträge.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
