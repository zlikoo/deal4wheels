import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import KatalogClient from './KatalogClient';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function KatalogPage({ searchParams }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('fahrzeuge_public')
    .select('*')
    .order('created_at', { ascending: false });
  return (
    <>
      <PublicNav />
      <div className="wrap section">
        <div className="sec-head"><h2>Fahrzeugkatalog</h2><span className="sec-sub">Filtern statt blättern.</span></div>
        <KatalogClient fahrzeuge={data || []} initTop={searchParams?.top === '1'} />
      </div>
      <Footer />
    </>
  );
}
