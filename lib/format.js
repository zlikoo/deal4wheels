export const geld = (n) => '$ ' + Number(n || 0).toLocaleString('de-DE');
export const datum = (d) => (d ? new Date(d).toLocaleDateString('de-DE') : '—');
export const prozent = (alt, neu) => (alt > 0 ? Math.round((1 - neu / alt) * 100) : 0);
export const monatsanfang = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};
