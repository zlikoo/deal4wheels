-- ============================================================
-- DEAL 4 WHEELS 2.0 — Seed-Daten
-- Nach schema.sql im Supabase SQL Editor ausführen.
-- ============================================================

-- ---------- Fahrzeuge (Bestand von dealfourwheels.com) ----------
insert into public.fahrzeuge
  (name, kategorie, kennzeichen, festpreis, neupreis, neupreis_ausstattung, ek_preis, kraftstoff, tank_liter, leistung_eingetragen, alarmanlage, inspektion, top_deal, bild_url)
values
  ('Dominator GT', 'Muscle Car', '3DBJ1105', 20140, 34740, null, 14500, 'Benzin', 35, true,  'Stufe 1', current_date + 30, true,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1426_1780401200.png'),
  ('Oracle', 'Luxusklasse', '1XXX6071', 10500, 15100, null, 7200, 'Benzin', 40, false, 'Keine', current_date + 45, false,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1383_1779562596.png'),
  ('Dominator GT Coupe', 'Muscle Car', '4CLO1988', 44500, null, 94740, 31000, 'Benzin', 35, true, 'Stufe 2', current_date + 20, true,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1354_1778756187.png'),
  ('Sadler', 'Offroad/SUV', '7SDL3320', 13000, 20000, null, 9000, 'Diesel', 60, false, 'Keine', current_date + 60, false,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1331_1778255861.png'),
  ('Torero XO', 'Sportwagen', '6TXO6549', 91500, 168100, null, 68000, 'Benzin', 45, true, 'Stufe 2', current_date + 15, true,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1311_1777728855.png'),
  ('TailgaterS', 'Mittelklasse', '2TGS8841', 24900, 38500, null, 17800, 'Benzin', 45, false, 'Stufe 1', current_date + 50, false,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1451_1781118927.png'),
  ('Terminus', 'Offroad/SUV', '8TRM4412', 31500, 47900, null, 22500, 'Diesel', 65, false, 'Stufe 1', current_date + 40, false,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1450_1781104589.png'),
  ('Vigero ZX Widebody', 'Muscle Car', '5VZX9907', 58900, 89200, null, 42000, 'Benzin', 40, true, 'Stufe 2', current_date + 25, true,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1447_1781038220.png'),
  ('Elegy Retro Custom', 'Sportwagen', '9ERC1287', 67400, 104500, null, 49500, 'Benzin', 42, true, 'Stufe 2', current_date + 35, false,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1446_1781030891.png'),
  ('Greenwood', 'Mittelklasse', '1GRW7733', 11900, 17800, null, 8200, 'Benzin', 50, false, 'Keine', current_date - 5, false,
   'https://dealfourwheels.com/assets/uploads/fahrzeuge/fahrzeug_1444_1781028967.png');

-- ---------- Kunden ----------
insert into public.kunden (vorname, nachname, telefon, kontonummer) values
  ('Omar', 'Walker', '5551-2284', 'US88 1042 5512'),
  ('Marlon', 'Dalton', '5559-7741', 'US31 8830 2291'),
  ('Lena', 'Vance', '5554-0913', null);

-- ---------- SMS-Vorlage für Ratenverträge ----------
insert into public.sms_vorlagen (name, text) values
  ('rate_faellig', 'Hallo {name}, hier Deal 4 Wheels. Deine Rate über {betrag} für den {fahrzeug} ({kennzeichen}) ist bis {frist} fällig. Bei Fragen einfach melden — Leitstelle 995. Beste Grüße, dein D4W-Team');

-- ---------- Einstellungen ----------
insert into public.einstellungen (schluessel, wert) values
  ('monatsziel', '270000');

-- ---------- Beispiel-Suchaufträge ----------
insert into public.suchauftraege (name, telefon, fahrzeug, preiswunsch, sonderwunsch, status) values
  ('Omar Walker', '5551-2284', 'Itali GTO', '$ 150.000', 'Schwarz, Vollausstattung', 'offen'),
  ('Tessa Brook', '5556-3358', 'Bati 801', '$ 18.000', null, 'in_arbeit'),
  ('Ricky Fontaine', '5552-9090', 'Sandking XL', '$ 45.000', 'Offroad-Paket', 'offen');

-- ============================================================
-- WICHTIG: Dein erstes Konto freischalten
-- ============================================================
-- 1. In Supabase: Authentication -> Users -> "Add user" (E-Mail + Passwort,
--    "Auto Confirm User" anhaken).
-- 2. Danach dieses SQL ausführen (E-Mail anpassen):
--
-- update public.mitarbeiter
--   set rang = 'it', aktiv = true, name = 'Raymond Bileano'
--   where id = (select id from auth.users where email = 'deine@mail.de');
--
-- Damit hast du vollen Zugriff und schaltest alle weiteren
-- Teammitglieder bequem über die Mitarbeiter-Seite frei.
