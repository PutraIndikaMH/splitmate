import React, { useEffect, useRef, useState, useLayoutEffect, useContext } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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
        gsap.fromTo(el, 
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
          }
        );
      });
      // Staggered grid items
      gsap.utils.toArray('.g-stagger-parent').forEach(parent => {
        gsap.fromTo(parent.querySelectorAll('.g-stagger-child'), {
          y: 30, opacity: 0
        }, {
          y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.08,
          scrollTrigger: { trigger: parent, start: 'top 88%' },
        });
      });
      // Scale in
      gsap.utils.toArray('.g-scale-in').forEach(el => {
        gsap.fromTo(el, {
          scale: 0.92, opacity: 0
        }, {
          scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
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
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero-badge', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1 })
        .fromTo('.hero-title-line', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 }, '-=0.3')
        .fromTo('.hero-desc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.4')
        .fromTo('.hero-cta > *', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, '-=0.3')
        .fromTo('.hero-social', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2')
        .fromTo('.hero-palette-mockup', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.6');
    }, heroRef);
    return () => ctx.revert();
  }, [heroRef]);
}

/* ── Animated counter (GSAP) ── */
function Counter({ end, suffix = '', duration = 1.5 }) {
  const ref = useRef(null);
  const valRef = useRef({ v: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const trigger = ScrollTrigger.create({
      trigger: ref.current, start: 'top 92%',
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

const COMMANDS = [
  {
    id: 0,
    icon: 'receipt_long',
    title: 'Split tagihan baru',
    shortcut: '⌘ E',
    previewTitle: 'Makan Malam 🍕',
    amount: 'Rp 300.000',
    method: 'Bagi Rata',
    members: [
      { name: 'Andi', letter: 'A', status: 'Rp 100.000', color: 'bg-primary text-on-primary' },
      { name: 'Sarah', letter: 'S', status: 'Rp 100.000', color: 'bg-secondary text-on-secondary' },
      { name: 'Kamu', letter: 'K', status: 'Rp 100.000', color: 'bg-slate-200 text-slate-800' }
    ]
  },
  {
    id: 1,
    icon: 'notifications_active',
    title: 'Buzz anggota grup',
    shortcut: '⌘ B',
    previewTitle: 'Kirim Buzz ⚡',
    amount: 'Kos Harmoni 🏠',
    method: 'Notifikasi Otomatis',
    members: [
      { name: 'Andi', letter: 'A', status: 'Belum Bayar Rp 45k', color: 'bg-primary text-on-primary', buzz: true },
      { name: 'Rizky', letter: 'R', status: 'Belum Bayar Rp 20k', color: 'bg-amber-500 text-white', buzz: true }
    ]
  },
  {
    id: 2,
    icon: 'psychology',
    title: 'Tanya AI Insight',
    shortcut: '⌘ AI',
    previewTitle: 'AI Insight Cerdas 🧠',
    amount: 'Gaya Pengeluaran',
    method: 'Rekomendasi Cerdas',
    insightText: 'Pengeluaran makan luar naik 15% dari rata-rata bulan lalu. Prediksi saldo akhir bulan aman jika patungan kos selesai tepat waktu.'
  }
];

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
  const { user } = useContext(AuthContext);
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const [activeCommand, setActiveCommand] = useState(0);
  const [billAmount, setBillAmount] = useState(150000);
  const [splitType, setSplitType] = useState('rata');

  // Command Palette simulation auto-cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCommand((prev) => (prev + 1) % COMMANDS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useGsapReveal(containerRef);
  useHeroTimeline(heroRef);

  const activeCmdData = COMMANDS[activeCommand];

  return (
    <div ref={containerRef} className="landing-page bg-surface text-on-surface min-h-screen overflow-x-hidden relative font-body">
      <Navbar />

      {/* Floating Premium Orbs for Raycast Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="orb orb-1 top-[10%] left-[5%]" />
        <div className="orb orb-2 top-[25%] right-[5%]" />
        <div className="orb orb-3 top-[55%] left-[15%]" />
      </div>

      <main className="relative z-10">
        {/* ══════════ HERO ══════════ */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-16 lg:pb-12 overflow-hidden">
          
          {/* Low-Opacity Diagonal Stripe Gradient per DESIGN.md */}
          <div className="absolute top-0 right-0 left-0 h-[480px] overflow-hidden -z-10 opacity-[0.08] pointer-events-none">
            <div className="absolute -top-[120px] -right-[100px] w-[900px] h-[160px] bg-gradient-to-r from-primary to-secondary rotate-[22deg]" />
            <div className="absolute -top-[40px] -right-[150px] w-[1000px] h-[160px] bg-gradient-to-r from-primary to-secondary rotate-[22deg]" />
            <div className="absolute top-[40px] -right-[200px] w-[1100px] h-[160px] bg-gradient-to-r from-primary to-secondary rotate-[22deg]" />
          </div>

          <div className="max-w-[1240px] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left text */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 relative z-10">
              <div className="hero-badge inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold">
                <span className="material-symbols-outlined text-sm font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                #1 Bill Splitting App Indonesia
              </div>

              <h1 className="text-4xl md:text-[56px] font-semibold tracking-tight leading-[1.1] text-on-surface">
                <span className="hero-title-line block">Patungan</span>
                <span className="hero-title-line block">Tanpa Ribet,</span>
                <span className="hero-title-line block text-shimmer font-bold">Tanpa Drama.</span>
              </h1>

              <p className="hero-desc text-sm md:text-base text-on-surface-variant max-w-md leading-relaxed">
                Bagi tagihan, lacak utang, dan dapatkan insight keuangan cerdas bersama teman-temanmu. Semua dalam satu aplikasi premium.
              </p>

              <div className="hero-cta flex flex-row justify-center lg:justify-start gap-3 pt-2 w-full">
                {user ? (
                  <Link to="/dashboard" className="shine-hover bg-primary text-on-primary px-8 py-3 rounded-lg font-medium text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center flex items-center gap-1.5">
                    Ke Dashboard
                    <span className="material-symbols-outlined text-[16px] font-semibold">dashboard</span>
                  </Link>
                ) : (
                  <Link to="/register" className="shine-hover bg-primary text-on-primary px-6 py-3 rounded-lg font-medium text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center">
                    Mulai Gratis
                  </Link>
                )}
                <button
                  onClick={() => document.getElementById('fitur')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 rounded-lg border border-outline-variant/60 hover:bg-surface-container-low text-on-surface font-medium text-sm active:scale-[0.98] transition-all duration-200"
                >
                  Explore Fitur
                </button>
              </div>

              {/* Social proof mini */}
              <div className="hero-social flex items-center gap-3 pt-3">
                <div className="flex -space-x-2.5">
                  {['bg-primary/20 text-primary', 'bg-secondary/20 text-secondary', 'bg-amber-500/20 text-amber-700', 'bg-red-500/20 text-red-700'].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-surface flex items-center justify-center text-xs font-bold font-headline`}>
                      {['A', 'S', 'R', 'D'][i]}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-medium">Dipercaya <strong>500K+</strong> pengguna aktif</p>
                </div>
              </div>
            </div>

            {/* Right: Premium Interactive Command Palette Mockup (DESIGN.md centerpiece) */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="hero-palette-mockup w-full max-w-[500px] cmd-palette cmd-palette-glow flex flex-col text-left font-body text-xs text-on-surface select-none transform transition-transform duration-300 hover:scale-[1.01]">
                
                {/* Search Bar / Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/40 bg-surface-container-lowest">
                  {/* macOS dots */}
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex items-center gap-2 flex-grow text-on-surface-variant/40 font-medium">
                    <span className="material-symbols-outlined text-sm">search</span>
                    <span>Split tagihan, lacak utang...</span>
                    <span className="w-0.5 h-3.5 bg-primary cursor-blink" />
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-row h-[280px] bg-white">
                  
                  {/* Left Column: Command Rows list */}
                  <div className="w-[55%] border-r border-outline-variant/30 p-2 space-y-1 overflow-hidden">
                    <p className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-wider px-2.5 py-1">Rekomendasi</p>
                    
                    {COMMANDS.map((cmd) => {
                      const isActive = activeCommand === cmd.id;
                      return (
                        <div
                          key={cmd.id}
                          onClick={() => setActiveCommand(cmd.id)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                            isActive ? 'cmd-row-active font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">
                              {cmd.icon}
                            </span>
                            <span className="text-[11px] truncate max-w-[130px]">{cmd.title}</span>
                          </div>
                          <span className="keycap-premium text-[9px] px-1.5 py-0.5 rounded shadow-sm scale-90">{cmd.shortcut}</span>
                        </div>
                      );
                    })}

                    <p className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-wider px-2.5 py-1.5 pt-3">Grup Terkini</p>
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-md text-on-surface-variant hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-secondary">group</span>
                        <span className="text-[11px]">Puncak Trip 🌲</span>
                      </div>
                      <span className="keycap-premium text-[9px] px-1.5 py-0.5 rounded shadow-sm scale-90">⏎</span>
                    </div>
                  </div>

                  {/* Right Column: Preview Panel */}
                  <div className="w-[45%] bg-slate-50/50 p-4 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-outline-variant/20 pb-2">
                        <span className="font-semibold text-on-surface text-[11px] tracking-wide">{activeCmdData.previewTitle}</span>
                        <span className="text-[9px] text-on-surface-variant/60 font-medium">{activeCmdData.method}</span>
                      </div>

                      {/* Display content based on active selection */}
                      {activeCmdData.id !== 2 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] text-on-surface-variant/60 font-medium">Group: <strong className="text-on-surface">{activeCmdData.amount}</strong></p>
                          <div className="space-y-1.5 mt-2">
                            {activeCmdData.members.map((m, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-outline-variant/20">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-4 h-4 rounded-full ${m.color} flex items-center justify-center text-[8px] font-bold`}>{m.letter}</span>
                                  <span className="text-[9px] font-medium">{m.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-on-surface">{m.status}</span>
                                  {m.buzz && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded-lg border border-outline-variant/20 space-y-2">
                          <p className="text-[9px] font-medium text-primary">Insight AI Hari Ini</p>
                          <p className="text-[9px] text-on-surface-variant leading-relaxed italic">
                            "{activeCmdData.insightText}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[9px] text-on-surface-variant/50">
                      <span>Pilih: ↑↓</span>
                      <span>Buka: ⏎</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ FEATURES BENTO GRID (DESIGN.md visual focus) ══════════ */}
        <section className="py-24 bg-surface" id="fitur">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="text-center mb-16 max-w-xl mx-auto">
              <p className="g-fade-up text-xs font-semibold text-primary uppercase tracking-wider mb-2">Fitur Unggulan</p>
              <h2 className="g-fade-up text-3xl md:text-4xl font-semibold tracking-tight leading-snug">
                Kelola Keuangan Tanpa Drama
              </h2>
              <p className="g-fade-up text-on-surface-variant text-sm mt-3">Lupakan hitung-hitungan manual. SplitMate menangani segalanya untukmu.</p>
            </div>

            {/* Premium Bento Grid Structure */}
            <div className="g-stagger-parent grid grid-cols-1 md:grid-cols-6 gap-6">
              
              {/* Card 1: Split Otomatis (Col-span 4 on large, detailed custom UI inside) */}
              <div className="g-stagger-child md:col-span-4 bg-surface-container-low p-6 md:p-8 rounded-xl hairline-border flex flex-col md:flex-row gap-6 justify-between items-start card-tilt icon-bounce-hover">
                <div className="space-y-5 max-w-sm w-full">
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center icon-target transition-all duration-200">
                      <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">Split Tagihan Otomatis</h3>
                      <p className="text-on-surface-variant text-xs mt-2 leading-relaxed">
                        Bagi tagihan makan, belanja, atau sewa secara adil. Pilih bagi rata atau kustom per item dalam hitungan detik.
                      </p>
                    </div>
                  </div>

                  {/* Sleek Interactive Control Panel */}
                  <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-on-surface">
                      <span className="flex items-center gap-1.5 text-on-surface-variant/80 font-medium">
                        <span className="material-symbols-outlined text-sm font-semibold">tune</span>
                        Simulasi Tagihan:
                      </span>
                      <span className="text-primary font-bold text-xs bg-primary/5 px-2 py-0.5 rounded">
                        Rp {billAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="30000"
                      max="1500000"
                      step="15000"
                      value={billAmount}
                      onChange={(e) => setBillAmount(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                    />
                    
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant/50 font-medium">
                      <span>Rp 30.000</span>
                      <span>Rp 1.500.000</span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setSplitType('rata')}
                        className={`flex-1 py-1.5 px-3 rounded text-[10px] font-medium transition-all duration-200 border ${
                          splitType === 'rata'
                            ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                            : 'bg-white hover:bg-slate-50 text-on-surface-variant border-outline-variant/40'
                        }`}
                      >
                        Bagi Rata (1/3)
                      </button>
                      <button
                        onClick={() => setSplitType('kustom')}
                        className={`flex-1 py-1.5 px-3 rounded text-[10px] font-medium transition-all duration-200 border ${
                          splitType === 'kustom'
                            ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                            : 'bg-white hover:bg-slate-50 text-on-surface-variant border-outline-variant/40'
                        }`}
                      >
                        Kustom Menu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Miniature Bill Splitting visual layout */}
                <div className="w-full max-w-[280px] bg-white p-4 rounded-xl border border-outline-variant/40 space-y-3 shadow-sm select-none shrink-0 transition-all duration-300">
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant pb-1.5 border-b border-slate-100">
                    <span className="font-semibold text-on-surface">🍕 Makan Malam</span>
                    <span className="font-bold text-primary">Rp {billAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitType('rata')}
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-medium transition-all ${
                        splitType === 'rata' ? 'bg-primary text-on-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Bagi Rata
                    </button>
                    <button
                      onClick={() => setSplitType('kustom')}
                      className={`text-[9px] px-2.5 py-0.5 rounded-full font-medium transition-all ${
                        splitType === 'kustom' ? 'bg-primary text-on-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Kustom
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(splitType === 'rata'
                      ? [
                          { name: 'Andi', val: `Rp ${Math.round(billAmount / 3).toLocaleString('id-ID')}`, share: 'Porsi Sama (33.3%)' },
                          { name: 'Sarah', val: `Rp ${Math.round(billAmount / 3).toLocaleString('id-ID')}`, share: 'Porsi Sama (33.3%)' },
                          { name: 'Kamu', val: `Rp ${Math.round(billAmount / 3).toLocaleString('id-ID')}`, share: 'Porsi Sama (33.3%)' },
                        ]
                      : [
                          { name: 'Andi', val: `Rp ${Math.round(billAmount * 0.5).toLocaleString('id-ID')}`, share: '🍔 Burger Premium (50%)' },
                          { name: 'Sarah', val: `Rp ${Math.round(billAmount * 0.3).toLocaleString('id-ID')}`, share: '🍜 Ramen Spesial (30%)' },
                          { name: 'Kamu', val: `Rp ${Math.round(billAmount * 0.2).toLocaleString('id-ID')}`, share: '🍹 Es Teh Manis (20%)' },
                        ]
                    ).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50/50 px-2 py-1.5 rounded-lg border border-outline-variant/10 hover:bg-slate-100/50 transition-colors">
                        <div className="text-[9px] font-medium flex flex-col">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {item.name}
                          </span>
                          <span className="text-[7.5px] text-on-surface-variant/60 ml-3 font-normal">{item.share}</span>
                        </div>
                        <span className="text-[9px] font-bold text-on-surface">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Tracking Utang (Col-span 2) */}
              <div className="g-stagger-child md:col-span-2 bg-surface-container-low p-6 rounded-xl hairline-border flex flex-col justify-between card-tilt icon-bounce-hover">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/8 text-secondary flex items-center justify-center icon-target transition-all duration-200">
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">Tracking Utang Cepat</h3>
                    <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
                      Pantau siapa yang berhutang dan kepada siapa secara real-time. Settle up dengan sekali klik.
                    </p>
                  </div>
                </div>

                {/* Ledger visual mockup */}
                <div className="mt-6 bg-white p-3 rounded-lg border border-outline-variant/40 space-y-2 shadow-sm select-none">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-500 font-medium">Andi ke Kamu</span>
                    <span className="font-bold text-secondary">+Rp 45.000</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: '70%' }} />
                  </div>
                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="text-slate-500 font-medium">Kamu ke Sarah</span>
                    <span className="font-bold text-red-500">-Rp 20.000</span>
                  </div>
                </div>
              </div>

              {/* Card 3: AI Insight (Col-span 2) */}
              <div className="g-stagger-child md:col-span-2 bg-surface-container-low p-6 rounded-xl hairline-border flex flex-col justify-between card-tilt icon-bounce-hover">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/8 text-amber-700 flex items-center justify-center icon-target transition-all duration-200">
                    <span className="material-symbols-outlined text-xl">psychology</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">AI Insight Keuangan</h3>
                    <p className="text-on-surface-variant text-xs mt-1.5 leading-relaxed">
                      Analisis mendalam mengenai pengeluaranmu. Cari tahu kategori yang paling boros secara instan.
                    </p>
                  </div>
                </div>

                {/* Mini chart card visual mockup */}
                <div className="mt-6 bg-white p-3 rounded-lg border border-outline-variant/40 space-y-2 shadow-sm select-none">
                  <div className="flex justify-between items-center text-[9px] pb-1">
                    <span className="font-medium">Makan Luar (Minggu ini)</span>
                    <span className="text-amber-600 font-bold">Naik 15%</span>
                  </div>
                  <div className="flex items-end gap-1 h-8 pt-1">
                    {[30, 45, 60, 85, 40].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-sm ${i === 3 ? 'bg-amber-500' : 'bg-slate-200'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 4: Grup Fleksibel (Col-span 4, detailed custom UI inside) */}
              <div className="g-stagger-child md:col-span-4 bg-surface-container-low p-6 md:p-8 rounded-xl hairline-border flex flex-col md:flex-row gap-6 justify-between items-start card-tilt icon-bounce-hover">
                <div className="space-y-4 max-w-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/8 text-primary flex items-center justify-center icon-target transition-all duration-200">
                    <span className="material-symbols-outlined text-xl">group</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Grup Fleksibel Tanpa Batas</h3>
                    <p className="text-on-surface-variant text-xs mt-2 leading-relaxed">
                      Buat grup khusus untuk trip liburan, patungan bulanan kosan, atau kado ulang tahun teman. Undang teman via email dengan cepat.
                    </p>
                  </div>
                </div>

                {/* Groups list visual mockup */}
                <div className="w-full max-w-[280px] bg-white p-3.5 rounded-xl border border-outline-variant/40 space-y-2 shadow-sm select-none shrink-0">
                  {[
                    { name: 'Trip Puncak 🌲', desc: '4 anggota • Aktif', active: true },
                    { name: 'Kos Harmoni 🏠', desc: '5 anggota • Aktif', active: false },
                    { name: 'Kado Sarah 🎂', desc: '3 anggota • Lunas', active: false }
                  ].map((g, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border text-[10px] ${g.active ? 'border-primary/20 bg-primary/5' : 'border-outline-variant/10'}`}>
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-[8px] text-on-surface-variant/60">{g.desc}</p>
                      </div>
                      <span className="material-symbols-outlined text-xs text-on-surface-variant/40">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS (Minimalist) ══════════ */}
        <section className="py-24 bg-surface border-t border-outline-variant/40" id="tentang-kami">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="text-center mb-16 max-w-xl mx-auto">
              <p className="g-fade-up text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Cara Kerja</p>
              <h2 className="g-fade-up text-3xl md:text-4xl font-semibold tracking-tight">
                Semudah 4 Langkah Cepat
              </h2>
            </div>

            <div className="g-stagger-parent grid grid-cols-1 md:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <div key={i} className="g-stagger-child bg-surface-container-low p-6 rounded-lg hairline-border relative group flex flex-col justify-between h-44">
                  <div>
                    <span className="text-5xl font-bold text-primary/8 absolute top-4 right-4">{s.num}</span>
                    <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-on-primary transition-all duration-200">
                      <span className="material-symbols-outlined text-lg">{s.icon}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-1 text-on-surface">{s.title}</h3>
                    <p className="text-on-surface-variant text-[11px] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ STATS BANNER ══════════ */}
        <section className="py-16 bg-primary relative overflow-hidden text-center text-on-primary border-y border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent)]" />
          <div className="max-w-[1240px] mx-auto px-6 relative z-10">
            <div className="g-stagger-parent grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { end: 500000, suffix: '+', label: 'Pengguna Aktif' },
                { end: 12, suffix: 'M+', label: 'Transaksi Dicatat' },
                { end: 99, suffix: '.9%', label: 'Akurasi Kalkulasi' },
                { end: 4, suffix: '.9 ⭐', label: 'Rating App Store' },
              ].map((s, i) => (
                <div key={i} className="g-stagger-child space-y-1">
                  <p className="text-3xl md:text-5xl font-bold tracking-tight">
                    <Counter end={s.end} suffix={s.suffix} />
                  </p>
                  <p className="text-on-primary/60 text-xs font-medium tracking-wide uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ TESTIMONIALS (Minimal cards) ══════════ */}
        <section className="py-24 bg-surface border-b border-outline-variant/40">
          <div className="max-w-[1240px] mx-auto px-6">
            <div className="text-center mb-16 max-w-xl mx-auto">
              <p className="g-fade-up text-xs font-semibold text-primary uppercase tracking-wider mb-2">Testimoni</p>
              <h2 className="g-fade-up text-3xl md:text-4xl font-semibold tracking-tight">
                Apa Kata Mereka
              </h2>
            </div>

            <div className="relative w-full overflow-hidden py-4 mask-gradient-sides">
              <div className="testimonial-marquee">
                {/* Loop 1 */}
                {TESTIMONIALS.map((t, i) => (
                  <div key={`t1-${i}`} className="w-[280px] shrink-0 bg-surface-container-low p-6 rounded-xl hairline-border flex flex-col justify-between h-48 hover:bg-slate-100/50 hover:border-primary/25 transition-all duration-300 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, j) => <span key={j} className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                      </div>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed italic">"{t.text}"</p>
                    </div>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-outline-variant/20">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">{t.avatar}</div>
                      <div>
                        <p className="font-semibold text-[10px] leading-none">{t.name}</p>
                        <p className="text-[8px] text-on-surface-variant/60 mt-1">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Loop 2 (seamless duplication) */}
                {TESTIMONIALS.map((t, i) => (
                  <div key={`t2-${i}`} className="w-[280px] shrink-0 bg-surface-container-low p-6 rounded-xl hairline-border flex flex-col justify-between h-48 hover:bg-slate-100/50 hover:border-primary/25 transition-all duration-300 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, j) => <span key={j} className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                      </div>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed italic">"{t.text}"</p>
                    </div>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-outline-variant/20">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">{t.avatar}</div>
                      <div>
                        <p className="font-semibold text-[10px] leading-none">{t.name}</p>
                        <p className="text-[8px] text-on-surface-variant/60 mt-1">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Loop 3 (fail-safe for wider viewports) */}
                {TESTIMONIALS.map((t, i) => (
                  <div key={`t3-${i}`} className="w-[280px] shrink-0 bg-surface-container-low p-6 rounded-xl hairline-border flex flex-col justify-between h-48 hover:bg-slate-100/50 hover:border-primary/25 transition-all duration-300 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, j) => <span key={j} className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                      </div>
                      <p className="text-on-surface-variant text-[11px] leading-relaxed italic">"{t.text}"</p>
                    </div>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-outline-variant/20">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">{t.avatar}</div>
                      <div>
                        <p className="font-semibold text-[10px] leading-none">{t.name}</p>
                        <p className="text-[8px] text-on-surface-variant/60 mt-1">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════ CTA SECTION ══════════ */}
        <section className="max-w-[1240px] mx-auto px-6 py-24">
          <div className="g-scale-in relative bg-gradient-to-br from-primary to-primary-container rounded-2xl p-12 md:p-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)]" />
            
            <div className="relative z-10 space-y-6 max-w-xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-on-primary">
                Siap Hidup Bebas Drama Finansial?
              </h2>
              <p className="text-on-primary/70 text-xs md:text-sm max-w-sm mx-auto leading-relaxed">
                Gabung dengan 500.000+ pengguna yang sudah merasakan kemudahan mengelola pengeluaran patungan bersama.
              </p>
              <div className="flex flex-row justify-center gap-3 pt-4">
                {user ? (
                  <Link to="/dashboard" className="shine-hover bg-white text-primary px-8 py-3 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm flex items-center gap-1.5">
                    Ke Dashboard
                    <span className="material-symbols-outlined text-[16px] font-semibold text-primary">dashboard</span>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="shine-hover bg-white text-primary px-6 py-3 rounded-lg font-medium text-sm hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm">
                      Daftar Sekarang
                    </Link>
                    <Link to="/login" className="border border-white/20 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-white/10 transition-all active:scale-[0.98]">
                      Masuk
                    </Link>
                  </>
                )}
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
