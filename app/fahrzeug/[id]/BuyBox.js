'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { geld, datum, prozent } from '@/lib/format';

export default function BuyBox({ v }) {
  const supabase = createClient();
  const [anz, setAnz] = useState(50);
  const [frm, setFrm] = useState(false);
  const [name, setName] = useState('');
  const [tel, setTel] = useState('');
  const [ok, setOk] = useState('');

  const vergleich = v.neupreis_ausstattung || v.neupreis;
  const ersparnis = vergleich - v.festpreis;
  const anzBetrag = Math.round((v.festpreis * anz) / 100);
  const rest = v.festpreis - anzBetrag;
  const inspAlt = v.inspektion && new Date(v.inspektion) < new Date();

  async function anfragen() {
    if (!name || !tel) { setOk('Bitte Name und Telefon angeben.'); return; }
    const { error } = await supabase.from('suchauftraege').insert({
      name, telefon: tel, fahrzeug: v.name,
      sonstiges: `Anfrage über Fahrzeugseite (#${v.id}, ${v.kennzeichen || 'ohne Kennzeichen'})`,
    });
    setOk(error ? 'Senden fehlgeschlagen — ruf uns gern unter 995 an.' : 'Anfrage gesendet — wir melden uns!');
    if (!error) { setFrm(false); setName(''); setTel(''); }
  }

  return (
    <div className="buybox">
      <span className="cat">{v.kategorie}</span>
      <h1>{v.name}</h1>
      <div className="bprice">
        <span className="price">{geld(v.festpreis)}</span>
        {vergleich > v.festpreis && <span className="np">{geld(vergleich)}</span>}
        {ersparnis > 0 && <span className="save">Du sparst {geld(ersparnis)} · {prozent(vergleich, v.festpreis)} %</span>}
      </div>
      <div className="fin-note">Festpreis · Sammelkarte beim Kauf inklusive</div>

      <div className="specs">
        <div><span className="l">Kennzeichen</span><span className="v">{v.kennzeichen ? <span className="plate">{v.kennzeichen}</span> : '—'}</span></div>
        <div><span className="l">Kraftstoff</span><span className="v">{v.kraftstoff} · {v.tank_liter} L</span></div>
        <div><span className="l">Leistung</span><span className="v">{v.leistung_eingetragen ? 'Eingetragen' : 'Nicht verbaut'}</span></div>
        <div><span className="l">Alarmanlage</span><span className="v">{v.alarmanlage || 'Keine'}</span></div>
        <div><span className="l">Inspektion</span><span className={'v' + (inspAlt ? ' amber' : '')}>{datum(v.inspektion)}{inspAlt ? ' — wird vor Übergabe erneuert' : ''}</span></div>
        <div><span className="l">Standort</span><span className="v">Autopia Pkwy</span></div>
      </div>

      <div className="calc">
        <h4>Ratenrechner</h4>
        <div className="calc-row"><span>Anzahlung <b className="mono">{anz} %</b></span><b>{geld(anzBetrag)}</b></div>
        <input type="range" min={30} max={80} step={5} value={anz} onChange={(e) => setAnz(+e.target.value)} />
        <div className="calc-row"><span>Restbetrag</span><b>{geld(rest)}</b></div>
        <div className="rate-big"><span style={{ fontSize: 13, color: 'var(--muted)' }}>4 Raten je</span><b>{geld(Math.ceil(rest / 4))}</b></div>
        <div className="fin-note" style={{ marginTop: 9 }}>Unverbindliche Rechnung — den Vertrag machen wir gemeinsam vor Ort.</div>
      </div>

      <div className="cta-col">
        {!frm ? (
          <button className="btn primary" onClick={() => { setFrm(true); setOk(''); }}>Fahrzeug anfragen</button>
        ) : (
          <div className="card" style={{ padding: 14 }}>
            <div className="field"><label>Dein Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vorname Nachname" /></div>
            <div className="field"><label>Telefon</label><input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="555…" /></div>
            <button className="btn primary" style={{ width: '100%' }} onClick={anfragen}>Anfrage absenden</button>
          </div>
        )}
        <a className="btn" href="tel:995">📞 Anrufen · 995</a>
        {ok && <div className="pill green" style={{ alignSelf: 'flex-start' }}>{ok}</div>}
      </div>
    </div>
  );
}
