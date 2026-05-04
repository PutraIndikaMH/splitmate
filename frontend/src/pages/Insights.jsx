import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const Insights = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const mounted = useAnimateOnMount();

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <TopAppBar searchPlaceholder="Search transactions..." onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 min-h-screen pt-24 px-6 lg:px-12 pb-12">
        {/* Header Section */}
        <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 max-w-6xl mx-auto ${mounted ? 'animate-in' : 'opacity-0'}`}>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1 font-headline">Insight Keuangan</h1>
            <p className="text-on-surface-variant/70 font-medium font-body text-sm">Analisis cerdas pengeluaran harianmu.</p>
          </div>
          <div className="relative inline-block">
            <button className="flex items-center gap-3 px-5 py-2.5 glass-card border border-outline-variant/20 rounded-2xl hover:bg-surface-container transition-all font-body text-sm">
              <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
              <span className="font-bold">Mei 2026</span>
              <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">expand_more</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Top Stat Cards */}
          <section className={`grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
            {/* Card 1 */}
            <div className="glass-card p-6 rounded-3xl border-l-4 border-l-primary hover-lift">
              <p className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest mb-3 font-body">Total Pengeluaran Bulan Ini</p>
              <div className="flex items-baseline gap-1">
                <span className="text-primary font-headline text-3xl font-extrabold">Rp 3.450.000</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-error text-xs font-bold font-body">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+12.5% dari bulan lalu</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-6 rounded-3xl border-l-4 border-l-secondary hover-lift">
              <p className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest mb-3 font-body">Kategori Terbesar</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-secondary font-headline text-3xl font-extrabold">Makan</span>
                  <p className="text-on-surface-variant/50 text-sm mt-1 font-body">Rp 1.200.000</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                </div>
              </div>
            </div>

            {/* Card 3 — AI Prediction */}
            <div className="bg-gradient-to-br from-primary to-primary-container text-white p-6 rounded-3xl shadow-lg shadow-primary/15 relative overflow-hidden hover-lift">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest font-body">Prediksi Bulan Depan</p>
                  <span className="bg-secondary text-white text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider font-body">AI</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline text-3xl font-extrabold">Rp 3.100.000</span>
                </div>
                <p className="mt-3 text-white/50 text-xs leading-relaxed font-body">Pengeluaranmu diprediksi turun karena tren stabil.</p>
              </div>
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Charts */}
            <div className={`lg:col-span-8 space-y-8 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Donut Chart Card */}
                <div className="glass-card p-7 rounded-3xl h-full">
                  <h3 className="font-headline font-bold text-base mb-6">Spending by Category</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative w-44 h-44 mb-6">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#534AB7" strokeDasharray="251.2" strokeDashoffset="87.9" strokeWidth="12" strokeLinecap="round"></circle>
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#006c4e" strokeDasharray="251.2" strokeDashoffset="200.9" strokeWidth="12" strokeLinecap="round"></circle>
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#3b309e" strokeDasharray="251.2" strokeDashoffset="150.7" strokeWidth="12" strokeLinecap="round"></circle>
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f7cc58" strokeDasharray="251.2" strokeDashoffset="213.5" strokeWidth="12" strokeLinecap="round"></circle>
                        <circle cx="50" cy="50" fill="transparent" r="40" stroke="#c8c4d5" strokeDasharray="251.2" strokeDashoffset="238.6" strokeWidth="12" strokeLinecap="round"></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-on-surface-variant/40 font-bold font-body uppercase tracking-wider">Total</span>
                        <span className="text-lg font-black text-primary font-headline">100%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {[
                        { color: 'bg-primary', label: 'Makan', pct: '35%' },
                        { color: 'bg-secondary', label: 'Belanja', pct: '20%' },
                        { color: 'bg-primary-container', label: 'Transport', pct: '20%' },
                        { color: 'bg-[#f7cc58]', label: 'Hiburan', pct: '15%' },
                        { color: 'bg-outline-variant', label: 'Lainnya', pct: '10%' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                          <span className="text-xs font-medium font-body text-on-surface-variant/60">{item.label} ({item.pct})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar Chart Card */}
                <div className="glass-card p-7 rounded-3xl h-full flex flex-col">
                  <h3 className="font-headline font-bold text-base mb-6">Monthly Spending Trend</h3>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-end justify-between h-36 gap-2 mb-4">
                      {[
                        { h: '40%', label: 'Mei', active: false },
                        { h: '55%', label: 'Jun', active: false },
                        { h: '45%', label: 'Jul', active: false },
                        { h: '70%', label: 'Agu', active: false },
                        { h: '60%', label: 'Sep', active: false },
                        { h: '85%', label: 'Okt', active: true },
                      ].map(bar => (
                        <div key={bar.label} className="w-full flex flex-col items-center gap-2 group">
                          <div
                            className={`w-full rounded-lg transition-all duration-500 ${bar.active ? 'bg-gradient-to-t from-primary to-primary-container shadow-md shadow-primary/20' : 'bg-surface-container-high group-hover:bg-primary/30'}`}
                            style={{ height: bar.h }}
                          ></div>
                          <span className={`text-[10px] font-bold font-body ${bar.active ? 'text-primary' : 'text-on-surface-variant/40'}`}>{bar.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-outline-variant/10">
                      <p className="text-xs text-on-surface-variant/50 leading-relaxed font-body">Pengeluaranmu mencapai puncak di <span className="text-primary font-bold">Oktober</span>. Review biaya langganan aktif.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-4">
                <h3 className="font-headline font-bold text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  AI Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: 'movie', title: 'Limit Hiburan', desc: 'Pengeluaran hiburanmu naik 30% bulan ini — coba batasi budget nonton!', color: 'primary' },
                    { icon: 'savings', title: 'Target Menabung', desc: 'Kamu bisa hemat Rp 500rb jika mengurangi jajan kopi minggu depan.', color: 'secondary' },
                  ].map(rec => (
                    <div key={rec.title} className="glass-card p-5 rounded-2xl flex gap-4 hover-lift cursor-pointer group border border-transparent hover:border-primary/15 transition-all">
                      <div className={`w-11 h-11 bg-${rec.color}/8 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-${rec.color} group-hover:text-white transition-all text-${rec.color}`}>
                        <span className="material-symbols-outlined">{rec.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm mb-1 font-headline">{rec.title}</h4>
                        <p className="text-xs text-on-surface-variant/50 leading-relaxed font-body">{rec.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Score & Summary */}
            <div className={`lg:col-span-4 space-y-6 ${mounted ? 'animate-in stagger-5' : 'opacity-0'}`}>
              {/* Financial Score */}
              <div className="glass-card p-7 rounded-3xl text-center flex flex-col items-center hover-lift">
                <h3 className="font-headline font-bold text-base mb-6">Financial Score</h3>
                <div className="relative w-44 h-44 mb-5 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-[225deg]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="42" stroke="#e5e1eb" strokeDasharray="197.9 263.9" strokeLinecap="round" strokeWidth="8"></circle>
                    <circle cx="50" cy="50" fill="transparent" r="42" stroke="url(#scoreGradient)" strokeDasharray="162.3 263.9" strokeLinecap="round" strokeWidth="8" className="transition-all duration-1000"></circle>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b309e" />
                        <stop offset="100%" stopColor="#006c4e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-primary font-headline">82</span>
                    <span className="text-xs font-bold text-secondary tracking-widest uppercase mt-1 font-body">Baik</span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/50 leading-relaxed px-2 font-body">
                  Skor finansialmu di atas rata-rata. <span className="text-primary font-bold">Pertahankan!</span>
                </p>
                <button className="mt-5 text-primary font-bold text-xs flex items-center gap-1.5 hover:gap-2.5 transition-all font-body">
                  Lihat Detail Analisis
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* Shared Bill Status */}
              <div className="bg-gradient-to-br from-primary-container to-primary text-white p-7 rounded-3xl overflow-hidden relative hover-lift">
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-5 font-body">Status Patungan</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">B</div>
                      <span className="text-sm font-medium font-body">Budi</span>
                    </div>
                    <span className="text-xs font-bold bg-white/15 px-3 py-1 rounded-full font-body">Rp 120.000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">A</div>
                      <span className="text-sm font-medium font-body">Anggota</span>
                    </div>
                    <span className="text-xs font-bold text-secondary-container font-body">Lunas</span>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1 font-body">Total Piutang</p>
                  <p className="text-2xl font-extrabold tracking-tight font-headline">Rp 450.000</p>
                </div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary opacity-15 rounded-full blur-3xl"></div>
              </div>

              {/* Transaction History */}
              <div className="glass-card p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="font-bold text-sm font-headline">Aktivitas Terakhir</h4>
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-sm cursor-pointer hover:text-primary transition-colors">more_horiz</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: 'shopping_bag', label: 'Uniqlo Store', time: 'Hari ini, 14:20', amount: '- Rp 299k' },
                    { icon: 'coffee', label: 'Starbucks Coffee', time: 'Kemarin, 09:15', amount: '- Rp 55k' },
                  ].map(tx => (
                    <div key={tx.label} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container/50 transition-colors">
                      <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">{tx.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold font-body truncate">{tx.label}</p>
                        <p className="text-[10px] text-on-surface-variant/40 font-body">{tx.time}</p>
                      </div>
                      <span className="text-xs font-bold text-error font-body shrink-0">{tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Live Split Status */}
      <div className="hidden md:block fixed bottom-8 right-8 z-50">
        <div className="glass-card-strong p-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold border-2 border-white">A</div>
            <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-[10px] font-bold border-2 border-white">B</div>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">+2</div>
          </div>
          <div className="h-8 w-px bg-outline-variant/20"></div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest font-body">Live Split Math</p>
            <p className="text-sm font-black text-primary font-headline">Rp 125.000 <span className="text-[10px] text-on-surface-variant/40 font-normal">per orang</span></p>
          </div>
          <button className="bg-gradient-to-br from-primary to-primary-container text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
      </div>

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
};

export default Insights;
