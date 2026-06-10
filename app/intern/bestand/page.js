'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { geld, datum } from '@/lib/format';
import { logAktion } from '@/lib/log';
import { atLeast } from '@/lib/raenge';

const STATI = { online: ['green', 'Online'], reserviert: ['amber', 'Reserviert'], garage: ['amber', 'Garage'], verkauft: ['red', 'Verkauft'] };

export default function Bestand() {
  const supabase = createClient();
  const [liste, setListe] = useState([]);
  const [q, setQ] = useState('');
  const [rang, setRang] = useState('trainee');
  const darf = atLeast(rang, 'dealer');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data }, { data: me }] = await Promise.all([
      supabase.from('fahrzeuge').select('*').order('created_at', { ascending: false }),
      supabase.from('mitarbeiter').select('rang').eq('id', user.id).single(),
    ]);
    setListe(data || []);
    setRang(me?.rang || 'trainee');
  }

  async function topDeal(v) {
    await supabase.from('fahrzeuge').update({ top_deal: !v.top_deal }).eq('id', v.id);
    await logAktion(supabase, 'Top Deal ' + (!v.top_deal ? 'gesetzt' : 'entfernt'), v.name);
    laden();
  }
  async function preis(v) {
    const neu = prompt(`Neuer Festpreis für ${v.name} (aktuell ${geld(v.festpreis)}):`, v.festpreis);
    if (!neu) return;
    const n = parseInt(neu, 10);
    if (Number.isNaN(n)) return;
    await supabase.from('fahrzeuge').update({ festpreis: n, reduziert_von: n < v.festpreis ? v.festpreis : v.reduziert_von }).eq('id', v.id);
    await logAktion(supabase, 'Preis geändert', `${v.name}: ${geld(v.festpreis)} → ${geld(n)}`);
    laden();
  }
  async function status(v, s) {
    await supabase.from('fahrzeuge').update({ status: s }).eq('id', v.id);
    await logAktion(supabase, 'Status geändert', `${v.name} → ${s}`);
    laden();
  }

  const gefiltert = liste.filter((v) => (v.name + ' ' + (v.kennzeichen || '') + ' ' + v.kategorie).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="view-head">
        <h1>Bestand</h1>
        <span className="pill">{liste.filter((v) => v.status !== 'verkauft').length} im Bestand</span>
        <span className="pill green">{liste.filter((v) => v.status === 'online').length} online</span>
        <Link href="/intern/ankauf" className="btn primary small">+ Ankauf</Link>
      </div>
      <div className="field" style={{ maxWidth: 420 }}>
        <input placeholder="Suchen: Name, Kennzeichen, Kategorie…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Fahrzeug</th><th>Kennzeichen</th><th>Festpreis</th><th>EK</th><th>Marge</th><th>Inspektion</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {gefiltert.map((v) => {
              const [farbe, label] = STATI[v.status] || ['', v.status];
              const inspAlt = v.inspektion && new Date(v.inspektion) < new Date();
              return (
                <tr key={v.id}>
                  <td><b>{v.name}</b> {v.top_deal && <span className="badge top" style={{ marginLeft: 6 }}>Top</span>}<br /><span className="faint" style={{ fontSize: 12 }}>{v.kategorie}</span></td>
                  <td>{v.kennzeichen ? <span className="plate">{v.kennzeichen}</span> : '—'}</td>
                  <td className="mono">{geld(v.festpreis)}</td>
                  <td className="mono muted">{geld(v.ek_preis)}</td>
                  <td className={'mono ' + (v.festpreis - v.ek_preis < 0 ? 'red' : 'green')}>{geld(v.festpreis - v.ek_preis)}</td>
                  <td className={inspAlt ? 'amber' : ''}>{datum(v.inspektion)}</td>
                  <td><span className={'pill ' + farbe}>{label}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {!darf ? <span className="faint" style={{ fontSize: 12 }}>nur ansehen</span> : <>
                    <button className="btn small" onClick={() => preis(v)}>Preis</button>{' '}
                    <button className="btn small" onClick={() => topDeal(v)}>{v.top_deal ? 'Top −' : 'Top +'}</button>{' '}
                    {v.status !== 'online'
                      ? <button className="btn small" onClick={() => status(v, 'online')}>Online</button>
                      : <button className="btn small" onClick={() => status(v, 'garage')}>Garage</button>}
                    </>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {gefiltert.length === 0 && <p className="empty" style={{ padding: 18 }}>Kein Fahrzeug gefunden.</p>}
      </div>
    </>
  );
}
