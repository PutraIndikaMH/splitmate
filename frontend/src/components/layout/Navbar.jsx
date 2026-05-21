import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-4 left-4 right-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-[1240px] transition-all duration-300 ${
          scrolled
            ? 'bg-white/92 backdrop-blur-xl border border-outline-variant/50 shadow-[0_12px_40px_rgba(59,48,158,0.05)]'
            : 'bg-white/82 backdrop-blur-lg border border-outline-variant/30 shadow-[0_4px_20px_rgba(59,48,158,0.01)]'
        }`}
        style={{ height: '54px', borderRadius: '18px' }}
      >
        <div className="h-full flex items-center justify-between px-5 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="SplitMate" className="w-7 h-7 object-contain" />
            <span className="text-[14px] font-bold tracking-tight text-on-surface font-headline hidden sm:block">SplitMate</span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-1.5">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-3.5 py-1.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary rounded-[10px] hover:bg-primary/5 transition-all duration-200"
            >
              Home
            </a>
            <a
              href="#fitur"
              className="px-3.5 py-1.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary rounded-[10px] hover:bg-primary/5 transition-all duration-200"
            >
              Fitur
            </a>
            <a
              href="#cara-kerja"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('tentang-kami')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary rounded-[10px] hover:bg-primary/5 transition-all duration-200"
            >
              Cara Kerja
            </a>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-1.5 bg-primary text-on-primary text-[13px] font-semibold rounded-[10px] hover:brightness-110 active:scale-[0.97] transition-all duration-200 shrink-0 shadow-sm flex items-center gap-1.5"
              >
                Dashboard
                <span className="material-symbols-outlined text-[15px] font-semibold">dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:block text-[13px] font-medium text-on-surface-variant/80 hover:text-primary transition-colors duration-200"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-1.5 bg-primary text-on-primary text-[13px] font-semibold rounded-[10px] hover:brightness-110 active:scale-[0.97] transition-all duration-200 shrink-0 shadow-sm flex items-center gap-1"
                >
                  Mulai Gratis
                  <span className="material-symbols-outlined text-[15px] font-semibold">arrow_right_alt</span>
                </Link>
              </>
            )}
            {/* Hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-[10px] text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-colors duration-200"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className="material-symbols-outlined text-lg">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-on-surface/10 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-[78px] left-4 right-4 z-50 md:hidden bg-white/95 backdrop-blur-xl rounded-2xl border border-outline-variant/40 p-4 space-y-1.5 shadow-[0_16px_48px_rgba(59,48,158,0.08)] animate-in">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="block px-4 py-2.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
            >
              Home
            </a>
            <a
              href="#fitur"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
            >
              Fitur
            </a>
            <a
              href="#cara-kerja"
              onClick={() => {
                setMenuOpen(false);
                setTimeout(() => {
                  document.getElementById('tentang-kami')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="block px-4 py-2.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
            >
              Cara Kerja
            </a>
             <div className="pt-2 border-t border-outline-variant/30 mt-2 space-y-1.5">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-4 py-2.5 bg-primary text-on-primary text-[13px] font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-[13px] font-medium text-on-surface-variant/80 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 bg-primary text-on-primary text-[13px] font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200"
                  >
                    Mulai Gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
