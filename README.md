# Deal 4 Wheels 2.0

Komplett-Neubau der Webseite + des internen Systems für den Gebrauchtwagenhandel
**Deal 4 Wheels** (Unity-life.de Roleplay). Läuft zu 100 % auf kostenlosen Tarifen:

- **Next.js 14** — Webseite & internes System in einem Projekt
- **Supabase (Free)** — Datenbank, Login, Bild-Speicher, Rechtesystem
- **Vercel (Hobby)** — Hosting & automatisches Deployment
- **GitHub** — Code-Verwaltung

---

## Was steckt drin?

**Öffentliche Seite** (`/`): Startseite mit Top Deals, Katalog mit Filtern
(Kategorie, Preis, Kraftstoff, Leistung), Fahrzeug-Detailseiten mit Ratenrechner
und Anfrage-Button, Wunschfahrzeug-Formular. Einkaufspreise sind hier technisch
unsichtbar (eigene Datenbank-View).

**Internes System** (`/intern`, mit Login): Dashboard mit Aufgabenliste
(fällige Raten, SMS-Probleme, abgelaufene Inspektionen, Standzeit-Wächter),
Bestand, Ankauf mit Bild-Upload und Margen-Check, Verkauf mit Live-Rechnung,
Provision und Ratenkauf, Ratenverträge mit SMS-Copy-Workflow, Suchaufträge,
Kunden-Akten, Finanzen mit Kassenbuch und Monatsziel, Ankündigungen mit
Lesebestätigung, Mitarbeiterverwaltung mit Provisionsauszahlung.

**Rechtesystem** mit 6 Rängen (Trainee → Dealer → Head Dealer → GF-Assistenz →
GF → IT), abgesichert direkt in der Datenbank (Row Level Security) — nicht nur
versteckte Buttons.

---

## Einrichtung in 5 Schritten (ca. 20 Minuten)

### Schritt 1 — Supabase-Projekt anlegen

1. Auf [supabase.com](https://supabase.com) kostenlos registrieren → **New project**.
2. Name z. B. `deal4wheels`, Region `eu-central-1 (Frankfurt)`, Datenbank-Passwort
   sicher speichern.
3. Warten bis das Projekt bereit ist (ca. 2 Min).

### Schritt 2 — Datenbank aufsetzen

1. Links **SQL Editor** öffnen → **New query**.
2. Den kompletten Inhalt von `supabase/schema.sql` einfügen → **Run**.
   (Es darf keine rote Fehlermeldung erscheinen.)
3. Neue Query: Inhalt von `supabase/seed.sql` einfügen → **Run**.
   Damit sind die 10 Fahrzeuge, Beispielkunden und die SMS-Vorlage drin.

### Schritt 3 — Dein Konto anlegen und freischalten

1. Links **Authentication → Users → Add user**: deine E-Mail + Passwort,
   Haken bei **Auto Confirm User** → anlegen.
2. Zurück in den **SQL Editor**, dieses SQL ausführen (E-Mail + Name anpassen):

   ```sql
   update public.mitarbeiter
     set rang = 'it', aktiv = true, name = 'Raymond Bileano'
     where id = (select id from auth.users where email = 'deine@mail.de');
   ```

3. **Empfohlen:** Unter **Authentication → Sign In / Up** die Option
   „Allow new users to sign up" **deaktivieren** — neue Konten legst nur du
   (oder die GF) über das Supabase-Dashboard an. Jedes neue Konto erscheint
   automatisch als inaktiver Trainee im internen System und wird dort
   freigeschaltet und eingestuft.

### Schritt 4 — Code zu GitHub

**Variante A — mit Git (empfohlen):**

```bash
cd deal4wheels
git init
git add .
git commit -m "Deal 4 Wheels 2.0"
```

Auf [github.com](https://github.com) → **New repository** (z. B. `deal4wheels`,
Private) → dann:

```bash
git remote add origin https://github.com/DEIN-NAME/deal4wheels.git
git branch -M main
git push -u origin main
```

**Variante B — ohne Git:** Neues Repository auf GitHub anlegen → Link
„uploading an existing file" anklicken → alle Dateien/Ordner aus diesem
Projekt per Drag & Drop hochziehen → Commit. (Versteckte Dateien wie
`.gitignore` ggf. im Datei-Manager einblenden.)

### Schritt 5 — Vercel-Deployment

1. Auf [vercel.com](https://vercel.com) mit GitHub anmelden → **Add New →
   Project** → dein `deal4wheels`-Repository importieren.
2. Unter **Environment Variables** zwei Einträge anlegen
   (Werte findest du in Supabase unter **Settings → API**):

   | Name | Wert |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public Key |

3. **Deploy** klicken. Nach 1–2 Minuten ist die Seite live unter
   `deal4wheels.vercel.app` (eigene Domain wie dealfourwheels.com kannst du
   später unter Settings → Domains verbinden).

Jede Änderung, die du auf GitHub pushst, wird ab jetzt automatisch deployt.

---

## Lokal entwickeln (optional)

```bash
npm install
cp .env.example .env.local   # und die zwei Werte eintragen
npm run dev                  # -> http://localhost:3000
```

---

## Ränge & Rechte (Kurzfassung)

| Bereich | Trainee | Dealer | Head | GF-Assistenz | GF | IT |
|---|---|---|---|---|---|---|
| Bestand, Katalog, EK-Preise sehen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ankauf / Verkauf | – | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ratenverträge pflegen | ansehen | ✓ | ✓ | ✓ | ✓ | ✓ |
| Umsätze sehen | – | nur eigene | alle | alle | alle | alle |
| Kassenbuch, manuelle Buchung | – | – | – | ✓ | ✓ | ✓ |
| Ankündigungen schalten | – | – | – | ✓ | ✓ | ✓ |
| Mitarbeiter einstufen | – | – | – | bis Head | ✓ | ✓ |
| Provisionssätze & Auszahlung | – | – | – | – | ✓ | ✓ |

Die Rechte stecken in der Datenbank (`schema.sql`) — auch wer die API direkt
anspricht, kommt nicht an Daten vorbei, die sein Rang nicht erlaubt.

## SMS-Versand (Copy & Paste)

Es wird nichts wirklich versendet (kostenlos!): Auf der Raten-Seite steht der
fertige Text mit Name, Fahrzeug, Betrag und Frist. **Text kopieren** → im Spiel
einfügen → zurück auf der Seite **Als gesendet markieren**. Bei kaputter Nummer
**Nummer ungültig** klicken — der Vertrag erscheint dann rot im Dashboard.

## Bekannte Punkte

- Die Seed-Fahrzeugbilder verlinken auf die alte Seite (dealfourwheels.com).
  Solange die online ist, passt das; neue Fahrzeuge laden ihre Bilder in den
  eigenen Supabase-Speicher.
- Geplant für die nächste Runde: Schwarzes Brett, Trainee-Freigabe-Workflow,
  Kommissions-Modul, Fahrzeugvergleich, Discord-Webhooks.

---

*Fiktive Webseite für das Roleplay-Projekt Unity-life.de · entwickelt von Raymond Bileano*
