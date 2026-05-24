import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import useAnimateOnMount from '../hooks/useAnimateOnMount';
import api from '../services/api';
import { predictExpense } from '../services/ai';

const CATEGORY_MAP = {
  makanan: 'Makan',
  hiburan: 'Hiburan',
  transportasi: 'Transport',
  tagihan: 'Tagihan',
  kesehatan: 'Kesehatan',
  lainnya: 'Lainnya',
  pendidikan: 'Pendidikan',
  tabungan: 'Tabungan',
  tempat_tinggal: 'Tempat Tinggal',
  gaji: 'Gaji',
  investasi: 'Investasi',
  freelance: 'Freelance',
  bonus: 'Bonus',
};

// Indeks sesuai Date.getDay() (0=Sun..6=Sat) untuk one-hot 7 hari.
const DAY_COL = [
  'day_of_week_Sunday',
  'day_of_week_Monday',
  'day_of_week_Tuesday',
  'day_of_week_Wednesday',
  'day_of_week_Thursday',
  'day_of_week_Friday',
  'day_of_week_Saturday',
];

// Untuk parsing format "17 May 2025" / "5 May 2025" dari backend
const MONTH_MAP = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parseActivityDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTH_MAP[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
};

const emptyFeatureRow = () => ({
  amount_idr: 0, month: 0, is_weekend: 0, year: 0,
  category_makanan: 0, category_tempat_tinggal: 0, category_transportasi: 0,
  category_tagihan: 0, category_hiburan: 0, category_kesehatan: 0, category_pendidikan: 0,
  category_tabungan: 0, category_lainnya: 0, category_investasi: 0,
  day_of_week_Friday: 0, day_of_week_Monday: 0, day_of_week_Saturday: 0, day_of_week_Sunday: 0,
  day_of_week_Thursday: 0, day_of_week_Tuesday: 0, day_of_week_Wednesday: 0,
});

const buildFeatureRow = (activity) => {
  const row = emptyFeatureRow();
  const d = parseActivityDate(activity.date);
  const now = new Date();

  row.amount_idr = Number(activity.amount || 0);
  row.year = d ? d.getFullYear() : now.getFullYear();
  row.month = d ? d.getMonth() + 1 : now.getMonth() + 1;
  row.is_weekend = d ? (d.getDay() === 0 || d.getDay() === 6 ? 1 : 0) : 0;
  const catKey = `category_${(activity.category || 'lainnya').toLowerCase()}`;
  if (catKey in row) row[catKey] = 1;

  if (d) {
    const dayCol = DAY_COL[d.getDay()];
    if (dayCol) row[dayCol] = 1;
  }

  return row;
};

const formatRupiah = (n) =>
  n != null ? `Rp ${Number(n).toLocaleString('id-ID')}` : '-';

const PROGRESS_THRESHOLD = 10;

const Insights = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hardError, setHardError] = useState('');
  const [aiError, setAiError] = useState('');
  const [activities, setActivities] = useState([]);
  const [insight, setInsight] = useState({
    totalExpense: null,
    category: null,
    predicted: null,
    score: null,
    scoreLabel: null,
    recommendations: [],
    thisMonthTotal: null,
    lastMonthTotal: null,
    trend: null,
    dominantPct: null,
  });
  const mounted = useAnimateOnMount();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setHardError('');
      setAiError('');

      try {
        const [aRes, scoreRes] = await Promise.all([
          api.get('/users/me/activities?limit=100'),
          api.get('/users/me/financial-score'),
        ]);

        const acts = aRes.data || [];
        setActivities(acts.slice(0, 20));

        const score = scoreRes.data?.score ?? null;
        const scoreLabel = scoreRes.data?.label ?? null;

        if (acts.length === 0) {
          setInsight({ totalExpense: null, category: null, predicted: null, score, scoreLabel, recommendations: [], thisMonthTotal: null, lastMonthTotal: null, trend: null, dominantPct: null });
          return;
        }

        const monetaryActs = acts.filter((a) => Number(a.amount || 0) > 0);
        const totalExpense = monetaryActs.reduce((sum, a) => sum + Number(a.amount || 0), 0);

        // Kategori terbesar berdasarkan total amount
        const catSum = {};
        monetaryActs.forEach((a) => {
          const c = (a.category || 'lainnya').toLowerCase();
          catSum[c] = (catSum[c] || 0) + Number(a.amount || 0);
        });
        const topCatRaw = Object.entries(catSum).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const categoryDisplay = CATEGORY_MAP[topCatRaw] || 'Belum tersedia';
        const dominantPct = topCatRaw && totalExpense > 0
          ? Math.round((catSum[topCatRaw] / totalExpense) * 100) : null;

        // Perbandingan bulan ini vs bulan lalu
        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
        const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

        const thisMonthTotal = monetaryActs
          .filter((a) => { const d = parseActivityDate(a.date); return d && d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear; })
          .reduce((s, a) => s + Number(a.amount || 0), 0);

        const lastMonthTotal = monetaryActs
          .filter((a) => { const d = parseActivityDate(a.date); return d && d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear; })
          .reduce((s, a) => s + Number(a.amount || 0), 0);

        // Predict: n_steps_ahead = avg transaksi per bulan → sum semua = estimasi bulanan
        let predicted = null;
        let trend = null;
        const predictActs = acts.slice(0, 20);
        if (predictActs.length >= PROGRESS_THRESHOLD) {
          try {
            const monthCounts = {};
            monetaryActs.forEach((a) => {
              const d = parseActivityDate(a.date);
              if (d) {
                const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
                monthCounts[key] = (monthCounts[key] || 0) + 1;
              }
            });
            const monthKeys = Object.keys(monthCounts);
            const avgPerMonth = monthKeys.length > 0
              ? Math.round(Object.values(monthCounts).reduce((s, v) => s + v, 0) / monthKeys.length)
              : 10;
            const nSteps = Math.max(1, Math.min(avgPerMonth, 12));

            const rows = predictActs.map(buildFeatureRow);
            const predRes = await predictExpense({ rows, n_steps_ahead: nSteps });
            predicted = (predRes?.predictions || []).reduce((s, p) => s + (p.prediksi_idr || 0), 0) || null;

            if (predicted && lastMonthTotal > 0) {
              const ratio = predicted / lastMonthTotal;
              trend = ratio > 1.2 ? 'naik' : ratio < 0.8 ? 'turun' : 'stabil';
            }
          } catch {
            setAiError('Prediksi AI tidak tersedia saat ini.');
          }
        }

        // Rekomendasi dinamis
        const recommendations = [];
        if (topCatRaw) {
          const isUncategorized = topCatRaw === 'lainnya';
          recommendations.push({
            icon: isUncategorized ? 'label' : 'insights',
            title: isUncategorized ? 'Rapikan Kategori Pengeluaran' : `Fokus ${categoryDisplay}`,
            desc: isUncategorized
              ? 'Banyak transaksimu belum dikategorikan. Tandai dengan kategori yang tepat agar analisis AI lebih akurat.'
              : `${categoryDisplay} mendominasi ${dominantPct}% pengeluaranmu. Tetapkan batas mingguan agar tidak over-budget.`,
          });
        }
        if (predicted != null) {
          const trendTitle = trend === 'naik' ? 'Waspadai Tren Naik'
            : trend === 'turun' ? 'Tren Membaik' : 'Pengeluaran Stabil';
          const trendDesc = trend === 'naik'
            ? `Estimasi bulan depan ${formatRupiah(predicted)} — cenderung lebih tinggi dari bulan lalu. Perhatikan kategori ${categoryDisplay}.`
            : trend === 'turun'
            ? `Estimasi bulan depan ${formatRupiah(predicted)} — lebih hemat dari bulan lalu. Momentum bagus untuk menambah tabungan.`
            : `Estimasi bulan depan ${formatRupiah(predicted)} — pola pengeluaran stabil. Pertahankan dan sisihkan selisihnya.`;
          recommendations.push({
            icon: trend === 'naik' ? 'trending_up' : trend === 'turun' ? 'trending_down' : 'savings',
            title: trendTitle,
            desc: trendDesc,
          });
        } else if (acts.length >= PROGRESS_THRESHOLD) {
          recommendations.push({
            icon: 'savings',
            title: 'Sisihkan di Awal',
            desc: 'Transfer ke tabungan segera setelah menerima penghasilan sebelum sempat digunakan untuk hal lain.',
          });
        }

        setInsight({ totalExpense, category: categoryDisplay, predicted, score, scoreLabel, recommendations, thisMonthTotal, lastMonthTotal, trend, dominantPct });
      } catch (e) {
        setHardError(e.response?.data?.detail || 'Gagal memuat data. Periksa koneksi dan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const lastActivities = useMemo(
    () =>
      (activities || []).slice(0, 3).map((a) => ({
        id: a.id,
        icon: a.icon || 'receipt_long',
        label: a.title || 'Transaksi',
        group_name: a.group_name || '',
        time: a.date || '-',
        amount: Number(a.amount || 0),
        isIncome: a.paid_by_me,
      })),
    [activities]
  );

  const progressPct = Math.min((activities.length / PROGRESS_THRESHOLD) * 100, 100);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <TopAppBar searchPlaceholder="Cari transaksi..." onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 min-h-screen pt-24 px-6 lg:px-12 pb-12">
        <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 max-w-6xl mx-auto ${mounted ? 'animate-in' : 'opacity-0'}`}>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1 font-headline">Insight Keuangan</h1>
            <p className="text-on-surface-variant/70 font-medium font-body text-sm">Analisis cerdas pengeluaran harianmu.</p>
          </div>
        </header>

        {/* Loading */}
        {loading && (
          <div className="max-w-6xl mx-auto flex items-center gap-3 text-sm text-on-surface-variant py-8">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            Memuat insight AI...
          </div>
        )}

        {/* Hard error - API utama gagal */}
        {!loading && hardError && (
          <div className="max-w-6xl mx-auto text-center py-16">
            <span className="material-symbols-outlined text-5xl text-error/50">wifi_off</span>
            <p className="mt-4 font-bold text-base">{hardError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 bg-primary text-white px-5 py-2.5 rounded-2xl font-bold text-sm"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty state - belum ada transaksi */}
        {!loading && !hardError && activities.length === 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center py-16">
              <span className="material-symbols-outlined text-6xl text-primary/25" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h2 className="text-xl font-extrabold font-headline mt-5">Insight-mu masih kosong</h2>
              <p className="text-sm text-on-surface-variant/60 mt-2 max-w-sm leading-relaxed font-body">
                Mulai catat pengeluaran pertamamu. AI akan langsung menganalisis pola keuanganmu setelah ada data.
              </p>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-7 bg-primary text-white px-7 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Tambah Transaksi Pertama
              </button>
            </div>

            {(insight.score != null) && (
              <div className="glass-card p-7 rounded-3xl text-center flex flex-col items-center max-w-xs mx-auto mt-4">
                <h3 className="font-headline font-bold text-base mb-4">Skor Keuangan</h3>
                {insight.score != null ? (
                  <>
                    <span className="text-5xl font-black text-primary font-headline">{insight.score}</span>
                    <span className="text-xs text-on-surface-variant/40 font-body mt-0.5">/ 900</span>
                    <span className="text-xs font-bold text-secondary tracking-widest uppercase mt-1 font-body">{insight.scoreLabel}</span>
                  </>
                ) : (
                  <span className="text-sm text-on-surface-variant/50 font-body">Belum ada data pembayaran</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main content - ada aktivitas */}
        {!loading && !hardError && activities.length > 0 && (
          <div className="max-w-6xl mx-auto">
            {/* Soft AI error banner */}
            {!!aiError && (
              <div className="mb-6 flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
                <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
                {aiError}
              </div>
            )}

            {/* Kartu utama */}
            <section className={`grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-primary hover-lift">
                <p className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest mb-3 font-body">Pengeluaran Bulan Ini</p>
                <span className="text-primary font-headline text-3xl font-extrabold">
                  {insight.thisMonthTotal != null ? formatRupiah(insight.thisMonthTotal) : '-'}
                </span>
                {insight.lastMonthTotal > 0 && (
                  <p className="text-on-surface-variant/40 text-xs mt-1.5 font-body">
                    vs {formatRupiah(insight.lastMonthTotal)} bulan lalu
                  </p>
                )}
              </div>

              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-secondary hover-lift">
                <p className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest mb-3 font-body">Kategori Terbesar</p>
                <span className="text-secondary font-headline text-3xl font-extrabold">
                  {insight.category || '-'}
                </span>
              </div>

              {/* Prediksi - conditional berdasarkan ketersediaan data */}
              <div className="bg-gradient-to-br from-primary to-primary-container text-white p-6 rounded-3xl shadow-lg shadow-primary/15 flex flex-col justify-between">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest font-body">Estimasi Bulan Depan</p>
                {insight.predicted != null ? (
                  <div className="mt-2">
                    <span className="font-headline text-3xl font-extrabold block">{formatRupiah(insight.predicted)}</span>
                    {insight.trend && (
                      <span className="text-white/70 text-xs mt-1 font-body block">
                        {insight.trend === 'naik' ? '↑ Tren naik' : insight.trend === 'turun' ? '↓ Tren membaik' : '→ Stabil'}
                        {insight.lastMonthTotal > 0 ? ` vs ${formatRupiah(insight.lastMonthTotal)} bln lalu` : ''}
                      </span>
                    )}
                  </div>
                ) : activities.length < PROGRESS_THRESHOLD ? (
                  <div className="mt-3">
                    <p className="font-headline text-base font-bold">Prediksi tersedia dalam {PROGRESS_THRESHOLD - activities.length} transaksi lagi</p>
                    <div className="mt-2 bg-white/25 rounded-full h-1.5 w-full overflow-hidden">
                      <div
                        className="bg-white h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-white/70 text-xs mt-1.5">{activities.length} / {PROGRESS_THRESHOLD} transaksi</p>
                  </div>
                ) : (
                  <span className="font-headline text-3xl font-extrabold mt-2">-</span>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className={`lg:col-span-8 space-y-8 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
                {insight.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-headline font-bold text-base flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      Rekomendasi AI
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insight.recommendations.map((rec) => (
                        <div key={rec.title} className="glass-card p-5 rounded-2xl flex gap-4 border border-transparent">
                          <div className="w-11 h-11 bg-primary/8 rounded-xl flex items-center justify-center shrink-0 text-primary">
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
                )}
              </div>

              <div className={`lg:col-span-4 space-y-6 ${mounted ? 'animate-in stagger-5' : 'opacity-0'}`}>
                <div className="glass-card p-7 rounded-3xl text-center flex flex-col items-center hover-lift">
                  <h3 className="font-headline font-bold text-base mb-6">Skor Keuangan</h3>
                  {insight.score != null ? (
                    <>
                      <span className="text-5xl font-black text-primary font-headline">{insight.score}</span>
                      <span className="text-xs text-on-surface-variant/40 font-body mt-0.5">/ 900</span>
                      <span className="text-xs font-bold text-secondary tracking-widest uppercase mt-1 font-body">{insight.scoreLabel}</span>
                    </>
                  ) : (
                    <span className="text-sm text-on-surface-variant/50 font-body">Belum ada data pembayaran</span>
                  )}
                </div>

                <div className="glass-card p-5 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm font-headline">Aktivitas Terakhir</h4>
                    <Link to="/activity" className="text-primary font-semibold text-xs font-body hover:underline flex items-center gap-1">
                      Semua <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {lastActivities.length === 0 ? (
                      <p className="text-on-surface-variant/50 text-xs font-body text-center py-4">Belum ada aktivitas.</p>
                    ) : lastActivities.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 p-3 rounded-2xl glass-card hover:bg-surface-container-low/80 transition-all">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.isIncome ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                          <span className="material-symbols-outlined text-xl">{tx.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold font-headline truncate">{tx.label}</p>
                          <p className="text-[10px] text-on-surface-variant/50 font-body truncate">{tx.group_name} • {tx.time}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`block text-sm font-bold font-body ${tx.isIncome ? 'text-secondary' : 'text-error'}`}>
                            Rp {tx.amount.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-on-surface-variant/40 font-medium font-body">
                            {tx.isIncome ? 'Kamu bayar' : 'Bagianmu'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
};

export default Insights;

