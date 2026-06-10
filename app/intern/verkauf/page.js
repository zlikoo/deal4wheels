'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { geld } from '@/lib/format';
import { logAktion } from '@/lib/log';

export default function Verkauf() {
  const supabase = createClient();
  const router = useRouter();
  const [fahrzeuge, setFahrzeuge] = useState([]);
  const [kunden, setKunden] = useState([]);
  const [me, setMe] = useState(null);
  const [fzId, setFzId] = useState('');
  const [kdId, setKdId] = useState('');
  const [neuKunde, setNeuKunde] = useState({ vorname: '', nachname: '', telefon: '' });
  const [rabatt, setRabatt] = useState(0);
  const [raten, setRaten] = useState(false);
  const [anzahlung, setAnzahlung] = useState(50);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const [{ data: fz }, { data: kd }, { data: m }] = await Promise.all([
        supabase.from('fahrzeuge').select('*').in('status', ['online', 'reserviert', 'garage']).order('name'),
        supabase.from('kunden').select('*').order('nachname'),
        supabase.from('mitarbeiter').select('*').eq('id', user.id).single(),
      ]);
      setFahrzeuge(fz || []); setKunden(kd || []); setMe(m);
    })();
  }, []);

  const fz = useMemo(() => fahrzeuge.find((f) => String(f.id) === fzId), [fahrzeuge, fzId]);
  const endpreis = fz ? Math.round(fz.festpreis * (1 - rabatt / 100)) : 0;
  const marge = fz ? endpreis - fz.ek_preis : 0;
  const provision = me ? Math.round((endpreis * (me.provision_prozent || 0)) / 100) : 0;
  const anzBetrag = Math.round((endpreis * anzahlung) / 100);
  const rest = endpreis - anzBetrag;

  async function verkaufen() {
    if (!fz) { setMsg('Bitte Fahrzeug wählen.'); return; }
    setBusy(true); setMsg('');
    const { data: { user } } = await supabase.auth.getUser();

    let kundeId = kdId ? parseInt(kdId, 10) : null;
    if (!kundeId && neuKunde.vorname) {
      const { data: nk, error: ke } = await supabase.from('kunden').insert(neuKunde).select().single();
      if (ke) { setMsg('Kunde anlegen fehlgeschlagen: ' + ke.message); setBusy(false); return; }
      kundeId = nk.id;
    }

    const { data: vkRow, error } = await supabase.from('verkaeufe').insert({
      fahrzeug_id: fz.id, kunde_id: kundeId, preis: endpreis, rabatt_prozent: rabatt,
      verkaeufer: user.id, provision, ratenkauf: raten,
    }).select().single();
    if (error) { setMsg('Verkauf fehlgeschlagen: ' + error.message); setBusy(false); return; }

    await supabase.from('fahrzeuge').update({ status: 'verkauft' }).eq('id', fz.id);
    await supabase.from('buchungen').insert({
      typ: 'einnahme', grund: raten ? 'Verkauf (Anzahlung)' : 'Fahrzeugverkauf',
      betrag: raten ? anzBetrag : endpreis, fahrzeug_id: fz.id, mitarbeiter: user.id, notiz: fz.name,
    });

    if (raten && rest > 0) {
      const d = (tage) => new Date(Date.now() + tage * 86400000).toISOString().slice(0, 10);
      await supabase.from('ratenvertraege').insert({
        fahrzeug_id: fz.id, kunde_id: kundeId, verkauf_id: vkRow.id,
        restbetrag: rest, mindestzahlung: Math.ceil(rest / 4), raten_anzahl: 4,
        beginn: d(0), ablauf: d(14), einzug: d(15), wiederverkauf: d(20),
        betreuer: user.id, sms_status: 'offen',
      });
    }
    await logAktion(supabase, 'Verkauf', `${fz.name} für ${geld(endpreis)}${raten ? ' (Ratenkauf)' : ''}`);
    router.push(raten ? '/intern/raten' : '/intern/bestand');
  }

  return (
    <>
      <div className="view-head"><h1>Fahrzeugverkauf</h1></div>
      <div className="cols">
        <div className="card">
          <h3>Verkauf</h3>
          <div className="field"><label>Fahrzeug</label>
            <select value={fzId} onChange={(e) => { setFzId(e.target.value); setRabatt(0); }}>
              <option value="">— wählen —</option>
              {fahrzeuge.map((f) => <option key={f.id} value={f.id}>{f.name} · {geld(f.festpreis)} {f.kennzeichen ? `· ${f.kennzeichen}` : ''}</option>)}
            </select>
          </div>
          <div className="field"><label>Kunde (bestehend)</label>
            <select value={kdId} onChange={(e) => setKdId(e.target.value)}>
              <option value="">— Neukunde unten anlegen —</option>
              {kunden.map((k) => <option key={k.id} value={k.id}>{k.vorname} {k.nachname} · {k.telefon}</option>)}
            </select>
          </div>
          {!kdId && (
            <div className="field-3">
              <div className="field"><label>Vorname</label><input value={neuKunde.vorname} onChange={(e) => setNeuKunde({ ...neuKunde, vorname: e.target.value })} /></div>
              <div className="field"><label>Nachname</label><input value={neuKunde.nachname} onChange={(e) => setNeuKunde({ ...neuKunde, nachname: e.target.value })} /></div>
              <div className="field"><label>Telefon</label><input value={neuKunde.telefon} onChange={(e) => setNeuKunde({ ...neuKunde, telefon: e.target.value })} /></div>
            </div>
          )}
          <div className="field"><label>Rabatt: {rabatt} %</label>
            <input type="range" min={0} max={30} value={rabatt} onChange={(e) => setRabatt(+e.target.value)} style={{ accentColor: 'var(--brand)' }} />
          </div>
          <label className="checkline"><input type="checkbox" checked={raten} onChange={(e) => setRaten(e.target.checked)} /> Ratenkauf (4 Raten)</label>
          {raten && (
            <div className="field"><label>Anzahlung: {anzahlung} % = {geld(anzBetrag)}</label>
              <input type="range" min={30} max={80} step={5} value={anzahlung} onChange={(e) => setAnzahlung(+e.target.value)} style={{ accentColor: 'var(--brand)' }} />
            </div>
          )}
          <button className="btn primary" disabled={busy || !fz} onClick={verkaufen}>{busy ? 'Verkaufe…' : raten ? 'Verkaufen + Ratenvertrag anlegen' : 'Verkaufen'}</button>
          {msg && <p className="red" style={{ marginTop: 10, fontSize: 13.5 }}>{msg}</p>}
        </div>
        <div className="card">
          <h3>Live-Rechnung</h3>
          {!fz ? <p className="empty">Wähle links ein Fahrzeug.</p> : (
            <div className="facts" style={{ gridTemplateColumns: '1fr' }}>
              <div><span className="l">Festpreis</span><span className="mono">{geld(fz.festpreis)}</span></div>
              <div><span className="l">Endpreis nach Rabatt</span><span className="mono" style={{ fontSize: 19 }}>{geld(endpreis)}</span></div>
              <div><span className="l">Marge (gegen EK {geld(fz.ek_preis)})</span><span className={'mono ' + (marge < 0 ? 'red' : 'green')}>{geld(marge)}</span></div>
              <div><span className="l">Deine Provision ({me?.provision_prozent || 0} %)</span><span className="mono" style={{ color: '#CDB6FF' }}>{geld(provision)}</span></div>
              {raten && <div><span className="l">Ratenvertrag</span><span>Anzahlung {geld(anzBetrag)} · Rest {geld(rest)} in 4 Raten je {geld(Math.ceil(rest / 4))}</span></div>}
              {marge < 0 && <div className="pill red">⚠️ Verkauf unter Einkaufspreis!</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
