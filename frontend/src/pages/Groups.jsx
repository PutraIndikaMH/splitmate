import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import CreateGroupModal from '../components/ui/CreateGroupModal';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const CATEGORY_ICONS = {
  trip: 'flight',
  kosan: 'home',
  couple: 'favorite',
  other: 'category',
};

const CATEGORY_ACCENT = {
  trip: 'border-l-blue-500 from-blue-500/8 to-transparent',
  kosan: 'border-l-amber-500 from-amber-500/8 to-transparent',
  couple: 'border-l-pink-500 from-pink-500/8 to-transparent',
  other: 'border-l-slate-400 from-slate-400/8 to-transparent',
};

const CATEGORY_ICON_BG = {
  trip: 'bg-blue-500/10 text-blue-600',
  kosan: 'bg-amber-500/10 text-amber-600',
  couple: 'bg-pink-500/10 text-pink-600',
  other: 'bg-slate-500/10 text-slate-600',
};

const Groups = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useAnimateOnMount();

  const fetchGroups = async () => {
    try {
      const [gRes, invRes] = await Promise.all([
        api.get('/groups'),
        api.get('/groups/invitations')
      ]);
      setGroups(gRes.data);
      setInvitations(invRes.data);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleRespondInvite = async (groupId, action) => {
    try {
      await api.patch(`/groups/invitations/${groupId}`, { action });
      fetchGroups();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const formatRupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopAppBar searchPlaceholder="Cari grup..." onMenuClick={() => setSidebarOpen(true)} />
      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

          {/* Header */}
          <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1 font-headline">Semua Grup</h1>
              <p className="text-on-surface-variant/70 font-body text-sm">Kelola semua pengeluaran bersama di satu tempat.</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all font-body active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined">group_add</span>
              Buat Grup
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <div key={i} className="skeleton h-52 rounded-3xl"></div>)}
            </div>
          ) : (
            <>
              {/* Invitations */}
              {invitations.length > 0 && (
                <div className={`space-y-4 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
                  <h2 className="text-lg font-bold text-on-surface font-headline flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">mail</span>
                    Undangan Grup
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{invitations.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invitations.map((inv) => (
                      <div key={inv.group_id} className="p-5 glass-card rounded-3xl border border-primary/15 hover-lift flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                            <span className="material-symbols-outlined">{inv.group_icon}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-on-surface mb-0.5 font-headline">{inv.group_name}</h3>
                            <p className="text-on-surface-variant/50 text-xs font-body">Dari <span className="font-semibold text-on-surface-variant">{inv.inviter_name}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <button
                            onClick={() => handleRespondInvite(inv.group_id, 'accept')}
                            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1 font-body"
                          >
                            <span className="material-symbols-outlined text-sm">check</span> Terima
                          </button>
                          <button
                            onClick={() => handleRespondInvite(inv.group_id, 'reject')}
                            className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-1 font-body"
                          >
                            <span className="material-symbols-outlined text-sm">close</span> Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Groups Grid */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
                {groups.map((group, i) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className={`glass-card rounded-3xl overflow-hidden hover-lift group transition-all duration-300 border-l-4 ${CATEGORY_ACCENT[group.category] || CATEGORY_ACCENT.other}`}
                    style={{ background: `linear-gradient(135deg, ${group.category === 'trip' ? 'rgba(59,130,246,0.04)' : group.category === 'couple' ? 'rgba(236,72,153,0.04)' : group.category === 'kosan' ? 'rgba(245,158,11,0.04)' : 'rgba(100,116,139,0.04)'}, transparent)` }}
                  >
                    <div className="p-6">
                      <div className={`w-12 h-12 rounded-2xl ${CATEGORY_ICON_BG[group.category] || CATEGORY_ICON_BG.other} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <span className="material-symbols-outlined text-2xl">{group.icon || CATEGORY_ICONS[group.category] || 'category'}</span>
                      </div>
                      <h3 className="font-bold text-xl font-headline mb-1 group-hover:text-primary transition-colors">{group.name}</h3>
                      <p className="text-sm font-medium text-on-surface-variant/50 font-body mb-5">{group.member_count} anggota</p>
                      <div className="flex justify-between items-end pb-4 border-b border-outline-variant/10 mb-4">
                        <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest font-body">Total Pengeluaran</span>
                        <span className="font-bold text-primary font-headline">{formatRupiah(group.total_spending)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full font-body ${group.payment_status === 'Lunas' ? 'bg-secondary/10 text-secondary' : 'bg-amber-100 text-amber-700'}`}>
                          {group.payment_status}
                        </span>
                        {group.status === 'closed' && (
                          <span className="bg-error/10 text-error text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest font-body border border-error/20 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">lock</span>
                            Ditutup
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Add Group Card */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-3xl p-6 text-on-surface-variant/40 hover:text-primary hover:border-primary/30 hover:bg-primary/3 transition-all outline-none group min-h-[200px]"
                >
                  <div className="w-16 h-16 rounded-2xl bg-surface-container/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-all group-hover:scale-110">
                    <span className="material-symbols-outlined text-3xl">add</span>
                  </div>
                  <span className="font-bold text-sm font-body">Buat Grup Baru</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav />
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchGroups()}
      />
    </div>
  );
};

export default Groups;
