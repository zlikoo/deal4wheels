'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { geld, datum, monatsanfang } from '@/lib/format';
import { atLeast } from '@/lib/raenge';

export default function Dashboard() {
  const supabase = createClient();
  const [ich, setIch] = useState(null);
  const [anks, setAnks] = useState([]);
  const [gelesen, setGelesen] = useState(new Set());
  const [tasks, setTasks] = useState([]);
  const [kpi, setKpi] = useState({ umsatz: 0, gewinn: 0, anzahl: 0, ziel: 0, provisionenOffen: 0 });

  useEffect(() => { laden(); }, []);

  async function laden() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: me }, { data: a }, { data: gel }, { data: raten }, { data: fz }, { data: vk }, { data: ziel }] = await Promise.all([
      supabase.from('mitarbeiter').select('*').eq('id', user.id).single(),
      supabase.from('ankuendigungen').select('*').or('ablauf.is.null,ablauf.gte.' + new Date().toISOString().slice(0, 10)).order('angepinnt', { ascending: false }).order('created_at', { ascending: false }).limit(4),
      supabase.from('ankuendigung_gelesen').select('ankuendigung_id').eq('mitarbeiter_id', user.id),
      supabase.from('ratenvertraege').select('id,sms_status,ablauf,einzug,kunden(vorname,nachname),fahrzeuge(name)').eq('status', 'laufend'),
      supabase.from('fahrzeuge').select('id,name,kennzeichen,inspektion,standzeit_start,status').in('status', ['online', 'reserviert']),
      supabase.from('verkaeufe').select('preis,provision,provision_ausgezahlt,fahrzeuge(ek_preis)').gte('created_at', monatsanfang()),
      supabase.from('einstellungen').select('wert').eq('schluessel', 'monatsziel').single(),
    ]);

    setIch(me);
    setAnks(a || []);
    setGelesen(new Set((gel || []).map((g) => g.ankuendigung_id)));

    const heute = new Date(); const bald = new Date(Date.now() + 3 * 86400000);
    const t = [];
    (raten || []).forEach((r) => {
      const kunde = r.kunden ? `${r.kunden.vorname} ${r.kunden.nachname}` : 'Kunde';
      if (r.sms_status === 'fehler') t.push({ rot: true, titel: `SMS-Problem — ${kunde}`, text: `${r.fahrzeuge?.name || ''}: Nummer ungültig, neue Nummer erfragen.`, href: '/intern/raten' });
      else if (r.ablauf && new Date(r.ablauf) <= bald) t.push({ rot: new Date(r.ablauf) < heute, titel: `Rate fällig — ${kunde}`, text: `${r.fahrzeuge?.name || ''}: Ablauf am ${datum(r.ablauf)}.`, href: '/intern/raten' });
    });
    (fz || []).forEach((f) => {
      if (f.inspektion && new Date(f.inspektion) < heute) t.push({ titel: `Inspektion abgelaufen — ${f.name}`, text: `${f.kennzeichen || 'ohne Kennzeichen'}: vor Verkauf in die Werkstatt.`, href: '/intern/bestand' });
      const tage = Math.floor((heute - new Date(f.standzeit_start)) / 86400000);
      if (tage > 21) t.push({ titel: `Standzeit ${tage} Tage — ${f.name}`, text: 'Preis senken oder zum Top Deal machen?', href: '/intern/bestand' });
    });
    setTasks(t.slice(0, 8));

    const umsatz = (vk || []).reduce((s, x) => s + (x.preis || 0), 0);
    const gewinn = (vk || []).reduce((s, x) => s + ((x.preis || 0) - (x.fahrzeuge?.ek_preis || 0)), 0);
    const provisionenOffen = (vk || []).filter((x) => !x.provision_ausgezahlt).reduce((s, x) => s + (x.provision || 0), 0);
    setKpi({ umsatz, gewinn, anzahl: (vk || []).length, ziel: Number(ziel?.wert || 0), provisionenOffen });
  }

  async function lesen(id) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ankuendigung_gelesen').upsert({ ankuendigung_id: id, mitarbeiter_id: user.id });
    setGelesen(new Set([...gelesen, id]));
  }

  if (!ich) return <p className="empty">Lade…</p>;
  const zielPct = kpi.ziel > 0 ? Math.min(100, Math.round((kpi.umsatz / kpi.ziel) * 100)) : null;

  return (
    <>
      {anks.map((a) => (
        <div key={a.id} className={'banner ' + (a.prioritaet !== 'info' ? a.prioritaet : '')}>
          <div style={{ fontSize: 17 }}>{a.prioritaet === 'kritisch' ? '⚠️' : '📌'}</div>
          <div><b>{a.titel}</b><p>{a.text}</p></div>
          <div className="b-meta">
            {a.angepinnt ? 'Angepinnt' : a.ablauf ? `bis ${datum(a.ablauf)}` : ''}<br />
            {gelesen.has(a.id)
              ? <span className="green">✓ gelesen</span>
              : <button className="btn small" style={{ marginTop: 4 }} onClick={() => lesen(a.id)}>{a.prioritaet === 'kritisch' ? 'Bestätigen' : 'Gelesen'}</button>}
          </div>
        </div>
      ))}

      <div className="view-head" style={{ marginTop: 6 }}>
        <h1>Moin, {(ich.name || '').split(' ')[0]}.</h1>
        <span className="muted" style={{ fontSize: 14 }}>
          {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>

      {tasks.length > 0 ? (
        <div className="tasks">
          {tasks.map((t, i) => (
            <div key={i} className={'task' + (t.rot ? ' red' : '')}>
              <b>{t.titel}</b><p>{t.text}</p>
              <Link href={t.href} className="btn small" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>Öffnen</Link>
            </div>
          ))}
        </div>
      ) : <p className="empty">Nichts Dringendes heute — freie Fahrt. 🏁</p>}

      <div className="kpi-row section-gap">
        <div className="kpi">
          <div className="label">{atLeast(ich.rang, 'head') ? 'Umsatz Juni (Team)' : 'Dein Umsatz (Monat)'}</div>
          <div className="value">{geld(kpi.umsatz)}</div>
          <div className="delta">{kpi.anzahl} Verkäufe</div>
        </div>
        {zielPct !== null && atLeast(ich.rang, 'head') && (
          <div className="kpi">
            <div className="label">Monatsziel</div>
            <div className="value">{zielPct} %</div>
            <div className="delta">{geld(kpi.umsatz)} / {geld(kpi.ziel)}</div>
          </div>
        )}
        {atLeast(ich.rang, 'gfa') && (
          <div className="kpi">
            <div className="label">Gewinn (Monat)</div>
            <div className="value">{geld(kpi.gewinn)}</div>
            <div className="delta">Verkaufspreis minus Einkauf</div>
          </div>
        )}
        {atLeast(ich.rang, 'gfa') && (
          <div className="kpi">
            <div className="label">Offene Provisionen</div>
            <div className="value">{geld(kpi.provisionenOffen)}</div>
            <div className="delta">Auszahlung über Mitarbeiter-Seite</div>
          </div>
        )}
      </div>
    </>
  );
}
