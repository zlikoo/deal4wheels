import Link from 'next/link';
import { geld, prozent } from '@/lib/format';

export default function VehicleCard({ v }) {
  const vergleich = v.neupreis_ausstattung || v.neupreis;
  const ersparnis = prozent(vergleich, v.festpreis);
  return (
    <Link href={`/fahrzeug/${v.id}`} className="vcard">
      <div className="vimg">
        {v.bild_url ? <img src={v.bild_url} alt={v.name} loading="lazy" /> : <div className="ph">Fahrzeugbild folgt</div>}
        <div className="badges">
          {v.top_deal && <span className="badge top">Top Deal</span>}
          {v.reduziert_von && v.reduziert_von > v.festpreis && <span className="badge red">Reduziert</span>}
          {v.status === 'reserviert' && <span className="badge gray">Reserviert</span>}
        </div>
      </div>
      <div className="vbody">
        <div className="vtitle"><b>{v.name}</b><span className="cat">{v.kategorie}</span></div>
        <div className="price-row">
          <span className="price">{geld(v.festpreis)}</span>
          {vergleich > v.festpreis && <span className="np">{geld(vergleich)}</span>}
          {ersparnis > 0 && <span className="save">−{ersparnis} %</span>}
        </div>
        <div className="vmeta">
          {v.kennzeichen && <span className="plate">{v.kennzeichen}</span>}
          <span>⛽ {v.kraftstoff}</span>
          {v.leistung_eingetragen && <span className="green">✓ Leistung eingetragen</span>}
        </div>
      </div>
    </Link>
  );
}
