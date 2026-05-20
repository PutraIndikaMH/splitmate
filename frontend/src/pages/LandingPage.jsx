import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── GSAP scroll reveal hook ── */
function useGsapReveal(containerRef) {
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      // Fade up elements
      gsap.utils.toArray('.g-fade-up').forEach(el => {
        gsap.from(el, {
          y: 60, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        });
      });
      // Staggered grid items
      gsap.utils.toArray('.g-stagger-parent').forEach(parent => {
        gsap.from(parent.querySelectorAll('.g-stagger-child'), {
          y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: parent, start: 'top 85%' },
        });
      });
      // Scale in
      gsap.utils.toArray('.g-scale-in').forEach(el => {
        gsap.from(el, {
          scale: 0.85, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });
      // Parallax BG orbs
      gsap.utils.toArray('.g-parallax-slow').forEach(el => {
        gsap.to(el, {
          y: -80,
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, [containerRef]);
}

/* ── GSAP hero timeline ── */
function useHeroTimeline(heroRef) {
  useLayoutEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('.hero-badge', { y: -30, opacity: 0, duration: 0.7, delay: 0.2 })
        .from('.hero-title-line', { y: 80, opacity: 0, duration: 0.9, stagger: 0.15 }, '-=0.3')
        .from('.hero-desc', { y: 30, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.hero-cta > *', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.3')
        .from('.hero-social', { y: 20, opacity: 0, duration: 0.6 }, '-=0.2')
        .from('.hero-card-main', { x: 80, opacity: 0, duration: 1, ease: 'power3.out' }, '-=0.8')
        .from('.hero-card-float', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.7)' }, '-=0.4')
        .from('.hero-scroll-hint', { opacity: 0, duration: 0.5 }, '-=0.2');
    }, heroRef);
    return () => ctx.revert();
  }, [heroRef]);
}

/* ── Animated counter (GSAP) ── */
function Counter({ end, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const valRef = useRef({ v: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const trigger = ScrollTrigger.create({
      trigger: ref.current, start: 'top 90%',
      onEnter: () => {
        gsap.to(valRef.current, {
          v: end, duration, ease: 'power2.out',
          onUpdate: () => { if (ref.current) ref.current.textContent = Math.floor(valRef.current.v).toLocaleString('id-ID') + suffix; },
        });
        trigger.kill();
      },
    });
    return () => trigger.kill();
  }, [end, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ── Mouse parallax for hero card ── */
function useParallax() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (window.innerWidth < 768) return;
    let raf;
    const handler = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24;
        const y = (e.clientY / window.innerHeight - 0.5) * 24;
        setOffset({ x, y });
      });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => { window.removeEventListener('mousemove', handler); cancelAnimationFrame(raf); };
  }, []);
  return offset;
}

const COLOR_STYLES = {
  primary: { iconBg: 'bg-primary/10', iconText: 'text-primary', hoverBorder: 'hover:border-primary/20', hoverShadow: 'hover:shadow-primary/5', lineBg: 'bg-primary/20' },
  secondary: { iconBg: 'bg-secondary/10', iconText: 'text-secondary', hoverBorder: 'hover:border-secondary/20', hoverShadow: 'hover:shadow-secondary/5', lineBg: 'bg-secondary/20' },
  tertiary: { iconBg: 'bg-amber-600/10', iconText: 'text-amber-700', hoverBorder: 'hover:border-amber-600/20', hoverShadow: 'hover:shadow-amber-600/5', lineBg: 'bg-amber-600/20' },
};

const FEATURES = [
  { icon: 'restaurant_menu', title: 'Split Otomatis', desc: 'Bagi tagihan makan, belanja, atau sewa rumah secara adil. Pilih bagi rata atau kustom dalam hitungan detik.', color: 'primary' },
  { icon: 'account_balance_wallet', title: 'Tracking Utang', desc: 'Pantau siapa yang berhutang dan kepada siapa secara real-time. Notifikasi otomatis tanpa merasa canggung.', color: 'secondary' },
  { icon: 'psychology', title: 'AI Insight', desc: 'Analisis mendalam gaya pengeluaranmu. Prediksi saldo dan tips menabung yang dipersonalisasi.', color: 'tertiary' },
  { icon: 'group', title: 'Grup Fleksibel', desc: 'Buat grup untuk trip, kos, atau acara. Undang teman via email, kelola lifecycle grup dengan mudah.', color: 'primary' },
  { icon: 'notifications_active', title: 'Buzz Reminder', desc: 'Kirim pengingat tagihan ke teman yang belum bayar. Tanpa drama, tanpa canggung.', color: 'secondary' },
  { icon: 'shield', title: 'Keamanan Premium', desc: 'Enkripsi bank-grade, httpOnly cookie auth, dan data tersimpan aman di cloud.', color: 'tertiary' },
];

const STEPS = [
  { num: '01', icon: 'group_add', title: 'Buat Grup', desc: 'Buat grup dan undang teman-temanmu' },
  { num: '02', icon: 'receipt_long', title: 'Catat Pengeluaran', desc: 'Tambah expense, pilih split type' },
  { num: '03', icon: 'calculate', title: 'Auto Hitung', desc: 'Sistem menghitung hutang optimal' },
  { num: '04', icon: 'handshake', title: 'Settle Up', desc: 'Lunasi hutang dengan satu klik' },
];

const TESTIMONIALS = [
  { name: 'Andi Pratama', role: 'Mahasiswa UI', text: 'SplitMate ngebantu banget buat atur patungan kos. Gak perlu lagi hitung manual di notes!', avatar: 'AP' },
  { name: 'Sarah Wijaya', role: 'Product Designer', text: 'UI-nya premium banget, gak nyangka app patungan bisa se-smooth ini. Love it!', avatar: 'SW' },
  { name: 'Rizky Maulana', role: 'Software Engineer', text: 'Fitur buzz reminder-nya genius. Temen gue langsung bayar tanpa harus ditagih manual.', avatar: 'RM' },
  { name: 'Dina Safira', role: 'Travel Blogger', text: 'Setiap trip bareng temen, SplitMate jadi app wajib. Split custom per item? Yes please!', avatar: 'DS' },
];

const LandingPage = () => {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const p = useParallax();

  useGsapReveal(containerRef);
  useHeroTimeline(heroRef);

  return (
    <div ref={containerRef} className="bg-surface text-on-surface min-h-screen overflow-x-hidden">
      <Navbar />

      <main>
        {/* ══════════ HERO ══════════ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center pt-32 md:pt-40 lg:pt-20 overflow-hidden">
          {/* BG orbs */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="g-parallax-slow absolute top-20 -left-32 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-pulse-glow" />
            <div className="g-parallax-slow absolute bottom-20 -right-32 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 relative z-10">
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-sm font-semibold">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                #1 Bill Splitting App Indonesia
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08]">
                <span className="hero-title-line block"><span className="gradient-text">Patungan</span></span>
                <span className="hero-title-line block">Tanpa Ribet,</span>
                <span className="hero-title-line block relative">
                  Tanpa Drama
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none"><path d="M2 8c50-6 100-6 150-2s100 2 146-4" stroke="#006c4e" strokeWidth="3" strokeLinecap="round" opacity="0.5" /></svg>
                </span>
              </h1>

              <p className="hero-desc text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
                Bagi tagihan, lacak utang, dan dapatkan insight keuangan cerdas bersama teman-temanmu. Semua dalam satu aplikasi premium.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2 w-full">
                <Link to="/register" className="shine-hover bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary/25 active:scale-[0.97] transition-all duration-300 text-center">
                  Mulai Gratis
                  <span className="material-symbols-outlined ml-2 align-middle text-xl">arrow_forward</span>
                </Link>
                <button
                  onClick={() => document.getElementById('fitur')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group border-2 border-outline-variant text-on-surface px-8 py-4 rounded-2xl font-bold text-lg hover:border-primary hover:text-primary active:scale-[0.97] transition-all duration-300 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined mr-2 group-hover:translate-y-1 transition-transform">expand_more</span>
                  Explore Fitur
                </button>
              </div>

              {/* Social proof mini */}
              <div className="hero-social flex flex-col sm:flex-row items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {['bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400'].map((c, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {['A', 'S', 'R', 'D'][i]}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                  </div>
                  <p className="text-xs text-on-surface-variant">Dipercaya <strong>500K+</strong> pengguna</p>
                </div>
              </div>
            </div>

            {/* Right — floating cards hero visual */}
            <div className="hidden lg:flex relative justify-end">
              <div className="hero-card-main relative w-80 md:w-96" style={{ transform: `translate(${p.x * 0.3}px, ${p.y * 0.3}px)` }}>
                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 p-6 border border-slate-100 relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-body">Total Saldo</p>
                        <p className="text-xl font-bold font-headline">Rp 2.450.000</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full">+12%</span>
                  </div>
                  {/* Mini chart bars */}
                  <div className="flex items-end gap-1.5 h-16 mb-4">
                    {[40, 65, 45, 80, 60, 90, 70, 55, 85, 75, 95, 68].map((h, i) => (
                      <div key={i} className="flex-1 rounded-full transition-all duration-500" style={{ height: `${h}%`, background: i >= 9 ? '#3b309e' : '#e5e1eb', animationDelay: `${i * 80}ms` }} />
                    ))}
                  </div>
                  {/* Activity items */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
                      <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-lg">restaurant</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Lunch Bareng</p>
                        <p className="text-xs text-slate-400">3 orang • Bagi rata</p>
                      </div>
                      <span className="text-sm font-bold text-primary">-Rp 45k</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">home</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Listrik Kos</p>
                        <p className="text-xs text-slate-400">5 orang • Custom split</p>
                      </div>
                      <span className="text-sm font-bold text-secondary">Lunas ✓</span>
                    </div>
                  </div>
                </div>

                {/* Floating badge top-right */}
                <div className="hero-card-float absolute -top-4 -right-4 bg-secondary text-white px-4 py-2.5 rounded-2xl shadow-lg shadow-secondary/30 z-20 animate-float" style={{ transform: `translate(${p.x * -0.5}px, ${p.y * -0.5}px)` }}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    <span className="font-bold text-sm">Hemat 23%</span>
                  </div>
                </div>

                {/* Floating badge bottom-left */}
                <div className="hero-card-float absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 animate-float-delay" style={{ transform: `translate(${p.x * -0.4}px, ${p.y * -0.4}px)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Buzz dikirim!</p>
                      <p className="text-sm font-bold">Andi • Rp 45k</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hero-scroll-hint hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-on-surface-variant/50">
            <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
            <div className="w-6 h-10 rounded-full border-2 border-current flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-current rounded-full animate-bounce" />
            </div>
          </div>
        </section>


        {/* ══════════ FEATURES BENTO GRID ══════════ */}
        <section className="py-24 md:py-32 bg-surface" id="fitur">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="g-fade-up text-sm font-bold text-primary tracking-widest uppercase mb-4">Fitur Unggulan</p>
              <h2 className="g-fade-up text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Kelola Keuangan<br /><span className="gradient-text">Tanpa Drama</span>
              </h2>
              <p className="g-fade-up text-on-surface-variant text-lg mt-4">Lupakan hitung-hitungan manual. SplitMate menangani segalanya untukmu.</p>
            </div>

            <div className="g-stagger-parent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => {
                const cs = COLOR_STYLES[f.color];
                return (
                  <div key={i} className={`g-stagger-child group relative bg-surface-container-lowest p-8 rounded-3xl border border-transparent ${cs.hoverBorder} hover:shadow-2xl ${cs.hoverShadow} transition-all duration-500 cursor-default`}>
                    <div className={`w-14 h-14 rounded-2xl ${cs.iconBg} flex items-center justify-center ${cs.iconText} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 font-headline">{f.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed text-[15px]">{f.desc}</p>
                    <div className={`absolute bottom-0 left-8 right-8 h-0.5 ${cs.lineBg} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full`} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section className="py-24 md:py-32 bg-surface-container-low relative overflow-hidden" id="tentang-kami">
          {/* BG deco */}
          <div className="g-parallax-slow absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="g-fade-up text-sm font-bold text-secondary tracking-widest uppercase mb-4">Cara Kerja</p>
              <h2 className="g-fade-up text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Semudah <span className="gradient-text">4 Langkah</span>
              </h2>
            </div>

            <div className="g-stagger-parent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((s, i) => (
                <div key={i} className="g-stagger-child relative group">
                  <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container-high hover:border-primary/20 transition-all duration-500 h-full">
                    <span className="text-6xl font-extrabold text-primary/8 group-hover:text-primary/15 transition-colors absolute top-4 right-6 font-headline">{s.num}</span>
                    <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 font-headline">{s.title}</h3>
                    <p className="text-on-surface-variant text-sm">{s.desc}</p>
                  </div>
                  {/* Connector line */}
                  {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-primary/20" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ STATS ══════════ */}
        <section className="py-20 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent)] " />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="g-stagger-parent grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {[
                { end: 500000, suffix: '+', label: 'Pengguna Aktif' },
                { end: 12, suffix: 'M+', label: 'Transaksi Dicatat' },
                { end: 99, suffix: '.9%', label: 'Akurasi Kalkulasi' },
                { end: 4, suffix: '.9 ⭐', label: 'Rating Pengguna' },
              ].map((s, i) => (
                <div key={i} className="g-stagger-child">
                  <p className="text-3xl md:text-5xl font-extrabold font-headline mb-2">
                    <Counter end={s.end} suffix={s.suffix} />
                  </p>
                  <p className="text-white/60 text-sm font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ TESTIMONIALS ══════════ */}
        <section className="py-24 md:py-32 bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <p className="g-fade-up text-sm font-bold text-primary tracking-widest uppercase mb-4">Testimoni</p>
              <h2 className="g-fade-up text-4xl md:text-5xl font-extrabold tracking-tight">
                Apa Kata <span className="gradient-text">Mereka</span>
              </h2>
            </div>

            <div className="g-stagger-parent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="g-stagger-child group bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(5)].map((_, j) => <span key={j} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-surface-container-high">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-on-surface-variant">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="g-scale-in relative bg-primary rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent)]" />
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/20 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight font-headline leading-tight">
                Siap Hidup Bebas<br />Drama Finansial?
              </h2>
              <p className="text-white/70 text-lg md:text-xl max-w-xl mx-auto">
                Gabung dengan 500.000+ pengguna yang sudah merasakan kemudahan mengelola keuangan bersama.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link to="/register" className="shine-hover bg-white text-primary px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-50 transition-all active:scale-[0.97] shadow-xl inline-flex items-center justify-center gap-2">
                  Daftar Sekarang
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link to="/login" className="border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition-all active:scale-[0.97] inline-block text-center">
                  Sudah Punya Akun
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
