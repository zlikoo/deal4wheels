'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { datum } from '@/lib/format';
import { atLeast } from '@/lib/raenge';

const STATUS = { offen: ['amber', 'Offen'], in_arbeit: ['violet', 'In Arbeit'], erledigt: ['green', 'Erledigt'] };

export default function Suchauftraege() {
  const supabase = createClient();
  const [liste, setListe] = useState([]);
  const [filter, setFilter] = useState('offen');
  const [rang, setRang] = useState('trainee');
  const darf = atLeast(rang, 'dealer');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data }, { data: me }] = await Promise.all([
      supabase.from('suchauftraege').select('*').order('created_at', { ascending: false }),
      supabase.from('mitarbeiter').select('rang').eq('id', user.id).single(),
    ]);
    setListe(data || []);
    setRang(me?.rang || 'trainee');
  }
  async function setze(id, status) {
    await supabase.from('suchauftraege').update({ status }).eq('id', id);
    laden();
  }

  const gefiltert = filter === 'alle' ? liste : liste.filter((s) => s.status === filter);

  return (
    <>
      <div className="view-head">
        <h1>Suchaufträge</h1>
        {['offen', 'in_arbeit', 'erledigt', 'alle'].map((f) => (
          <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
            {f === 'alle' ? 'Alle' : STATUS[f][1]} ({f === 'alle' ? liste.length : liste.filter((s) => s.status === f).length})
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Datum</th><th>Name</th><th>Telefon</th><th>Fahrzeug</th><th>Preiswunsch</th><th>Wünsche</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {gefiltert.map((s) => {
              const [farbe, label] = STATUS[s.status] || ['', s.status];
              return (
                <tr key={s.id}>
                  <td className="muted">{datum(s.created_at)}</td>
                  <td><b>{s.name}</b></td>
                  <td className="mono">{s.telefon}</td>
                  <td>{s.fahrzeug}</td>
                  <td>{s.preiswunsch || '—'}</td>
                  <td className="muted" style={{ maxWidth: 260 }}>{[s.sonderwunsch, s.sonstiges].filter(Boolean).join(' · ') || '—'}</td>
                  <td><span className={'pill ' + farbe}>{label}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {!darf ? <span className="faint" style={{ fontSize: 12 }}>nur ansehen</span> : <>
                    {s.status !== 'in_arbeit' && <button className="btn small" onClick={() => setze(s.id, 'in_arbeit')}>In Arbeit</button>}{' '}
                    {s.status !== 'erledigt' && <button className="btn small" onClick={() => setze(s.id, 'erledigt')}>Erledigt</button>}
                    </>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {gefiltert.length === 0 && <p className="empty" style={{ padding: 18 }}>Keine Suchaufträge in dieser Ansicht.</p>}
      </div>
    </>
  );
}
