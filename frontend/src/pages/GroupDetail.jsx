import React, { useState, useEffect, useCallback, useContext } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import SettleUpModal from '../components/ui/SettleUpModal';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import AddMemberModal from '../components/ui/AddMemberModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Toast from '../components/ui/Toast';
import useCountUp from '../hooks/useCountUp';
import useAnimateOnMount from '../hooks/useAnimateOnMount';



const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const mounted = useAnimateOnMount();
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleData, setSettleData] = useState({ contact: '', amount: 0, fromUserId: null, toUserId: null, groupId: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState(null);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRemoveMemberConfirmOpen, setIsRemoveMemberConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ isOpen: true, message, type });
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, eRes, dRes, pendingRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/expenses`),
        api.get(`/groups/${id}/debts`),
        api.get(`/groups/${id}/settlements/pending`)
      ]);
      setGroup(gRes.data);
      setExpenses(eRes.data.items ?? eRes.data);
      setDebts(dRes.data);
      setPendingSettlements(pendingRes.data);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSettleUp = (contact, amount, fromUserId, toUserId) => {
    setSettleData({ contact, amount, fromUserId, toUserId, groupId: id });
    setIsSettleModalOpen(true);
  };

  const confirmRemoveMember = (member) => {
    setMemberToRemove(member);
    setIsRemoveMemberConfirmOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionLoading(true);
    try {
      await api.delete(`/groups/${id}/members/${memberToRemove.user_id}`);
      setIsRemoveMemberConfirmOpen(false);
      setMemberToRemove(null);
      showToast('Anggota berhasil dihapus', 'success');
      fetchAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Gagal menghapus anggota');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondSettlement = async (settlementId, action) => {
    try {
      await api.patch(`/settlements/${settlementId}`, { action });
      fetchAll();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleCloseGroup = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/groups/${id}/close`);
      setIsCloseConfirmOpen(false);
      showToast('Grup berhasil ditutup', 'success');
      fetchAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Gagal menutup grup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/groups/${id}`);
      setIsDeleteConfirmOpen(false);
      navigate('/groups');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Gagal menghapus grup');
    } finally {
      setActionLoading(false);
    }
  };

  const formatRupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  const CATEGORY_ICONS = { trip: 'flight', kosan: 'home', couple: 'favorite', other: 'category' };
  const CATEGORY_GRADIENT = {
    trip: 'from-blue-600 to-indigo-700',
    kosan: 'from-amber-600 to-orange-700',
    couple: 'from-pink-600 to-rose-700',
    other: 'from-primary to-primary-container',
  };

  const animatedSpending = useCountUp(group?.total_spending || 0, 1400, 200);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-5xl animate-spin text-primary">progress_activity</span>
        <span className="text-sm text-on-surface-variant font-body">Memuat detail grup...</span>
      </div>
    </div>
  );

  if (!group) return (
    <div className="flex justify-center items-center min-h-screen bg-surface">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">search_off</span>
        <p className="text-on-surface-variant font-body">Grup tidak ditemukan.</p>
      </div>
    </div>
  );

  const hasActiveBalances = debts && debts.member_balances.some(m => m.status !== 'Settled');

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopAppBar searchPlaceholder="Cari grup..." onMenuClick={() => setSidebarOpen(true)} />

      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">

          {/* Hero Header */}
          <section className={`bg-gradient-to-br ${CATEGORY_GRADIENT[group.category] || CATEGORY_GRADIENT.other} rounded-3xl p-8 text-white relative overflow-hidden ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-white/60 text-sm">{group.icon || CATEGORY_ICONS[group.category] || 'category'}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 font-body">{group.category}</span>
                  {group.status === 'closed' ? (
                    <span className="bg-white/15 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest font-body flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">lock</span>
                      Ditutup
                    </span>
                  ) : (
                    <span className="bg-white/15 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest font-body flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">bolt</span>
                      Aktif
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 font-headline">{group.name}</h1>
                <p className="text-white/60 font-medium font-body text-sm">{group.member_count} anggota • {group.payment_status}</p>
              </div>
              <div className="glass-card bg-white/10 border-white/15 p-5 rounded-2xl text-right min-w-[180px]">
                <p className="text-[10px] font-bold text-white/50 mb-1 uppercase tracking-widest font-body">Total Pengeluaran</p>
                <p className="text-2xl font-extrabold font-headline">{formatRupiah(animatedSpending)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3 relative z-10">
              {group.status === 'active' ? (
                <>
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="bg-white/10 backdrop-blur-sm text-white border border-white/15 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-all active:scale-95 font-body text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Tambah Anggota
                  </button>
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="bg-white text-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95 font-body text-sm shadow-lg"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Tambah Pengeluaran
                  </button>
                  {currentUser?.id === group.created_by && (
                    <button
                      onClick={() => setIsCloseConfirmOpen(true)}
                      className="bg-white/10 backdrop-blur-sm text-white border border-white/15 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-error/30 hover:border-error/30 transition-all active:scale-95 font-body text-sm ml-auto"
                    >
                      <span className="material-symbols-outlined text-lg">lock</span>
                      Tutup Grup
                    </button>
                  )}
                </>
              ) : (
                <>
                  {(currentUser?.id === group.created_by || group.status === 'closed') && (
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="bg-error/80 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-error transition-all active:scale-95 font-body text-sm"
                    >
                      <span className="material-symbols-outlined text-lg">delete_forever</span>
                      Hapus Grup Permanen
                    </button>
                  )}
                  <p className="text-white/50 text-xs font-medium font-body flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Grup ini sudah ditutup. Tidak ada aktivitas baru.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Members */}
          {group.members && group.members.length > 0 && (
            <section className={`${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-primary text-xl">group</span>
                Anggota Grup
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {group.members.map((m) => (
                  <div key={m.user_id} className="glass-card rounded-2xl p-4 flex items-center gap-3 relative group shrink-0 min-w-[180px] hover-lift">
                    {m.user.avatar_url
                      ? <img src={m.user.avatar_url} alt={m.user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/10" />
                      : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">{m.user.name[0]}</div>
                    }
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-on-surface font-body truncate">{m.user.name}</p>
                      <p className="text-xs text-on-surface-variant/50 font-body capitalize">{m.role}</p>
                    </div>
                    {currentUser && m.user_id !== currentUser.id && group.status === 'active' && (
                      <button
                        onClick={() => confirmRemoveMember(m)}
                        className="absolute top-2 right-2 p-1 rounded-full text-on-surface-variant/30 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Hapus anggota"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Member Balances */}
          {hasActiveBalances && (
            <section className={`${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 font-headline">
                <span className="material-symbols-outlined text-secondary text-xl">account_balance_wallet</span>
                Saldo Anggota
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {debts.member_balances.filter(m => m.status !== 'Settled').map((m) => (
                  <div
                    key={m.user_id}
                    className={`glass-card p-4 rounded-2xl border-l-4 hover-lift ${m.status === 'Is owed' ? 'border-l-secondary' : 'border-l-error'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.user_name} className="w-9 h-9 rounded-full object-cover" />
                        : <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{m.user_name[0]}</div>
                      }
                      <span className="font-bold font-body text-sm truncate">{m.user_name}</span>
                    </div>
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase mb-1 font-body">
                      {m.status === 'Is owed' ? 'Piutang' : 'Hutang'}
                    </p>
                    <p className={`text-lg font-extrabold font-headline ${m.status === 'Is owed' ? 'text-secondary' : 'text-error'}`}>
                      {formatRupiah(m.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pending Settlements */}
          {pendingSettlements.length > 0 && (
            <section className={`glass-card rounded-3xl p-6 border border-primary/10 ${mounted ? 'animate-in stagger-4' : 'opacity-0'}`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2 font-headline text-primary">
                  <span className="material-symbols-outlined">hourglass_empty</span>
                  Persetujuan Pembayaran
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{pendingSettlements.length}</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingSettlements.map((s) => (
                  <div key={s.id} className="bg-surface-container-lowest/80 p-5 rounded-2xl border border-outline-variant/10 flex flex-col gap-4 hover-lift">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {s.from_user_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium font-body leading-tight text-on-surface">
                          <span className="font-bold">{s.from_user_name}</span> telah membayar ke kamu:
                        </p>
                        <p className="text-2xl font-extrabold font-headline text-primary mt-1">{formatRupiah(s.amount)}</p>
                        {s.notes && <p className="text-xs text-on-surface-variant/50 font-body mt-1">Via {s.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => handleRespondSettlement(s.id, 'accept')}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1 font-body"
                      >
                        <span className="material-symbols-outlined text-sm">check</span> Terima
                      </button>
                      <button
                        onClick={() => handleRespondSettlement(s.id, 'reject')}
                        className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-1 font-body"
                      >
                        <span className="material-symbols-outlined text-sm">close</span> Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Expenses */}
          <section className={`space-y-4 ${mounted ? 'animate-in stagger-5' : 'opacity-0'}`}>
            <h2 className="text-lg font-bold font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
              Pengeluaran
            </h2>
            {expenses.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-3xl">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">receipt_long</span>
                <p className="text-on-surface-variant/50 text-sm font-body">Belum ada pengeluaran.</p>
                {group.status === 'active' && (
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="mt-3 text-primary font-semibold text-sm font-body hover:underline"
                  >
                    Tambah pengeluaran pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((exp) => (
                  <div key={exp.id} className="glass-card rounded-2xl p-4 flex items-center justify-between hover-lift transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{exp.icon || 'receipt'}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-base font-headline">{exp.title}</h3>
                        <p className="text-xs text-on-surface-variant/50 font-medium font-body">
                          Dibayar <span className="text-primary">{exp.paid_by_name}</span> • {exp.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold font-headline">{formatRupiah(exp.amount)}</p>
                      <p className="text-[10px] font-bold text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full inline-block font-body">{exp.split_type_label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Settlements */}
          {debts && debts.settlements.length > 0 && (
            <section className={`glass-card rounded-3xl p-6 mb-12 ${mounted ? 'animate-in stagger-6' : 'opacity-0'}`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-primary text-xl">currency_exchange</span>
                  Cara Melunasi
                </h2>
                <span className="text-[10px] font-bold bg-primary/8 text-primary px-3 py-1 rounded-full uppercase tracking-widest font-body">Jalur Optimal</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debts.settlements.map((s, i) => (
                  <div key={i} className="bg-surface-container-lowest/80 p-4 rounded-2xl flex items-center justify-between hover-lift border border-outline-variant/5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-9 h-9 rounded-full bg-error/10 text-error flex items-center justify-center font-bold text-xs">{s.from_user_name[0]}</div>
                        <span className="material-symbols-outlined text-on-surface-variant/30 text-base">arrow_forward</span>
                        <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">{s.to_user_name[0]}</div>
                      </div>
                      <div>
                        <p className="text-xs font-medium font-body">
                          <span className="font-bold">{s.from_user_name}</span> → <span className="font-bold">{s.to_user_name}</span>
                        </p>
                        <p className="text-primary font-extrabold font-headline text-sm">{formatRupiah(s.amount)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettleUp(s.to_user_name, s.amount, s.from_user_id, s.to_user_id)}
                      className="text-xs font-bold bg-gradient-to-r from-primary to-primary-container text-white px-4 py-2 rounded-xl hover:shadow-md hover:shadow-primary/20 active:scale-95 transition-all font-body"
                    >Tandai Lunas</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>


      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        defaultContact={settleData.contact}
        defaultAmount={settleData.amount}
        fromUserId={settleData.fromUserId}
        toUserId={settleData.toUserId}
        groupId={settleData.groupId}
        onSuccess={fetchAll}
      />
      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        groupId={id}
        onSuccess={fetchAll}
      />
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        groupId={id}
        onSuccess={fetchAll}
      />
      
      <ConfirmModal
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={handleCloseGroup}
        loading={actionLoading}
        title="Tutup Grup?"
        message="Apakah Anda yakin ingin menutup grup ini? Setelah ditutup, tidak ada anggota yang bisa menambah pengeluaran baru."
        confirmText="Ya, Tutup Sekarang"
        cancelText="Batal"
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteGroup}
        loading={actionLoading}
        title="Hapus Grup Permanen?"
        message="Data grup, riwayat pengeluaran, dan saldo akan dihapus selamanya. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Selamanya"
        cancelText="Jangan Hapus"
        type="danger"
      />

      <Toast 
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
    </div>
  );
};

export default GroupDetail;
