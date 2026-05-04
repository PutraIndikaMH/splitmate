import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 pt-4 transition-all duration-500">
        <div
          className={`flex items-center justify-between w-full max-w-4xl px-3 py-2.5 rounded-full border transition-all duration-500 ${scrolled
            ? 'bg-white/50 backdrop-blur-xl shadow-lg shadow-black/5 border-white/40'
            : 'bg-white/30 backdrop-blur-lg shadow-md shadow-black/5 border-white/20'
            }`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center w-11 h-11 hover:opacity-90 transition-all duration-300 shrink-0"
          >
            <img src="/logo.png" alt="SplitMate Logo" className="w-full h-full object-contain" />
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-2">

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2 text-sm font-semibold text-on-surface/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300 font-body"
            >
              Home
            </a>
            <a
              href="#fitur"
              className="px-5 py-2 text-sm font-semibold text-on-surface/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300 font-body"
            >
              Fitur
            </a>
            <a
              href="#tentang-kami"
              className="px-5 py-2 text-sm font-semibold text-on-surface/70 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300 font-body"
            >
              Cara Kerja
            </a>

          </div>

          {/* Right side: Hamburger (mobile) + CTA */}
          <div className="flex items-center gap-2">
            {/* CTA Button */}
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-all duration-300 active:scale-95 shrink-0 font-body"
            >
              Mulai Gratis
            </Link>

            {/* Hamburger (Mobile only) */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className="material-symbols-outlined text-on-surface">
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-20 left-6 right-6 z-50 md:hidden bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-4 space-y-1 animate-in">
            <a
              href="#fitur"
              onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-semibold text-on-surface/70 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-300 font-body"
            >
              Fitur
            </a>
            <a
              href="#tentang-kami"
              onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-semibold text-on-surface/70 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-300 font-body"
            >
              Cara Kerja
            </a>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-300 font-body"
            >
              Masuk
            </Link>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
