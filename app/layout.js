import './globals.css';

export const metadata = {
  title: 'Deal 4 Wheels — Dein Gebrauchtwagenhandel No. 1',
  description: 'Gebrauchtwagenhandel auf der Autopia Pkwy. Fiktive Webseite für das Roleplay-Projekt Unity-life.de.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
