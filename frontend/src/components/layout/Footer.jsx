import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-surface border-t border-outline-variant/60 font-body relative overflow-hidden">
      {/* Visual echo of the hero top gradient at the very top of the footer */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30" />

      <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-outline-variant/40">
          {/* Column 1: Brand & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SplitMate Logo" className="w-8 h-8 object-contain" />
              <span className="text-sm font-medium tracking-[0.2px] text-on-surface">SplitMate</span>
            </Link>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-[240px]">
              Precision Fluidity in Finance. Solusi bagi generasi modern untuk membagi pengeluaran tanpa hambatan.
            </p>
          </div>

          {/* Column 2: Produk */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Produk</h4>
            <ul className="space-y-2">
              <li>
                <a href="#fitur" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Split Otomatis
                </a>
              </li>
              <li>
                <a href="#fitur" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Tracking Utang
                </a>
              </li>
              <li>
                <a href="#fitur" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  AI Insight
                </a>
              </li>
              <li>
                <a href="#fitur" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Buzz Reminder
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Sumber Daya */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Bantuan</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Pusat Bantuan
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Hubungi Kami
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Tips Hemat
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Perusahaan */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Privasi
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Keamanan Data
                </a>
              </li>
              <li>
                <a href="#" className="text-xs text-on-surface-variant hover:text-primary transition-colors duration-200">
                  Karir
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div className="lg:col-span-1 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Tips Cerdas</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Langganan tips mengelola keuangan harian kamu gratis.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Email kamu"
                className="w-full bg-surface-container text-xs text-on-surface placeholder-on-surface-variant/50 px-3 py-2 rounded-lg border border-outline-variant/60 focus:outline-none focus:border-primary/60 transition-colors duration-200"
              />
              <button
                type="submit"
                className="w-full bg-primary text-on-primary text-[11px] font-medium tracking-[0.2px] py-2 rounded-lg hover:brightness-110 transition-all duration-200 active:scale-[0.98]"
              >
                Langganan
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-4">
          <p className="text-[11px] text-on-surface-variant">
            © {new Date().getFullYear()} SplitMate. Precision Fluidity in Finance. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors duration-200" aria-label="Github">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors duration-200" aria-label="Twitter">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
