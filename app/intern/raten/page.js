'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { geld, datum } from '@/lib/format';
import { logAktion } from '@/lib/log';
import { atLeast } from '@/lib/raenge';

function smsText(vorlage, r) {
  const kunde = r.kunden ? `${r.kunden.vorname}` : 'Kunde';
  return (vorlage || 'Hallo {name}, hier Deal 4 Wheels. Deine Rate über {betrag} für den {fahrzeug} ({kennzeichen}) ist bis {frist} fällig. Beste Grüße, dein D4W-Team')
    .replaceAll('{name}', kunde)
    .replaceAll('{fahrzeug}', r.fahrzeuge?.name || '')
    .replaceAll('{kennzeichen}', r.fahrzeuge?.kennzeichen || 'ohne Kennzeichen')
    .replaceAll('{betrag}', geld(r.mindestzahlung))
    .replaceAll('{frist}', datum(r.ablauf));
}

export default function Raten() {
  const supabase = createClient();
  const [liste, setListe] = useState([]);
  const [vorlage, setVorlage] = useState('');
  const [offen, setOffen] = useState(null);
  const [toast, setToast] = useState('');
  const [rang, setRang] = useState('trainee');
  const darf = atLeast(rang, 'dealer');

  useEffect(() => { laden(); }, []);
  async function laden() {
    const { data: { user } } = await supabase.auth.getUser();
    supabase.from('mitarbeiter').select('rang').eq('id', user.id).single().then(({ data: me }) => setRang(me?.rang || 'trainee'));
    const [{ data }, { data: v }] = await Promise.all([
      supabase.from('ratenvertraege')
        .select('*, kunden(vorname,nachname,telefon), fahrzeuge(name,kennzeichen), mitarbeiter:betreuer(name)')
        .eq('status', 'laufend').order('ablauf'),
      supabase.from('sms_vorlagen').select('*').eq('name', 'rate_faellig').single(),
    ]);
    setListe(data || []);
    setVorlage(v?.text || '');
  }

  function ampel(r) {
    if (r.sms_status === 'fehler') return 'red';
    const t = new Date(r.ablauf);
    if (t < new Date()) return 'red';
    if (t < new Date(Date.now() + 3 * 86400000)) return 'amber';
    return 'green';
  }

  async function kopieren(text) {
    try {
      await navigator.clipboard.writeText(text);
      zeig('Kopiert — ab ins Spiel damit.');
    } catch { zeig('Kopieren blockiert — Text manuell markieren.'); }
  }
  async function gesendet(r) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ratenvertraege').update({ sms_status: 'ok', letzte_sms: new Date().toISOString(), letzte_sms_von: user.id }).eq('id', r.id);
    await logAktion(supabase, 'SMS gesendet', `${r.fahrzeuge?.name} / ${r.kunden?.nachname}`);
    laden();
  }
  async function nummerKaputt(r) {
    await supabase.from('ratenvertraege').update({ sms_status: 'fehler' }).eq('id', r.id);
    laden();
  }
  async function zahlung(r) {
    const betrag = prompt(`Zahlung erfassen (Restbetrag ${geld(r.restbetrag)}):`, r.mindestzahlung);
    if (!betrag) return;
    const n = parseInt(betrag, 10);
    if (Number.isNaN(n) || n <= 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    const neuerRest = Math.max(0, r.restbetrag - n);
    await supabase.from('ratenvertraege').update({ restbetrag: neuerRest, status: neuerRest === 0 ? 'bezahlt' : 'laufend', sms_status: 'offen' }).eq('id', r.id);
    await supabase.from('buchungen').insert({ typ: 'einnahme', grund: 'Ratenzahlung', betrag: n, fahrzeug_id: r.fahrzeug_id, mitarbeiter: user.id, notiz: r.fahrzeuge?.name });
    await logAktion(supabase, 'Ratenzahlung', `${geld(n)} für ${r.fahrzeuge?.name}`);
    zeig(neuerRest === 0 ? 'Vertrag vollständig bezahlt. 🎉' : 'Zahlung verbucht.');
    laden();
  }
  async function wiederaufnehmen(r) {
    if (!confirm('Fahrzeug wiederaufnehmen und Vertrag schließen?')) return;
    await supabase.from('ratenvertraege').update({ status: 'wiederaufgenommen' }).eq('id', r.id);
    await supabase.from('fahrzeuge').update({ status: 'garage', standzeit_start: new Date().toISOString() }).eq('id', r.fahrzeug_id);
    await logAktion(supabase, 'Wiederaufnahme', r.fahrzeuge?.name || '');
    laden();
  }
  function zeig(t) { setToast(t); setTimeout(() => setToast(''), 2400); }

  return (
    <>
      <div className="view-head">
        <h1>Ratenverträge</h1>
        <span className="pill">{liste.length} laufend</span>
        <span className="pill red"><span className="dot red"></span>{liste.filter((r) => ampel(r) === 'red').length} dringend</span>
        <span className="pill amber"><span className="dot amber"></span>{liste.filter((r) => ampel(r) === 'amber').length} bald fällig</span>
      </div>
      {liste.map((r) => (
        <div key={r.id} className={'rrow' + (offen === r.id ? ' open' : '')}>
          <div className="rrow-top" onClick={() => setOffen(offen === r.id ? null : r.id)}>
            <div className="rcell"><span className="l">Kunde</span><span className="v">{r.kunden ? `${r.kunden.vorname} ${r.kunden.nachname}` : '—'}</span></div>
            <div className="rcell"><span className="l">Fahrzeug</span><span className="v">{r.fahrzeuge?.name} {r.fahrzeuge?.kennzeichen && <span className="plate" style={{ marginLeft: 6 }}>{r.fahrzeuge.kennzeichen}</span>}</span></div>
            <div className="rcell hide-m"><span className="l">Restbetrag</span><span className="v mono">{geld(r.restbetrag)}</span></div>
            <div className="rcell"><span className="l">Nächste Frist</span><span className="v" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span className={'dot ' + ampel(r)}></span>{datum(r.ablauf)}</span></div>
            <div className="rcell hide-m"><span className="l">Betreuer</span><span className="v">{r.mitarbeiter?.name || '—'}</span></div>
            <span className="faint">▾</span>
          </div>
          <div className="rdetail">
            <div>
              <h4>SMS vorbereiten</h4>
              <textarea className="sms-box" readOnly value={smsText(vorlage, r)} />
              <div className="sms-actions">
                <button className="btn primary small" onClick={() => kopieren(smsText(vorlage, r))}>Text kopieren</button>
                {darf && <button className="btn small" onClick={() => gesendet(r)}>Als gesendet markieren</button>}
                {darf && <button className="btn small danger" onClick={() => nummerKaputt(r)}>Nummer ungültig</button>}
                {r.sms_status === 'ok' && r.letzte_sms && <span className="pill green">Zuletzt: {datum(r.letzte_sms)}</span>}
                {r.sms_status === 'fehler' && <span className="pill red">Nummer ungültig</span>}
              </div>
              {r.notiz && <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>Notiz: {r.notiz}</p>}
            </div>
            <div>
              <h4>Vertragsdaten</h4>
              <div className="facts">
                <div><span className="l">Raten</span><span className="mono">{r.raten_anzahl}x</span></div>
                <div><span className="l">Mindestzahlung</span><span className="mono">{geld(r.mindestzahlung)}</span></div>
                <div><span className="l">Beginn</span><span>{datum(r.beginn)}</span></div>
                <div><span className="l">Ablauf</span><span>{datum(r.ablauf)}</span></div>
                <div><span className="l">Einzug</span><span>{datum(r.einzug)}</span></div>
                <div><span className="l">Wiederverkauf</span><span>{datum(r.wiederverkauf)}</span></div>
                <div><span className="l">Telefon</span><span className="mono">{r.kunden?.telefon || '—'}</span></div>
              </div>
              {darf && (
                <div className="sms-actions" style={{ marginTop: 14 }}>
                  <button className="btn primary small" onClick={() => zahlung(r)}>Zahlung erfassen</button>
                  <button className="btn small danger" onClick={() => wiederaufnehmen(r)}>Wiederaufnehmen</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {liste.length === 0 && <p className="empty">Keine laufenden Ratenverträge.</p>}
      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </>
  );
}
