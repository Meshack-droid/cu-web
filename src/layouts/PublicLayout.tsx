import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import tumcuLogo from '@/assets/tumcu-logo.png';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/events', label: 'Events' },
  { to: '/contact', label: 'Contact' },
];

export function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <div className="hidden bg-primary-900 text-white/80 md:block">
        <div className="page-shell flex items-center justify-between py-2 text-[11px] tracking-wide">
          <span>Technical University of Mombasa Christian Union</span>
          <span className="text-gold-400">Reaching every student • Equipping every believer</span>
        </div>
      </div>

      <header className="sticky top-3 z-50 mx-3 sm:mx-5 lg:mx-8">
        <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between rounded-[22px] border px-4 py-3 sm:px-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/80 ring-1 ring-primary-100">
              <img src={tumcuLogo} alt="TUMCU Christian Union seal" className="h-10 w-10 object-contain" />
            </div>
            <span className="leading-tight">
              <span className="block text-sm font-black tracking-wide text-primary-900">TUMCU</span>
              <span className="block text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Christian Union</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/15' : 'text-slate-600 hover:bg-white/70 hover:text-primary-700'}`}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              {isAuthenticated ? (
                <Link to="/dashboard" className="inline-flex items-center gap-1 rounded-full bg-primary-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-900/15">
                  Dashboard <ArrowUpRight size={15} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-white/70">Login</Link>
                  <Link to="/register" className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-primary-900 shadow-lg shadow-gold-500/20 hover:bg-gold-400">Join TUMCU</Link>
                </>
              )}
            </div>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-primary-900 ring-1 ring-black/5 md:hidden">
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>

        <div className={`mx-auto mt-2 max-w-7xl overflow-hidden rounded-[22px] border border-white/70 bg-white/80 shadow-2xl shadow-primary-900/10 backdrop-blur-xl transition-all duration-300 md:hidden ${menuOpen ? 'max-h-[500px] p-3 opacity-100' : 'max-h-0 border-transparent p-0 opacity-0'}`}>
          {navLinks.map((link) => <Link key={link.to} to={link.to} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-primary-50 hover:text-primary-700">{link.label}</Link>)}
          <div className="mt-2 border-t border-slate-200/70 pt-2">
            {isAuthenticated ? <Link to="/dashboard" className="block rounded-2xl bg-primary-900 px-4 py-3 text-center text-sm font-bold text-white">Dashboard</Link> : <div className="grid grid-cols-2 gap-2"><Link to="/login" className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-primary-700">Login</Link><Link to="/register" className="rounded-2xl bg-gold-500 px-4 py-3 text-center text-sm font-bold text-primary-900">Join TUMCU</Link></div>}
          </div>
        </div>
      </header>

      <main>
        {location.pathname !== '/' && (
          <div className="page-shell pt-4 pb-1">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs backdrop-blur-md hover:bg-white hover:text-primary-900 transition active:scale-95"
            >
              <ArrowLeft size={14} />
              <Home size={14} className="text-primary-700" />
              <span>Back to Home</span>
            </Link>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="relative overflow-hidden bg-primary-900 text-white">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="page-shell section-pad relative grid gap-10 md:grid-cols-[1.3fr_.7fr_.7fr]">
          <div>
            <div className="flex items-center gap-3"><img src={tumcuLogo} alt="TUMCU logo" className="h-12 w-12 rounded-full bg-white/90 p-1" /><div><div className="font-black tracking-wide">TUMCU</div><div className="text-xs text-white/60">Christian Union</div></div></div>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">A Christ-centred university community committed to prayer, the Word, fellowship, service and mission.</p>
          </div>
          <div><h3 className="font-bold">Explore</h3><div className="mt-4 space-y-3 text-sm text-white/65"><Link className="block hover:text-gold-400" to="/about">About TUMCU</Link><Link className="block hover:text-gold-400" to="/ministries">Ministries</Link><Link className="block hover:text-gold-400" to="/constitution">TUMCU Constitution 2024</Link><Link className="block hover:text-gold-400" to="/resources">Sermons & Resources</Link></div></div>
          <div><h3 className="font-bold">Connect</h3><div className="mt-4 space-y-3 text-sm text-white/65"><Link className="block hover:text-gold-400" to="/register">Become a Member</Link><Link className="block hover:text-gold-400" to="/elections">Leadership & Nominations</Link><Link className="block hover:text-gold-400" to="/events">See Upcoming Events</Link><Link className="block hover:text-gold-400" to="/contact">Contact the Union</Link><a href="mailto:tumcunion@gmail.com" className="block text-gold-400 hover:text-gold-300 font-medium transition">tumcunion@gmail.com</a></div></div>
        </div>
        <div className="border-t border-white/10"><div className="page-shell py-5 text-xs text-white/45">© {new Date().getFullYear()} Technical University of Mombasa Christian Union. All rights reserved.</div></div>
      </footer>
    </div>
  );
}
