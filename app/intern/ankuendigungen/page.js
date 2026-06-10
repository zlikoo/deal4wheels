'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { datum } from '@/lib/format';
import { logAktion } from '@/lib/log';

export default function Ankuendigungen() {
  const supabase = createClient();
  const [liste, setListe] = useState([]);
  const [statsByAnk, setStats] = useState({});
  const [teamGroesse, setTeam] = useState(0);
  const [f, setF] = useState({ titel: '', text: '', prioritaet: 'info', ablauf: '', angepinnt: false });
  const [msg, setMsg] = useState('');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const [{ data: a }, { data: gel }, { count }] = await Promise.all([
      supabase.from('ankuendigungen').select('*').order('created_at', { ascending: false }),
      supabase.from('ankuendigung_gelesen').select('ankuendigung_id'),
      supabase.from('mitarbeiter').select('*', { count: 'exact', head: true }).eq('aktiv', true),
    ]);
    setListe(a || []);
    const s = {};
    (gel || []).forEach((g) => { s[g.ankuendigung_id] = (s[g.ankuendigung_id] || 0) + 1; });
    setStats(s);
    setTeam(count || 0);
  }

  async function veroeffentlichen() {
    if (!f.titel || !f.text) { setMsg('Titel und Text angeben.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('ankuendigungen').insert({ ...f, ablauf: f.ablauf || null, autor: user.id });
    if (error) { setMsg('Fehlgeschlagen: ' + error.message); return; }
    await logAktion(supabase, 'Ankündigung geschaltet', f.titel);
    setF({ titel: '', text: '', prioritaet: 'info', ablauf: '', angepinnt: false }); setMsg('');
    laden();
  }
  async function loeschen(a) {
    if (!confirm(`„${a.titel}" wirklich löschen?`)) return;
    await supabase.from('ankuendigungen').delete().eq('id', a.id);
    laden();
  }

  const farbe = { info: 'var(--brand)', wichtig: 'var(--amber)', kritisch: 'var(--red)' };

  return (
    <>
      <div className="view-head"><h1>Ankündigungen</h1><span className="pill violet">GF &amp; GF-Assistenz</span></div>
      <div className="cols">
        <div className="card">
          <h3>Neue Ankündigung schalten</h3>
          <div className="field"><label>Titel</label><input value={f.titel} onChange={(e) => setF({ ...f, titel: e.target.value })} /></div>
          <div className="field"><label>Text</label><textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></div>
          <div className="field"><label>Priorität</label>
            <div className="seg">
              {['info', 'wichtig', 'kritisch'].map((p) => (
                <button key={p} className={f.prioritaet === p ? 'sel-' + p : ''} onClick={() => setF({ ...f, prioritaet: p })}>
                  {p === 'info' ? 'Info' : p === 'wichtig' ? 'Wichtig' : 'Kritisch — mit Bestätigung'}
                </button>
              ))}
            </div>
          </div>
          <div className="field-2">
            <div className="field"><label>Läuft ab am (optional)</label><input type="date" value={f.ablauf} onChange={(e) => setF({ ...f, ablauf: e.target.value })} /></div>
            <label className="checkline" style={{ marginTop: 26 }}><input type="checkbox" checked={f.angepinnt} onChange={(e) => setF({ ...f, angepinnt: e.target.checked })} /> Anpinnen</label>
          </div>
          <button className="btn primary" onClick={veroeffentlichen}>Veröffentlichen</button>
          {msg && <p className="red" style={{ marginTop: 10, fontSize: 13 }}>{msg}</p>}

          <h3 style={{ marginTop: 22 }}>Live-Vorschau</h3>
          <div className={'banner ' + (f.prioritaet !== 'info' ? f.prioritaet : '')} style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 17 }}>{f.prioritaet === 'kritisch' ? '⚠️' : '📌'}</div>
            <div><b>{f.titel || 'Titel der Ankündigung'}</b><p>{f.text || 'Der Text erscheint hier, während du tippst.'}</p></div>
          </div>
        </div>
        <div className="card">
          <h3>Aktive &amp; vergangene Ankündigungen</h3>
          {liste.map((a) => {
            const n = statsByAnk[a.id] || 0;
            return (
              <div key={a.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 99, background: farbe[a.prioritaet] || 'var(--brand)', flex: 'none' }}></span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>{a.titel}</b>
                  <p className="muted" style={{ fontSize: 12.5 }}>
                    {a.angepinnt ? 'Angepinnt · ' : ''}{a.ablauf ? `bis ${datum(a.ablauf)} · ` : ''}seit {datum(a.created_at)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                  {n} / {teamGroesse} {a.prioritaet === 'kritisch' ? 'bestätigt' : 'gelesen'}
                  <div style={{ width: 74, height: 5, borderRadius: 99, background: 'var(--panel2)', marginTop: 5, overflow: 'hidden' }}>
                    <i style={{ display: 'block', height: '100%', width: (teamGroesse ? Math.round((n / teamGroesse) * 100) : 0) + '%', background: 'var(--green)' }}></i>
                  </div>
                  <button className="btn small danger" style={{ marginTop: 7 }} onClick={() => loeschen(a)}>Löschen</button>
                </div>
              </div>
            );
          })}
          {liste.length === 0 && <p className="empty">Noch keine Ankündigungen.</p>}
        </div>
      </div>
    </>
  );
}
