import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import useAnimateOnMount from '../hooks/useAnimateOnMount';
import api from '../services/api';
import { classifyExpense, predictExpense } from '../services/ai';

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

// Indeks sesuai Date.getDay() (0=Sun..6=Sat). Friday=5 adalah reference category (all 0).
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
    // Friday (index 5) → dayCol null → semua day_of_week_* tetap 0, encoding yang benar
  }

  return row;
};

const formatRupiah = (n) =>
  n != null ? `Rp ${Number(n).toLocaleString('id-ID')}` : '—';

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
  });
  const mounted = useAnimateOnMount();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setHardError('');
      setAiError('');

      try {
        // Tidak ada gating health check — biarkan setiap call gagal sendiri
        const [aRes, scoreRes] = await Promise.all([
          api.get('/users/me/activities'),
          api.get('/users/me/financial-score'),
        ]);

        const acts = (aRes.data || []).slice(0, 20);
        setActivities(acts);

        const score = scoreRes.data?.score ?? null;
        const scoreLabel = scoreRes.data?.label ?? null;

        if (acts.length === 0) {
          setInsight({ totalExpense: null, category: null, predicted: null, score, scoreLabel, recommendations: [] });
          return;
        }

        // Kalkulasi dari data lokal, tidak butuh AI
        const expenseActs = acts.filter((a) => !a.paid_by_me);
        const totalExpense = expenseActs.reduce((sum, a) => sum + Number(a.amount || 0), 0);

        const catFreq = {};
        expenseActs.forEach((a) => {
          const c = (a.category || 'lainnya').toLowerCase();
          catFreq[c] = (catFreq[c] || 0) + 1;
        });
        const topCatRaw = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        // Classify — hanya butuh 1 aktivitas, gagal = pakai data lokal
        let classifiedCategory = topCatRaw;
        try {
          const latest = acts[0];
          const classifyRes = await classifyExpense({
            notes: latest.title || 'transaksi',
            amount_idr: Number(latest.amount || 0),
            payment_mode: 'unknown',
            location: 'unknown',
            day_of_week: 'Monday',
            is_weekend: false,
            top_k: 2,
          });
          classifiedCategory = classifyRes?.predicted_category || topCatRaw;
        } catch {
          // Gunakan topCatRaw dari frekuensi data lokal
        }

        const categoryDisplay =
          CATEGORY_MAP[classifiedCategory] || CATEGORY_MAP[topCatRaw] || 'Lainnya';

        // Predict — butuh >= 10 aktivitas
        let predicted = null;
        if (acts.length >= PROGRESS_THRESHOLD) {
          try {
            const rows = acts.slice(0, PROGRESS_THRESHOLD).map(buildFeatureRow);
            const predRes = await predictExpense({ rows, n_steps_ahead: 1 });
            predicted = predRes?.predictions?.[0]?.prediksi_idr ?? null;
          } catch {
            setAiError('Prediksi AI tidak tersedia saat ini.');
          }
        }

        // Rekomendasi berdasarkan data yang benar-benar tersedia
        const recommendations = [];
        if (classifiedCategory) {
          recommendations.push({
            icon: 'insights',
            title: `Fokus ${categoryDisplay}`,
            desc: `Kategori pengeluaran dominanmu adalah ${categoryDisplay}. Tetapkan batas mingguan agar tidak over-budget.`,
          });
        }
        if (predicted != null) {
          recommendations.push({
            icon: 'savings',
            title: 'Jaga Tren Bulan Depan',
            desc: `Prediksi bulan depan sekitar ${formatRupiah(predicted)}. Atur pengeluaran rutin agar tetap di bawah angka ini.`,
          });
        } else if (acts.length < PROGRESS_THRESHOLD) {
          recommendations.push({
            icon: 'add_circle',
            title: 'Aktifkan Prediksi AI',
            desc: `Tambah ${PROGRESS_THRESHOLD - acts.length} transaksi lagi untuk mengaktifkan prediksi pengeluaran bulan depan.`,
          });
        } else {
          recommendations.push({
            icon: 'savings',
            title: 'Sisihkan di Awal',
            desc: 'Transfer ke tabungan segera setelah menerima penghasilan sebelum sempat digunakan untuk hal lain.',
          });
        }

        setInsight({ totalExpense, category: categoryDisplay, predicted, score, scoreLabel, recommendations });
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
      (activities || []).slice(0, 2).map((a) => ({
        icon: a.icon || 'receipt_long',
        label: a.title || 'Transaksi',
        time: a.date || '-',
        amount: `${a.paid_by_me ? '+' : '-'} ${formatRupiah(a.amount || 0)}`,
        isIncome: a.paid_by_me,
      })),
    [activities]
  );

  const progressPct = Math.min((activities.length / PROGRESS_THRESHOLD) * 100, 100);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <TopAppBar searchPlaceholder="Search transactions..." onMenuClick={() => setSidebarOpen(true)} />
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

        {/* Hard error — API utama gagal */}
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

        {/* Empty state — belum ada transaksi */}
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
                <h3 className="font-headline font-bold text-base mb-4">Financial Score</h3>
                <span className="text-5xl font-black text-primary font-headline">{insight.score}</span>
                <span className="text-xs font-bold text-secondary tracking-widest uppercase mt-1 font-body">{insight.scoreLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* Main content — ada aktivitas */}
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
                <p className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest mb-3 font-body">Total Pengeluaran</p>
                <span className="text-primary font-headline text-3xl font-extrabold">
                  {insight.totalExpense != null ? formatRupiah(insight.totalExpense) : '—'}
                </span>
              </div>

              <div className="glass-card p-6 rounded-3xl border-l-4 border-l-secondary hover-lift">
                <p className="text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest mb-3 font-body">Kategori Terbesar</p>
                <span className="text-secondary font-headline text-3xl font-extrabold">
                  {insight.category || '—'}
                </span>
              </div>

              {/* Prediksi — conditional berdasarkan ketersediaan data */}
              <div className="bg-gradient-to-br from-primary to-primary-container text-white p-6 rounded-3xl shadow-lg shadow-primary/15 flex flex-col justify-between">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest font-body">Prediksi Bulan Depan</p>
                {insight.predicted != null ? (
                  <span className="font-headline text-3xl font-extrabold mt-2">{formatRupiah(insight.predicted)}</span>
                ) : activities.length < PROGRESS_THRESHOLD ? (
                  <div className="mt-3">
                    <p className="font-headline text-base font-bold">Kumpulkan lebih banyak data</p>
                    <div className="mt-2 bg-white/25 rounded-full h-1.5 w-full overflow-hidden">
                      <div
                        className="bg-white h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-white/70 text-xs mt-1.5">{activities.length} / {PROGRESS_THRESHOLD} transaksi</p>
                  </div>
                ) : (
                  <span className="font-headline text-3xl font-extrabold mt-2">—</span>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className={`lg:col-span-8 space-y-8 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
                {insight.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-headline font-bold text-base flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      AI Recommendations
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
                  <h3 className="font-headline font-bold text-base mb-6">Financial Score</h3>
                  <span className="text-5xl font-black text-primary font-headline">
                    {insight.score ?? '—'}
                  </span>
                  <span className="text-xs font-bold text-secondary tracking-widest uppercase mt-1 font-body">
                    {insight.scoreLabel ?? ''}
                  </span>
                </div>

                <div className="glass-card p-5 rounded-3xl">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="font-bold text-sm font-headline">Aktivitas Terakhir</h4>
                  </div>
                  <div className="space-y-3">
                    {(lastActivities.length
                      ? lastActivities
                      : [{ icon: 'receipt_long', label: 'Belum ada aktivitas', time: '-', amount: '-', isIncome: false }]
                    ).map((tx) => (
                      <div key={`${tx.label}-${tx.time}`} className="flex items-center gap-3 p-2 rounded-xl">
                        <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg">{tx.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold font-body truncate">{tx.label}</p>
                          <p className="text-[10px] text-on-surface-variant/40 font-body">{tx.time}</p>
                        </div>
                        <span className={`text-xs font-bold font-body shrink-0 ${tx.isIncome ? 'text-green-600' : 'text-error'}`}>
                          {tx.amount}
                        </span>
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
