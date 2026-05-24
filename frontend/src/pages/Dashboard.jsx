import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import CreateGroupModal from '../components/ui/CreateGroupModal';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const CATEGORY_ICONS = { trip: 'flight', kosan: 'home', couple: 'favorite', other: 'category' };
const CATEGORY_COLORS = {
  trip: 'from-blue-500/20 to-indigo-500/10 text-blue-600',
  kosan: 'from-amber-500/20 to-orange-500/10 text-amber-600',
  couple: 'from-pink-500/20 to-rose-500/10 text-pink-600',
  other: 'from-slate-500/20 to-gray-500/10 text-slate-600',
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat Pagi';
  if (h < 17) return 'Selamat Siang';
  if (h < 21) return 'Selamat Sore';
  return 'Selamat Malam';
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const mounted = useAnimateOnMount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [debts, setDebts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [financialScore, setFinancialScore] = useState({ score: 0, label: 'Menghitung...' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [gRes, dRes, aRes, invRes, scoreRes] = await Promise.all([
        api.get('/groups'),
        api.get('/users/me/debts'),
        api.get('/users/me/activities?limit=3'),
        api.get('/groups/invitations'),
        api.get('/users/me/financial-score')
      ]);
      setGroups(gRes.data.slice(0, 3));
      setDebts(dRes.data);
      setActivities(aRes.data);
      setInvitations(invRes.data);
      setFinancialScore(scoreRes.data);
    } catch (e) { if (import.meta.env.DEV) console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRespondInvite = async (groupId, action) => {
    try {
      await api.patch(`/groups/invitations/${groupId}`, { action });
      fetchData();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const formatRupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  // Count-up animations
  const animatedHutang = useCountUp(debts?.total_hutang || 0, 1400, 300);
  const animatedPiutang = useCountUp(debts?.total_piutang || 0, 1400, 400);
  const animatedScore = useCountUp(financialScore.score, 1600, 500);
  const netBalance = (debts?.total_piutang || 0) - (debts?.total_hutang || 0);
  const animatedNet = useCountUp(Math.abs(netBalance), 1400, 350);

  // Skeleton component
  const SkeletonCard = ({ className = '' }) => (
    <div className={`skeleton h-28 rounded-3xl ${className}`}></div>
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <TopAppBar searchPlaceholder="Cari di dashboard..." onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-24 min-h-screen px-6 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header Section */}
          <header className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <div>
              <p className="text-primary font-semibold text-sm mb-1 font-body flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>waving_hand</span>
                {getGreeting()}
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface font-headline">
                {user?.name?.split(' ')[0] || 'Dashboard'}
              </h1>
              <p className="text-on-surface-variant mt-1 font-body text-sm">Ringkasan keuangan dan aktivitas terbaru.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsGroupModalOpen(true)}
                className="px-5 py-2.5 glass-card rounded-2xl font-semibold text-sm hover:bg-surface-container-high transition-all flex items-center gap-2 font-body border border-outline-variant/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg text-primary">group_add</span>
                Buat Grup
              </button>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 font-body active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Catat Pengeluaran
              </button>
            </div>
          </header>

          {/* Summary Bento Grid */}
          {loading ? (
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
            </section>
          ) : (
            <section className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
              {/* Net Balance - Hero Card */}
              <div className={`p-5 rounded-3xl col-span-2 lg:col-span-1 ${netBalance >= 0 ? 'bg-gradient-to-br from-secondary/90 to-secondary text-white' : 'bg-gradient-to-br from-error/90 to-error text-white'} shadow-lg relative overflow-hidden hover-lift`}>
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <span className="text-white/70 text-xs font-bold uppercase tracking-wider font-body">Saldo Bersih</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-extrabold font-headline">
                    {netBalance >= 0 ? '+' : '-'}Rp {animatedNet.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-white/70">
                  <span className="material-symbols-outlined text-sm">{netBalance >= 0 ? 'trending_up' : 'trending_down'}</span>
                  <span className="text-xs font-semibold font-body">{netBalance >= 0 ? 'Kamu diutangi lebih banyak' : 'Kamu punya hutang'}</span>
                </div>
              </div>

              {/* Utang */}
              <div className="p-5 glass-card rounded-3xl hover-lift group">
                <span className="text-on-surface-variant/60 text-xs font-bold uppercase tracking-wider font-body">Utang Saya</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xl font-extrabold font-headline text-error">{formatRupiah(animatedHutang)}</span>
                  <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center text-error group-hover:bg-error group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-xl">trending_down</span>
                  </div>
                </div>
              </div>

              {/* Piutang */}
              <div className="p-5 glass-card rounded-3xl hover-lift group">
                <span className="text-on-surface-variant/60 text-xs font-bold uppercase tracking-wider font-body">Piutang Saya</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xl font-extrabold font-headline text-secondary">{formatRupiah(animatedPiutang)}</span>
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-xl">trending_up</span>
                  </div>
                </div>
              </div>

              {/* Skor Finansial */}
              <div className="p-5 glass-card rounded-3xl hover-lift group">
                <span className="text-on-surface-variant/60 text-xs font-bold uppercase tracking-wider font-body">Skor Keuangan</span>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-2xl font-extrabold font-headline">{animatedScore}</span>
                    <span className="text-[10px] font-bold text-secondary tracking-wider uppercase font-body">{financialScore.label}</span>
                  </div>
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Groups */}
            <section className={`lg:col-span-2 space-y-6 ${mounted ? 'animate-in stagger-4' : 'opacity-0'}`}>

              {/* Invitations */}
              {invitations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">mail</span>
                    Undangan Grup
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{invitations.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {invitations.map((inv) => (
                      <div key={inv.group_id} className="p-4 glass-card rounded-2xl border border-primary/15 hover-lift">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-11 h-11 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">{inv.group_icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-on-surface font-headline truncate">{inv.group_name}</h3>
                            <p className="text-on-surface-variant/60 text-xs font-body">Dari <span className="font-semibold text-on-surface-variant">{inv.inviter_name}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespondInvite(inv.group_id, 'accept')}
                            className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1 font-body"
                          >
                            <span className="material-symbols-outlined text-sm">check</span> Terima
                          </button>
                          <button
                            onClick={() => handleRespondInvite(inv.group_id, 'reject')}
                            className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-1 font-body"
                          >
                            <span className="material-symbols-outlined text-sm">close</span> Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Groups */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface font-headline">Grup Terbaru</h2>
                <Link to="/groups" className="text-primary font-semibold text-xs hover:underline font-body flex items-center gap-1">
                  Lihat Semua <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SkeletonCard className="h-44" /><SkeletonCard className="h-44" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.length === 0 ? (
                    <div className="col-span-2 text-center py-12 glass-card rounded-3xl">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">group_add</span>
                      <p className="text-on-surface-variant text-sm font-body mb-2">Belum ada grup.</p>
                      <button onClick={() => setIsGroupModalOpen(true)} className="text-primary font-semibold text-sm hover:underline font-body">
                        Buat grup pertamamu!
                      </button>
                    </div>
                  ) : (
                    groups.map((group, i) => (
                      <Link
                        key={group.id}
                        to={`/groups/${group.id}`}
                        className={`block p-5 glass-card rounded-3xl hover-lift group cursor-pointer transition-all duration-300`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-11 h-11 bg-gradient-to-br ${CATEGORY_COLORS[group.category] || CATEGORY_COLORS.other} rounded-xl flex items-center justify-center`}>
                            <span className="material-symbols-outlined">{group.icon || CATEGORY_ICONS[group.category] || 'group'}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${group.payment_status === 'Lunas' ? 'bg-secondary/10 text-secondary' : 'bg-amber-100 text-amber-700'}`}>
                            {group.payment_status}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-on-surface mb-0.5 font-headline group-hover:text-primary transition-colors">{group.name}</h3>
                        <p className="text-on-surface-variant/50 text-xs mb-4 font-body">{group.member_count} Anggota</p>
                        <div className="flex justify-between items-end pt-3 border-t border-outline-variant/10">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {group.name[0]}
                          </div>
                          <div className="text-right">
                            <span className="block text-[10px] text-on-surface-variant/40 font-bold uppercase font-body">Total</span>
                            <span className="font-bold text-sm text-on-surface font-headline">{formatRupiah(group.total_spending || 0)}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </section>

            {/* Right Column: Insight CTA + Activity */}
            <section className={`space-y-6 ${mounted ? 'animate-in stagger-5' : 'opacity-0'}`}>
              {/* Insight CTA */}
              <Link to="/insights" className="block p-6 bg-gradient-to-br from-indigo-900 via-primary to-primary-container rounded-3xl text-white relative overflow-hidden group hover-lift">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-indigo-200" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <span className="text-[10px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-body">Analisis AI</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2 font-headline">Lihat Insight</h3>
                  <p className="text-indigo-100/80 text-xs mb-5 leading-relaxed font-body">Analisis kebiasaan belanjamu dan hemat hingga 20% bulan depan.</p>
                  <span className="inline-block w-full py-2.5 bg-white/15 backdrop-blur-sm text-white rounded-xl font-bold text-sm text-center group-hover:bg-white/25 transition-colors font-body border border-white/10">
                    Mulai Analisis →
                  </span>
                </div>
                <div className="absolute -right-8 -bottom-8 opacity-10">
                  <span className="material-symbols-outlined" style={{ fontSize: '140px' }}>insights</span>
                </div>
              </Link>

              {/* Recent Activity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-on-surface font-headline">Aktivitas Terakhir</h2>
                  <Link to="/activity" className="text-primary font-semibold text-xs font-body hover:underline flex items-center gap-1">
                    Semua <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>

                <div className="space-y-2">
                  {loading ? (
                    <>
                      <div className="skeleton h-16 rounded-2xl"></div>
                      <div className="skeleton h-16 rounded-2xl"></div>
                    </>
                  ) : activities.length === 0 ? (
                    <p className="text-on-surface-variant/50 text-sm font-body text-center py-6">Belum ada aktivitas.</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-center gap-3 p-3 rounded-2xl glass-card hover:bg-surface-container-low/80 transition-all cursor-pointer group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.paid_by_me ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
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
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />

      {/* Modals */}
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onSuccess={fetchData} />
    </div>
  );
};

export default Dashboard;
