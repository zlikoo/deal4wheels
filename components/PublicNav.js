import Link from 'next/link';

export default function PublicNav() {
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <Link href="/" className="logo">
          <div className="logo-badge">D4</div>
          <div className="logo-name">Deal 4 Wheels<small>Autopia Pkwy</small></div>
        </Link>
        <div className="nav-links">
          <Link href="/">Start</Link>
          <Link href="/katalog">Katalog</Link>
          <Link href="/katalog?top=1">Top Deals</Link>
          <Link href="/wunschfahrzeug">Wunschfahrzeug</Link>
        </div>
        <Link href="/login" className="login-link">Login</Link>
      </div>
    </nav>
  );
}
