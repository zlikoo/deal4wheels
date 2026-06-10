import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import VehicleCard from '@/components/VehicleCard';
import BuyBox from './BuyBox';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function FahrzeugPage({ params }) {
  const supabase = createClient();
  const { data: v } = await supabase.from('fahrzeuge_public').select('*').eq('id', params.id).single();

  if (!v) {
    return (
      <>
        <PublicNav />
        <div className="wrap section">
          <h2 className="disp">Fahrzeug nicht gefunden</h2>
          <p className="muted" style={{ margin: '10px 0 18px' }}>Vermutlich schon verkauft — schnell sein lohnt sich eben.</p>
          <Link href="/katalog" className="btn primary">Zum Katalog</Link>
        </div>
        <Footer />
      </>
    );
  }

  const { data: aehnlich } = await supabase
    .from('fahrzeuge_public').select('*')
    .eq('kategorie', v.kategorie).neq('id', v.id).limit(3);

  return (
    <>
      <PublicNav />
      <div className="wrap" style={{ paddingTop: 20 }}>
        <div style={{ fontSize: 12.5, color: 'var(--faint)' }}>
          <Link href="/katalog">Katalog</Link> · {v.kategorie} · <b style={{ color: 'var(--muted)' }}>{v.name}</b>
        </div>
        <div className="detail">
          <div className="gallery">
            <div className="main">
              {v.bild_url ? <img src={v.bild_url} alt={v.name} /> : <div className="ph">Fahrzeugbild folgt</div>}
            </div>
            {aehnlich?.length > 0 && (
              <div className="section" style={{ paddingBottom: 0 }}>
                <div className="sec-head"><h2 style={{ fontSize: 21 }}>Ähnliche Fahrzeuge</h2></div>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(215px,1fr))' }}>
                  {aehnlich.map((a) => <VehicleCard key={a.id} v={a} />)}
                </div>
              </div>
            )}
          </div>
          <BuyBox v={v} />
        </div>
      </div>
      <Footer />
    </>
  );
}
