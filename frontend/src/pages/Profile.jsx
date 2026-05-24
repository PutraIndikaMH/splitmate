import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import { AuthContext } from '../context/AuthContext';
import useAnimateOnMount from '../hooks/useAnimateOnMount';
import api from '../services/api';

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [stats, setStats] = useState({ groups: null, transaksi: null, skor: null, skorLabel: null });
  const { user } = useContext(AuthContext);
  const mounted = useAnimateOnMount();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    : '';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [gRes, aRes, scoreRes] = await Promise.all([
          api.get('/groups'),
          api.get('/users/me/activities'),
          api.get('/users/me/financial-score'),
        ]);
        setStats({
          groups: gRes.data.length,
          transaksi: aRes.data.length,
          skor: scoreRes.data.score,
          skorLabel: scoreRes.data.label,
        });
      } catch {
        // Stats tetap null — ditangani di render
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 min-h-screen">
        <TopAppBar searchPlaceholder="Cari profil..." onMenuClick={() => setSidebarOpen(true)} />

        <section className="max-w-3xl mx-auto px-6 pt-24 pb-12">
          {/* Hero Avatar */}
          <div className={`flex flex-col items-center text-center mb-10 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <div className="relative mb-5">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary-container ring-4 ring-primary/10 flex items-center justify-center overflow-hidden shadow-xl shadow-primary/15">
                {user?.avatar_url ? (
                  <img alt={user.name} className="w-full h-full object-cover" src={user.avatar_url} />
                ) : (
                  <span className="text-4xl font-extrabold text-white font-headline">
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <Link
                to="/settings"
                className="absolute bottom-0 right-0 p-2 bg-secondary text-on-secondary rounded-full shadow-lg border-4 border-surface hover:scale-110 transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </Link>
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-headline mb-1">{user?.name || '—'}</h2>
            <p className="text-on-surface-variant/60 font-medium font-body text-sm mb-3">{user?.email || '—'}</p>
            {memberSince && (
              <span className="text-[10px] text-on-surface-variant/40 px-4 py-1.5 glass-card rounded-full font-body font-semibold uppercase tracking-wider">
                Member sejak {memberSince}
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-3 gap-3 mb-10 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
            {[
              { icon: 'groups',      label: 'Grup',      color: 'text-primary',           bg: 'bg-primary/8',           value: stats.groups,   sub: null },
              { icon: 'swap_horiz',  label: 'Transaksi', color: 'text-secondary',          bg: 'bg-secondary/8',         value: stats.transaksi, sub: null },
              { icon: 'trending_up', label: 'Skor',      color: 'text-primary-container',  bg: 'bg-primary-container/15', value: stats.skor,    sub: stats.skorLabel },
            ].map(({ icon, label, color, bg, value, sub }) => (
              <div key={label} className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center text-center hover-lift group">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <span className={`material-symbols-outlined ${color} text-xl`}>{icon}</span>
                </div>
                <span className="text-2xl font-extrabold text-on-surface font-headline">
                  {value !== null ? value : '—'}
                </span>
                {sub && value !== null && (
                  <span className="text-[9px] font-bold text-secondary tracking-widest uppercase font-body">{sub}</span>
                )}
                <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest font-body mt-1">{label}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className={`glass-card rounded-3xl overflow-hidden divide-y divide-surface-container/50 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
            <Link to="/settings" className="flex items-center justify-between p-5 hover:bg-surface-container/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">settings</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface font-body block">Pengaturan Akun</span>
                  <span className="text-xs text-on-surface-variant/40 font-body">Kelola profil dan preferensi</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
            </Link>
            <Link to="/notifications" className="flex items-center justify-between p-5 hover:bg-surface-container/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/8 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface font-body block">Notifikasi</span>
                  <span className="text-xs text-on-surface-variant/40 font-body">Pantau undangan dan tagihan</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-secondary group-hover:translate-x-1 transition-all">chevron_right</span>
            </Link>
            <Link to="/activity" className="flex items-center justify-between p-5 hover:bg-surface-container/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/8 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface font-body block">Aktivitas</span>
                  <span className="text-xs text-on-surface-variant/40 font-body">Lihat riwayat transaksi kamu</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-secondary group-hover:translate-x-1 transition-all">chevron_right</span>
            </Link>
            <Link to="/friends" className="flex items-center justify-between p-5 hover:bg-surface-container/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container/15 flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">people</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface font-body block">Teman & Hutang</span>
                  <span className="text-xs text-on-surface-variant/40 font-body">Kelola pertemanan dan hutang</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary-container group-hover:translate-x-1 transition-all">chevron_right</span>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
};

export default Profile;
