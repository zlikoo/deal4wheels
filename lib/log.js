export async function logAktion(supabase, aktion, details = '') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('aktivitaetslog').insert({ mitarbeiter: user.id, aktion, details });
  } catch {}
}
