'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { geld } from '@/lib/format';
import { logAktion } from '@/lib/log';

const KATEGORIEN = ['Mittelklasse', 'Sportwagen', 'Luxusklasse', 'Offroad/SUV', 'Muscle Car', 'Kleinwagen', 'Motorräder', 'Quads'];
const TUNING = ['Turbo', 'Motor', 'Bremsen', 'Getriebe', 'Funkgerät', 'Winterreifen', 'Schusssichere Reifen', 'Gehärtete Reifen'];

export default function Ankauf() {
  const supabase = createClient();
  const router = useRouter();
  const [f, setF] = useState({
    name: '', kategorie: 'Mittelklasse', kennzeichen: '', ek_preis: '', festpreis: '', neupreis: '',
    neupreis_ausstattung: '', kraftstoff: 'Benzin', tank_liter: 30, inspektion: '',
    leistung_eingetragen: false, alarmanlage: 'Keine', status: 'online', notiz: '',
  });
  const [tuning, setTuning] = useState([]);
  const [bild, setBild] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const marge = (parseInt(f.festpreis, 10) || 0) - (parseInt(f.ek_preis, 10) || 0);

  async function speichern() {
    if (!f.name || !f.ek_preis || !f.festpreis) { setMsg('Name, EK-Preis und Festpreis sind Pflicht.'); return; }
    setBusy(true); setMsg('');
    let bild_url = null;
    if (bild) {
      const ext = bild.name.split('.').pop();
      const pfad = `fz_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('fahrzeuge').upload(pfad, bild);
      if (upErr) { setMsg('Bild-Upload fehlgeschlagen: ' + upErr.message); setBusy(false); return; }
      bild_url = supabase.storage.from('fahrzeuge').getPublicUrl(pfad).data.publicUrl;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('fahrzeuge').insert({
      ...f,
      ek_preis: parseInt(f.ek_preis, 10), festpreis: parseInt(f.festpreis, 10),
      neupreis: parseInt(f.neupreis, 10) || null, neupreis_ausstattung: parseInt(f.neupreis_ausstattung, 10) || null,
      tank_liter: parseInt(f.tank_liter, 10) || null, inspektion: f.inspektion || null,
      tuning: { liste: tuning }, bild_url, erstellt_von: user.id,
    });
    if (error) { setMsg('Speichern fehlgeschlagen: ' + error.message); setBusy(false); return; }
    await supabase.from('buchungen').insert({ typ: 'ausgabe', grund: 'Fahrzeugankauf', betrag: parseInt(f.ek_preis, 10), mitarbeiter: user.id, notiz: f.name });
    await logAktion(supabase, 'Ankauf', `${f.name} für ${geld(f.ek_preis)}`);
    router.push('/intern/bestand');
  }

  return (
    <>
      <div className="view-head"><h1>Fahrzeugankauf</h1></div>
      <div className="cols">
        <div className="card">
          <h3>Allgemein</h3>
          <div className="field-2">
            <div className="field"><label>Fahrzeugmodell</label><input value={f.name} onChange={set('name')} placeholder="z. B. Dominator GT" /></div>
            <div className="field"><label>Kategorie</label><select value={f.kategorie} onChange={set('kategorie')}>{KATEGORIEN.map((k) => <option key={k}>{k}</option>)}</select></div>
          </div>
          <div className="field-3">
            <div className="field"><label>Kennzeichen</label><input value={f.kennzeichen} onChange={set('kennzeichen')} placeholder="1DFW2025" /></div>
            <div className="field"><label>EK-Preis ($)</label><input type="number" value={f.ek_preis} onChange={set('ek_preis')} /></div>
            <div className="field"><label>Festpreis ($)</label><input type="number" value={f.festpreis} onChange={set('festpreis')} /></div>
          </div>
          <div className="field-3">
            <div className="field"><label>Neupreis ($)</label><input type="number" value={f.neupreis} onChange={set('neupreis')} /></div>
            <div className="field"><label>mit Ausstattung ($)</label><input type="number" value={f.neupreis_ausstattung} onChange={set('neupreis_ausstattung')} /></div>
            <div className="field"><label>Inspektion</label><input type="date" value={f.inspektion} onChange={set('inspektion')} /></div>
          </div>
          <div className="field-3">
            <div className="field"><label>Kraftstoff</label><select value={f.kraftstoff} onChange={set('kraftstoff')}><option>Benzin</option><option>Diesel</option><option>Elektro</option></select></div>
            <div className="field"><label>Tank (L)</label><input type="number" value={f.tank_liter} onChange={set('tank_liter')} /></div>
            <div className="field"><label>Alarmanlage</label><select value={f.alarmanlage} onChange={set('alarmanlage')}><option>Keine</option><option>Stufe 1</option><option>Stufe 2</option></select></div>
          </div>
          <label className="checkline"><input type="checkbox" checked={f.leistung_eingetragen} onChange={set('leistung_eingetragen')} /> Leistung eingetragen</label>
          <div className="field"><label>Status nach Ankauf</label><select value={f.status} onChange={set('status')}><option value="online">Direkt online</option><option value="garage">Garage (noch nicht öffentlich)</option></select></div>
          <div className="field"><label>Fahrzeugbild</label><input type="file" accept="image/*" onChange={(e) => setBild(e.target.files?.[0] || null)} /></div>
          <div className="field"><label>Notiz</label><textarea value={f.notiz} onChange={set('notiz')} /></div>
          <button className="btn primary" disabled={busy} onClick={speichern}>{busy ? 'Speichere…' : 'Ankauf abschließen'}</button>
          {msg && <p className="red" style={{ marginTop: 10, fontSize: 13.5 }}>{msg}</p>}
        </div>
        <div>
          <div className="card">
            <h3>Zustand &amp; Tuning</h3>
            {TUNING.map((t) => (
              <label key={t} className="checkline">
                <input type="checkbox" checked={tuning.includes(t)} onChange={(e) => setTuning(e.target.checked ? [...tuning, t] : tuning.filter((x) => x !== t))} /> {t}
              </label>
            ))}
          </div>
          <div className="card section-gap">
            <h3>Margen-Check</h3>
            <div className="kpi" style={{ border: 'none', padding: 0 }}>
              <div className="label">Marge bei Festpreis</div>
              <div className={'value ' + (marge < 0 ? 'red' : 'green')}>{geld(marge)}</div>
              <div className="delta">{marge < 0 ? '⚠️ Du verkaufst unter Einkauf!' : 'EK wird als Ausgabe verbucht.'}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
