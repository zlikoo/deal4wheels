import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import VehicleCard from '@/components/VehicleCard';
import { createClient } from '@/lib/supabase/server';
import { geld } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();
  const { data: alle } = await supabase
    .from('fahrzeuge_public')
    .select('*')
    .order('created_at', { ascending: false });

  const fahrzeuge = alle || [];
  const frisch = fahrzeuge.slice(0, 5);
  const top = fahrzeuge.filter((v) => v.top_deal).slice(0, 5);
  const ersparnis = top.reduce((s, v) => s + Math.max(0, (v.neupreis_ausstattung || v.neupreis || 0) - v.festpreis), 0);

  return (
    <>
      <PublicNav />
      <div className="hero">
        <div className="wrap hero-in">
          <div className="kicker">Dein Gebrauchtwagenhandel No. 1 · Los Santos</div>
          <h1>Motor an,<br /><span>los geht&apos;s.</span></h1>
          <p>Vom spritzigen Cityflitzer bis zum verlässlichen Offroader — stöbern, vergleichen, verlieben. Und wenn dein Wunschauto fehlt: Wir kümmern uns drum.</p>
          <div className="hero-cta">
            <Link href="/katalog?top=1" className="btn primary">Top Deals ansehen</Link>
            <Link href="/wunschfahrzeug" className="btn">Wunschfahrzeug anfragen</Link>
          </div>
          <div className="hero-stats">
            <div className="hstat"><b>{fahrzeuge.length}</b><span>im Verkauf</span></div>
            <div className="hstat"><b>{top.length}</b><span>Top Deals</span></div>
            <div className="hstat"><b>{geld(ersparnis)}</b><span>Ersparnis aktuell</span></div>
            <div className="hstat"><b>995</b><span>Leitstelle</span></div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="wrap">
          <div className="sec-head">
            <h2>Frisch eingetroffen</h2>
            <span className="sec-sub">Schnell sein lohnt sich.</span>
            <Link href="/katalog" className="more">Alle Fahrzeuge →</Link>
          </div>
          <div className="grid">{frisch.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
          {frisch.length === 0 && <p className="empty">Noch keine Fahrzeuge online — schau bald wieder vorbei.</p>}
        </div>
      </div>

      {top.length > 0 && (
        <div className="section" style={{ paddingTop: 8 }}>
          <div className="wrap">
            <div className="sec-head">
              <h2>Top Deals</h2>
              <span className="sec-sub">Sparen und Sammelkarte sichern.</span>
              <Link href="/katalog?top=1" className="more">Alle Top Deals →</Link>
            </div>
            <div className="grid">{top.map((v) => <VehicleCard key={v.id} v={v} />)}</div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
