'use client';
import { useMemo, useState } from 'react';
import VehicleCard from '@/components/VehicleCard';
import Link from 'next/link';
import { geld, prozent } from '@/lib/format';

const KATEGORIEN = ['Alle', 'Mittelklasse', 'Sportwagen', 'Luxusklasse', 'Offroad/SUV', 'Muscle Car', 'Kleinwagen', 'Motorräder', 'Quads'];

export default function KatalogClient({ fahrzeuge, initTop }) {
  const [kat, setKat] = useState('Alle');
  const [maxPreis, setMaxPreis] = useState(200000);
  const [fuel, setFuel] = useState('');
  const [perf, setPerf] = useState(false);
  const [top, setTop] = useState(!!initTop);
  const [sort, setSort] = useState('new');

  const liste = useMemo(() => {
    let l = fahrzeuge.filter((v) =>
      (kat === 'Alle' || v.kategorie === kat) &&
      v.festpreis <= maxPreis &&
      (!fuel || v.kraftstoff === fuel) &&
      (!perf || v.leistung_eingetragen) &&
      (!top || v.top_deal)
    );
    const cmp = (v) => prozent(v.neupreis_ausstattung || v.neupreis, v.festpreis);
    if (sort === 'cheap') l = [...l].sort((a, b) => a.festpreis - b.festpreis);
    else if (sort === 'exp') l = [...l].sort((a, b) => b.festpreis - a.festpreis);
    else if (sort === 'save') l = [...l].sort((a, b) => cmp(b) - cmp(a));
    return l;
  }, [fahrzeuge, kat, maxPreis, fuel, perf, top, sort]);

  return (
    <>
      <div className="filterbar">
        <div className="chips">
          {KATEGORIEN.map((k) => (
            <button key={k} className={'chip' + (k === kat ? ' on' : '')} onClick={() => setKat(k)}>{k}</button>
          ))}
        </div>
        <div className="frow">
          <label>Preis bis <b className="mono" style={{ color: 'var(--text)' }}>{geld(maxPreis)}</b>
            <input type="range" min={10000} max={200000} step={5000} value={maxPreis} onChange={(e) => setMaxPreis(+e.target.value)} />
          </label>
          <label>Kraftstoff
            <select value={fuel} onChange={(e) => setFuel(e.target.value)}>
              <option value="">Alle</option><option>Benzin</option><option>Diesel</option><option>Elektro</option>
            </select>
          </label>
          <label><input type="checkbox" checked={perf} onChange={(e) => setPerf(e.target.checked)} /> Leistung eingetragen</label>
          <label><input type="checkbox" checked={top} onChange={(e) => setTop(e.target.checked)} /> Nur Top Deals</label>
          <label>Sortierung
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Neuzugang</option>
              <option value="cheap">Preis aufsteigend</option>
              <option value="exp">Preis absteigend</option>
              <option value="save">Größte Ersparnis</option>
            </select>
          </label>
          <span className="result-count">{liste.length} Fahrzeuge</span>
        </div>
      </div>
      <div className="grid">{liste.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
      {liste.length === 0 && (
        <p className="empty">Nichts gefunden — aber sag uns, was du suchst: <Link href="/wunschfahrzeug" style={{ color: 'var(--brand)', fontWeight: 600 }}>Wunschfahrzeug anfragen →</Link></p>
      )}
    </>
  );
}
