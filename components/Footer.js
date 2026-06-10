import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="col" style={{ maxWidth: 280 }}>
            <div className="logo">
              <div className="logo-badge">D4</div>
              <div className="logo-name">Deal 4 Wheels<small>Gebrauchtwagenhandel</small></div>
            </div>
            <p>Autopia Pkwy — PC 2016/2017, Los Santos. Einfach vorbeikommen oder anrufen.</p>
            <span className="call-pill">📞 Leitstelle <b>995</b></span>
          </div>
          <div className="col">
            <h5>Katalog</h5>
            <Link href="/katalog">Alle Fahrzeuge</Link>
            <Link href="/katalog?top=1">Top Deals</Link>
            <Link href="/wunschfahrzeug">Fahrzeugsuche</Link>
          </div>
          <div className="col">
            <h5>Erreich uns</h5>
            <a href="https://connect.ulife.me/#/directory/44" target="_blank" rel="noreferrer">Connect</a>
            <a href="https://schnatter.ulife.me/profil/Deals4Wheels" target="_blank" rel="noreferrer">Schnatter</a>
            <a href="https://gta-5-map.com?notes=H92YaIjCHsP" target="_blank" rel="noreferrer">Standort auf der Karte</a>
          </div>
        </div>
        <div className="disclaimer">
          Dies ist eine fiktive Webseite für das Roleplay-Projekt Unity-life.de · System entwickelt von Raymond Bileano
        </div>
      </div>
    </footer>
  );
}
