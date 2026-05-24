import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import api from '../services/api';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const PAGE_SIZE = 20;

const ActivityItem = ({ act }) => (
  <div className="flex items-center gap-3 p-3 rounded-2xl glass-card hover:bg-surface-container-low/80 transition-all">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${act.paid_by_me ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
      <span className="material-symbols-outlined text-xl">{act.icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-on-surface font-headline truncate">{act.title}</h4>
      <p className="text-[10px] text-on-surface-variant/50 font-body truncate">{act.group_name} • {act.date}</p>
    </div>
    <div className="text-right shrink-0">
      <span className={`block text-sm font-bold font-body ${act.paid_by_me ? 'text-secondary' : 'text-error'}`}>
        Rp {Number(act.amount).toLocaleString('id-ID')}
      </span>
      <span className="text-[9px] text-on-surface-variant/40 font-medium font-body">
        {act.paid_by_me ? 'Kamu bayar' : 'Bagianmu'}
      </span>
    </div>
  </div>
);

const Activity = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const mounted = useAnimateOnMount();

  const fetchActivities = async (skip = 0, append = false) => {
    if (skip === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/users/me/activities?limit=${PAGE_SIZE}&skip=${skip}`);
      const data = res.data || [];
      setActivities(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError('Gagal memuat aktivitas. Periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <TopAppBar searchPlaceholder="Cari aktivitas..." onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 min-h-screen pt-24 px-6 pb-12">
        <div className="max-w-3xl mx-auto">

          <header className={`mb-8 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface font-headline mb-1">
              Semua Aktivitas
            </h1>
            <p className="text-on-surface-variant/70 font-body text-sm">
              Riwayat seluruh transaksi yang melibatkan kamu.
            </p>
          </header>

          {/* Error state */}
          {error && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-error/40 mb-4 block">wifi_off</span>
              <p className="font-bold text-sm">{error}</p>
              <button
                onClick={() => { setError(''); fetchActivities(); }}
                className="mt-4 bg-primary text-white px-5 py-2.5 rounded-2xl font-bold text-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && activities.length === 0 && (
            <div className="flex flex-col items-center text-center py-20">
              <span className="material-symbols-outlined text-6xl text-primary/20 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
                receipt_long
              </span>
              <h2 className="text-xl font-extrabold font-headline mb-2">Belum ada aktivitas</h2>
              <p className="text-sm text-on-surface-variant/60 font-body max-w-xs leading-relaxed">
                Transaksi yang melibatkan kamu akan muncul di sini.
              </p>
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-6 bg-primary text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Catat Pengeluaran
              </button>
            </div>
          )}

          {/* Activity list */}
          {!loading && !error && activities.length > 0 && (
            <div className={`space-y-2 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
              {activities.map(act => (
                <ActivityItem key={act.id} act={act} />
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => fetchActivities(activities.length, true)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 glass-card rounded-2xl font-bold text-sm text-primary hover:bg-primary/5 transition-all disabled:opacity-50 font-body"
                  >
                    {loadingMore ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        Memuat...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">expand_more</span>
                        Muat Lebih
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && activities.length > 0 && (
                <p className="text-center text-[10px] text-on-surface-variant/30 font-body pt-6 pb-2 uppercase tracking-widest">
                  Semua aktivitas sudah ditampilkan
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
};

export default Activity;
