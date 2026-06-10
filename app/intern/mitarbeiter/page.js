'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { geld } from '@/lib/format';
import { RAENGE, RANG_LABEL, atLeast } from '@/lib/raenge';
import { logAktion } from '@/lib/log';

export default function Mitarbeiter() {
  const supabase = createClient();
  const [liste, setListe] = useState([]);
  const [provisionen, setProv] = useState({});
  const [meinRang, setMeinRang] = useState('trainee');
  const [msg, setMsg] = useState('');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: m }, { data: vk }] = await Promise.all([
      supabase.from('mitarbeiter').select('*').order('name'),
      supabase.from('verkaeufe').select('verkaeufer,provision').eq('provision_ausgezahlt', false),
    ]);
    setListe(m || []);
    setMeinRang((m || []).find((x) => x.id === user.id)?.rang || 'trainee');
    const p = {};
    (vk || []).forEach((v) => { p[v.verkaeufer] = (p[v.verkaeufer] || 0) + (v.provision || 0); });
    setProv(p);
  }

  async function update(m, patch, log) {
    const { error } = await supabase.from('mitarbeiter').update(patch).eq('id', m.id);
    if (error) { setMsg('Nicht erlaubt: ' + error.message); return; }
    setMsg('');
    if (log) await logAktion(supabase, log, m.name);
    laden();
  }
  async function auszahlen(m) {
    const summe = provisionen[m.id] || 0;
    if (summe <= 0) return;
    if (!confirm(`${geld(summe)} Provision an ${m.name} auszahlen?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('verkaeufe').update({ provision_ausgezahlt: true }).eq('verkaeufer', m.id).eq('provision_ausgezahlt', false);
    await supabase.from('buchungen').insert({ typ: 'ausgabe', grund: 'Provisionsauszahlung', betrag: summe, mitarbeiter: user.id, notiz: m.name });
    await logAktion(supabase, 'Provision ausgezahlt', `${m.name}: ${geld(summe)}`);
    laden();
  }

  const darfRang = (ziel) => atLeast(meinRang, 'gf') || (meinRang === 'gfa' && RAENGE.indexOf(ziel) <= RAENGE.indexOf('head'));

  return (
    <>
      <div className="view-head"><h1>Mitarbeiter</h1><span className="pill">{liste.filter((m) => m.aktiv).length} aktiv</span></div>
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
        Neue Konten: In Supabase unter Authentication → Users anlegen — die Person erscheint hier automatisch als Trainee und wird dann freigeschaltet und eingestuft.
      </p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Rang</th><th>Provision %</th><th>Offene Provision</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {liste.map((m) => (
              <tr key={m.id}>
                <td><b>{m.name}</b></td>
                <td>
                  <select value={m.rang} onChange={(e) => update(m, { rang: e.target.value }, `Rang → ${RANG_LABEL[e.target.value]}`)}
                          style={{ background: 'var(--panel2)', border: '1px solid var(--line2)', borderRadius: 8, padding: '5px 8px' }}>
                    {RAENGE.map((r) => <option key={r} value={r} disabled={!darfRang(r)}>{RANG_LABEL[r]}</option>)}
                  </select>
                </td>
                <td>
                  <input type="number" defaultValue={m.provision_prozent} onBlur={(e) => { const n = parseFloat(e.target.value); if (!Number.isNaN(n) && n !== m.provision_prozent) update(m, { provision_prozent: n }, 'Provisionssatz geändert'); }}
                         style={{ width: 70, background: 'var(--panel2)', border: '1px solid var(--line2)', borderRadius: 8, padding: '5px 8px' }} disabled={!atLeast(meinRang, 'gf')} />
                </td>
                <td className="mono" style={{ color: '#CDB6FF' }}>{geld(provisionen[m.id] || 0)}</td>
                <td><span className={'pill ' + (m.aktiv ? 'green' : 'red')}>{m.aktiv ? 'Aktiv' : 'Deaktiviert'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {atLeast(meinRang, 'gf') && (provisionen[m.id] || 0) > 0 && <button className="btn small" onClick={() => auszahlen(m)}>Auszahlen</button>}{' '}
                  <button className="btn small" onClick={() => update(m, { aktiv: !m.aktiv }, m.aktiv ? 'Konto deaktiviert' : 'Konto aktiviert')}>{m.aktiv ? 'Deaktivieren' : 'Freischalten'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg && <p className="red" style={{ marginTop: 12, fontSize: 13 }}>{msg}</p>}
    </>
  );
}
