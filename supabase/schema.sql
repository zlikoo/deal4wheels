-- ============================================================
-- DEAL 4 WHEELS 2.0 — Datenbank-Schema
-- Im Supabase SQL Editor ausführen (einmalig, vor seed.sql).
-- ============================================================

-- ---------- Rang-System ----------
-- Reihenfolge: trainee < dealer < head < gfa < gf < it

create or replace function public.rang_stufe(r text)
returns int language sql immutable as $$
  select coalesce(array_position(array['trainee','dealer','head','gfa','gf','it'], r), 0);
$$;

-- ---------- Tabellen ----------

create table public.mitarbeiter (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Neues Teammitglied',
  rang text not null default 'trainee' check (rang in ('trainee','dealer','head','gfa','gf','it')),
  provision_prozent numeric not null default 10,
  aktiv boolean not null default false,
  created_at timestamptz not null default now()
);

-- Rang des eingeloggten Users (security definer: liest an RLS vorbei)
create or replace function public.mein_rang()
returns text language sql stable security definer set search_path = public as $$
  select rang from mitarbeiter where id = auth.uid() and aktiv = true;
$$;

create or replace function public.rang_min(min_r text)
returns boolean language sql stable as $$
  select public.rang_stufe(public.mein_rang()) >= public.rang_stufe(min_r);
$$;

create table public.fahrzeuge (
  id bigint generated always as identity primary key,
  name text not null,
  kategorie text not null default 'Mittelklasse',
  kennzeichen text,
  festpreis int not null,
  neupreis int,
  neupreis_ausstattung int,
  ek_preis int not null default 0,
  kraftstoff text not null default 'Benzin',
  tank_liter int,
  leistung_eingetragen boolean not null default false,
  alarmanlage text default 'Keine',
  inspektion date,
  tuning jsonb not null default '{"liste":[]}',
  bild_url text,
  status text not null default 'online' check (status in ('online','reserviert','garage','verkauft')),
  top_deal boolean not null default false,
  reduziert_von int,
  standzeit_start timestamptz not null default now(),
  erstellt_von uuid references public.mitarbeiter(id),
  notiz text,
  created_at timestamptz not null default now()
);

create table public.kunden (
  id bigint generated always as identity primary key,
  vorname text not null,
  nachname text not null default '',
  telefon text not null default '',
  kontonummer text,
  notiz text,
  created_at timestamptz not null default now()
);

create table public.verkaeufe (
  id bigint generated always as identity primary key,
  fahrzeug_id bigint references public.fahrzeuge(id),
  kunde_id bigint references public.kunden(id),
  preis int not null,
  rabatt_prozent numeric not null default 0,
  verkaeufer uuid references public.mitarbeiter(id),
  provision int not null default 0,
  provision_ausgezahlt boolean not null default false,
  ratenkauf boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ratenvertraege (
  id bigint generated always as identity primary key,
  fahrzeug_id bigint references public.fahrzeuge(id),
  kunde_id bigint references public.kunden(id),
  verkauf_id bigint references public.verkaeufe(id),
  restbetrag int not null,
  mindestzahlung int not null,
  raten_anzahl int not null default 4,
  beginn date not null default current_date,
  ablauf date,
  einzug date,
  wiederverkauf date,
  status text not null default 'laufend' check (status in ('laufend','bezahlt','eingezogen','wiederaufgenommen')),
  betreuer uuid references public.mitarbeiter(id),
  notiz text,
  sms_status text not null default 'offen' check (sms_status in ('ok','offen','fehler')),
  letzte_sms timestamptz,
  letzte_sms_von uuid references public.mitarbeiter(id),
  created_at timestamptz not null default now()
);

create table public.suchauftraege (
  id bigint generated always as identity primary key,
  name text not null,
  telefon text not null default '',
  fahrzeug text not null default '',
  preiswunsch text,
  sonderwunsch text,
  sonstiges text,
  status text not null default 'offen' check (status in ('offen','in_arbeit','erledigt')),
  created_at timestamptz not null default now()
);

create table public.buchungen (
  id bigint generated always as identity primary key,
  typ text not null check (typ in ('einnahme','ausgabe')),
  grund text not null,
  betrag int not null,
  fahrzeug_id bigint references public.fahrzeuge(id),
  mitarbeiter uuid references public.mitarbeiter(id),
  notiz text,
  created_at timestamptz not null default now()
);

create table public.ankuendigungen (
  id bigint generated always as identity primary key,
  titel text not null,
  text text not null,
  prioritaet text not null default 'info' check (prioritaet in ('info','wichtig','kritisch')),
  angepinnt boolean not null default false,
  ablauf date,
  autor uuid references public.mitarbeiter(id),
  created_at timestamptz not null default now()
);

create table public.ankuendigung_gelesen (
  ankuendigung_id bigint references public.ankuendigungen(id) on delete cascade,
  mitarbeiter_id uuid references public.mitarbeiter(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ankuendigung_id, mitarbeiter_id)
);

create table public.aktivitaetslog (
  id bigint generated always as identity primary key,
  mitarbeiter uuid references public.mitarbeiter(id),
  aktion text not null,
  details text,
  created_at timestamptz not null default now()
);

create table public.sms_vorlagen (
  id bigint generated always as identity primary key,
  name text unique not null,
  text text not null
);

create table public.einstellungen (
  schluessel text primary key,
  wert text not null
);

-- ---------- Öffentliche Sicht (ohne EK-Preis, Notizen etc.) ----------
-- Die Kundenseite liest NUR diese View. Auf die Basistabelle hat
-- "anon" keine Policy — Einkaufspreise bleiben intern.

create view public.fahrzeuge_public as
  select id, name, kategorie, kennzeichen, festpreis, neupreis,
         neupreis_ausstattung, kraftstoff, tank_liter, leistung_eingetragen,
         alarmanlage, inspektion, bild_url, top_deal, reduziert_von,
         status, created_at
  from public.fahrzeuge
  where status in ('online','reserviert');

grant select on public.fahrzeuge_public to anon, authenticated;

-- ---------- Neuer Auth-User -> automatisch Trainee (inaktiv) ----------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.mitarbeiter (id, name, rang, aktiv)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'trainee',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Schutz: Provisionssätze nur GF, GFA stuft nur bis Head ein ----------

create or replace function public.schutz_mitarbeiter_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.provision_prozent is distinct from old.provision_prozent
     and not public.rang_min('gf') then
    raise exception 'Provisionssätze darf nur die GF ändern.';
  end if;
  if new.rang is distinct from old.rang then
    if not public.rang_min('gf')
       and public.rang_stufe(new.rang) > public.rang_stufe('head') then
      raise exception 'GF-Assistenz darf nur bis Head Dealer einstufen.';
    end if;
  end if;
  return new;
end;
$$;

create trigger schutz_mitarbeiter
  before update on public.mitarbeiter
  for each row execute function public.schutz_mitarbeiter_update();

-- ---------- Row Level Security ----------

alter table public.mitarbeiter enable row level security;
alter table public.fahrzeuge enable row level security;
alter table public.kunden enable row level security;
alter table public.verkaeufe enable row level security;
alter table public.ratenvertraege enable row level security;
alter table public.suchauftraege enable row level security;
alter table public.buchungen enable row level security;
alter table public.ankuendigungen enable row level security;
alter table public.ankuendigung_gelesen enable row level security;
alter table public.aktivitaetslog enable row level security;
alter table public.sms_vorlagen enable row level security;
alter table public.einstellungen enable row level security;

-- Mitarbeiter: alle im Team sehen Namen/Ränge; ändern ab GF-Assistenz
create policy "team liest mitarbeiter" on public.mitarbeiter
  for select to authenticated using (true);
create policy "gfa verwaltet mitarbeiter" on public.mitarbeiter
  for update to authenticated using (public.rang_min('gfa')) with check (public.rang_min('gfa'));

-- Fahrzeuge: ganzes Team sieht alles (inkl. EK); schreiben ab Dealer
create policy "team liest fahrzeuge" on public.fahrzeuge
  for select to authenticated using (public.rang_min('trainee'));
create policy "dealer legt fahrzeuge an" on public.fahrzeuge
  for insert to authenticated with check (public.rang_min('dealer'));
create policy "dealer aendert fahrzeuge" on public.fahrzeuge
  for update to authenticated using (public.rang_min('dealer')) with check (public.rang_min('dealer'));
create policy "head loescht fahrzeuge" on public.fahrzeuge
  for delete to authenticated using (public.rang_min('head'));

-- Kunden: Team liest, ab Dealer schreiben
create policy "team liest kunden" on public.kunden
  for select to authenticated using (public.rang_min('trainee'));
create policy "dealer legt kunden an" on public.kunden
  for insert to authenticated with check (public.rang_min('dealer'));
create policy "dealer aendert kunden" on public.kunden
  for update to authenticated using (public.rang_min('dealer')) with check (public.rang_min('dealer'));

-- Verkäufe: Dealer sieht eigene, ab Head alle; anlegen ab Dealer; Provision-Auszahlung nur GF
create policy "eigene oder leitung liest verkaeufe" on public.verkaeufe
  for select to authenticated using (verkaeufer = auth.uid() or public.rang_min('head'));
create policy "dealer verkauft" on public.verkaeufe
  for insert to authenticated with check (public.rang_min('dealer'));
create policy "gf zahlt provisionen aus" on public.verkaeufe
  for update to authenticated using (public.rang_min('gf')) with check (public.rang_min('gf'));

-- Ratenverträge: Team liest (Trainee nur ansehen), ab Dealer schreiben
create policy "team liest raten" on public.ratenvertraege
  for select to authenticated using (public.rang_min('trainee'));
create policy "dealer legt raten an" on public.ratenvertraege
  for insert to authenticated with check (public.rang_min('dealer'));
create policy "dealer pflegt raten" on public.ratenvertraege
  for update to authenticated using (public.rang_min('dealer')) with check (public.rang_min('dealer'));

-- Suchaufträge: Kunden (anon) dürfen einreichen; Team liest; ab Dealer bearbeiten
create policy "kunden senden suchauftraege" on public.suchauftraege
  for insert to anon with check (true);
create policy "team sendet suchauftraege" on public.suchauftraege
  for insert to authenticated with check (true);
create policy "team liest suchauftraege" on public.suchauftraege
  for select to authenticated using (public.rang_min('trainee'));
create policy "dealer bearbeitet suchauftraege" on public.suchauftraege
  for update to authenticated using (public.rang_min('dealer')) with check (public.rang_min('dealer'));

-- Buchungen: entstehen ab Dealer (Ankauf/Verkauf/Raten); einsehen ab GF-Assistenz
create policy "dealer bucht" on public.buchungen
  for insert to authenticated with check (public.rang_min('dealer'));
create policy "gfa liest kassenbuch" on public.buchungen
  for select to authenticated using (public.rang_min('gfa'));

-- Ankündigungen: Team liest; schalten/löschen ab GF-Assistenz
create policy "team liest ankuendigungen" on public.ankuendigungen
  for select to authenticated using (public.rang_min('trainee'));
create policy "gfa schaltet ankuendigungen" on public.ankuendigungen
  for insert to authenticated with check (public.rang_min('gfa'));
create policy "gfa aendert ankuendigungen" on public.ankuendigungen
  for update to authenticated using (public.rang_min('gfa')) with check (public.rang_min('gfa'));
create policy "gfa loescht ankuendigungen" on public.ankuendigungen
  for delete to authenticated using (public.rang_min('gfa'));

-- Gelesen-Status: jeder pflegt seinen eigenen; GF-Assistenz sieht Statistik
create policy "eigenen gelesen status setzen" on public.ankuendigung_gelesen
  for insert to authenticated with check (mitarbeiter_id = auth.uid());
create policy "eigenen gelesen status aendern" on public.ankuendigung_gelesen
  for update to authenticated using (mitarbeiter_id = auth.uid()) with check (mitarbeiter_id = auth.uid());
create policy "gelesen status lesen" on public.ankuendigung_gelesen
  for select to authenticated using (mitarbeiter_id = auth.uid() or public.rang_min('gfa'));

-- Aktivitätslog: jeder schreibt eigene Einträge; einsehen ab Head
create policy "eigene aktionen loggen" on public.aktivitaetslog
  for insert to authenticated with check (mitarbeiter = auth.uid());
create policy "head liest log" on public.aktivitaetslog
  for select to authenticated using (public.rang_min('head'));

-- SMS-Vorlagen: Team liest; pflegen ab GF-Assistenz
create policy "team liest sms vorlagen" on public.sms_vorlagen
  for select to authenticated using (public.rang_min('trainee'));
create policy "gfa pflegt sms vorlagen" on public.sms_vorlagen
  for all to authenticated using (public.rang_min('gfa')) with check (public.rang_min('gfa'));

-- Einstellungen (z. B. Monatsziel): Team liest; ändern ab GF-Assistenz
create policy "team liest einstellungen" on public.einstellungen
  for select to authenticated using (public.rang_min('trainee'));
create policy "gfa pflegt einstellungen" on public.einstellungen
  for all to authenticated using (public.rang_min('gfa')) with check (public.rang_min('gfa'));

-- ---------- Storage: Bucket für Fahrzeugbilder ----------

insert into storage.buckets (id, name, public)
values ('fahrzeuge', 'fahrzeuge', true)
on conflict (id) do nothing;

create policy "fahrzeugbilder oeffentlich" on storage.objects
  for select using (bucket_id = 'fahrzeuge');
create policy "dealer laedt bilder hoch" on storage.objects
  for insert to authenticated with check (bucket_id = 'fahrzeuge' and public.rang_min('dealer'));
create policy "dealer aktualisiert bilder" on storage.objects
  for update to authenticated using (bucket_id = 'fahrzeuge' and public.rang_min('dealer'));
create policy "head loescht bilder" on storage.objects
  for delete to authenticated using (bucket_id = 'fahrzeuge' and public.rang_min('head'));
