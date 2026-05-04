import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import SettleUpModal from '../components/ui/SettleUpModal';
import AddFriendModal from '../components/ui/AddFriendModal';
import api from '../services/api';
import useCountUp from '../hooks/useCountUp';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const DebtTracking = () => {
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [settleData, setSettleData] = useState({ contact: '', amount: 0, toUserId: null, groupId: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [debts, setDebts] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useAnimateOnMount();

  const fetchData = async () => {
    try {
      const [debtsRes, friendsRes, reqsRes] = await Promise.all([
        api.get('/users/me/debts'),
        api.get('/friends'),
        api.get('/friends/requests')
      ]);
      setDebts(debtsRes.data);
      setFriends(friendsRes.data);
      setFriendRequests(reqsRes.data);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSettleUp = (contact, amount, toUserId, groupId) => {
    setSettleData({ contact, amount, toUserId, groupId });
    setIsSettleModalOpen(true);
  };

  const handleBuzzer = async (expenseId, userId) => {
    try {
      await api.patch(`/expenses/${expenseId}/splits/${userId}/remind`);
      fetchData();
      alert("Pengingat berhasil dikirim!");
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      alert(e.response?.data?.detail || "Gagal mengirim pengingat");
    }
  };

  const handleRespondRequest = async (userId, action) => {
    try {
      await api.patch(`/friends/requests/${userId}`, { action });
      fetchData();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const formatRupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`;

  const oweList = debts?.owe || [];
  const owedList = debts?.owed || [];

  const animatedHutang = useCountUp(debts?.total_hutang || 0, 1400, 200);
  const animatedPiutang = useCountUp(debts?.total_piutang || 0, 1400, 300);

  const tabs = [
    { id: 'friends', label: 'Teman', count: friends.length, icon: 'group' },
    { id: 'owe', label: 'Saya Berutang', count: oweList.length, icon: 'trending_down' },
    { id: 'owed', label: 'Saya Diutangi', count: owedList.length, icon: 'trending_up' },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopAppBar searchPlaceholder="Search friends..." onMenuClick={() => setSidebarOpen(true)} />

      <main className="pt-24 pb-20 md:ml-64 px-6 min-h-screen">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">

          {/* Header */}
          <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1 font-headline">Teman & Hutang</h1>
              <p className="text-on-surface-variant/70 font-body text-sm">Kelola daftar teman dan lacak hutang piutang.</p>
            </div>
            <button
              onClick={() => setIsAddFriendModalOpen(true)}
              className="glass-card text-on-surface border border-outline-variant/20 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-surface-container-high transition-all active:scale-95 font-body text-sm"
            >
              <span className="material-symbols-outlined text-primary text-lg">person_add</span>
              Add Friend
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="skeleton h-28 rounded-3xl"></div>
                <div className="skeleton h-28 rounded-3xl"></div>
              </div>
              <div className="skeleton h-12 w-80 rounded-2xl"></div>
              <div className="skeleton h-20 rounded-2xl"></div>
              <div className="skeleton h-20 rounded-2xl"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
                <div className="glass-card p-6 rounded-3xl border-l-4 border-l-error hover-lift group">
                  <span className="text-on-surface-variant/50 font-medium text-xs flex items-center gap-2 font-body uppercase tracking-wider font-bold">
                    <span className="material-symbols-outlined text-error text-base">call_made</span>
                    Total Hutang Saya
                  </span>
                  <h2 className="text-3xl font-extrabold mt-2 text-error tracking-tight font-headline">{formatRupiah(animatedHutang)}</h2>
                </div>
                <div className="glass-card p-6 rounded-3xl border-l-4 border-l-secondary hover-lift group">
                  <span className="text-on-surface-variant/50 font-medium text-xs flex items-center gap-2 font-body uppercase tracking-wider font-bold">
                    <span className="material-symbols-outlined text-secondary text-base">call_received</span>
                    Total Piutang Saya
                  </span>
                  <h2 className="text-3xl font-extrabold mt-2 text-secondary tracking-tight font-headline">{formatRupiah(animatedPiutang)}</h2>
                </div>
              </div>

              {/* Tabs */}
              <div className={`flex glass-card p-1.5 rounded-2xl w-fit flex-wrap gap-1 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all font-body flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-white shadow-sm text-primary'
                        : 'text-on-surface-variant/50 hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    {tab.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant/50'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className={`space-y-4 ${mounted ? 'animate-in stagger-4' : 'opacity-0'}`}>
                {activeTab === 'friends' && (
                  <div className="space-y-6">
                    {/* Friend Requests */}
                    {friendRequests.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold text-on-surface mb-3 font-headline flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-lg">person_add</span>
                          Permintaan Pertemanan
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">{friendRequests.length}</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {friendRequests.map((req) => (
                            <div key={req.id} className="glass-card p-4 rounded-2xl flex items-center justify-between hover-lift border border-primary/10">
                              <div className="flex items-center gap-3">
                                {req.avatar_url ? (
                                  <img src={req.avatar_url} alt={req.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-base">
                                    {req.name[0]}
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-sm font-bold text-on-surface leading-tight font-headline">{req.name}</h3>
                                  <p className="text-xs text-on-surface-variant/50 font-body">{req.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRespondRequest(req.id, 'accept')}
                                  className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
                                  title="Terima"
                                >
                                  <span className="material-symbols-outlined text-sm">check</span>
                                </button>
                                <button
                                  onClick={() => handleRespondRequest(req.id, 'reject')}
                                  className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-error/10 hover:text-error active:scale-95 transition-all"
                                  title="Tolak"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Friends List */}
                    <div>
                      {friendRequests.length > 0 && <h3 className="text-base font-bold text-on-surface mb-3 font-headline">Daftar Teman</h3>}
                      {friends.length === 0
                        ? (
                          <div className="text-center py-12 glass-card rounded-3xl">
                            <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">person_add</span>
                            <p className="text-on-surface-variant/50 text-sm font-body">Belum ada teman yang ditambahkan.</p>
                          </div>
                        )
                        : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {friends.map((friend) => (
                              <div key={friend.id} className="glass-card p-4 rounded-2xl flex items-center gap-4 hover-lift">
                                {friend.avatar_url ? (
                                  <img src={friend.avatar_url} alt={friend.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-lg">
                                    {friend.name[0]}
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-base font-bold text-on-surface leading-tight font-headline">{friend.name}</h3>
                                  <p className="text-xs text-on-surface-variant/50 font-body mt-0.5">{friend.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                      }
                    </div>
                  </div>
                )}

                {activeTab === 'owe' && (
                  oweList.length === 0
                    ? (
                      <div className="text-center py-12 glass-card rounded-3xl">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">check_circle</span>
                        <p className="text-on-surface-variant/50 text-sm font-body">Tidak ada hutang aktif. 🎉</p>
                      </div>
                    )
                    : oweList.map((item) => (
                        <div key={item.expense_split_id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-lift border-l-4 border-l-error">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center font-bold text-lg shrink-0">
                              {item.to_user_name[0]}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-on-surface leading-tight font-headline">{item.to_user_name}</h3>
                              <p className="text-xs text-on-surface-variant/50 font-body mt-0.5">Grup: <span className="text-primary font-semibold">{item.group_name}</span></p>
                              <p className="text-xs text-on-surface-variant/40 font-body">{item.expense_title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xl font-extrabold text-error tracking-tight font-headline">{formatRupiah(item.amount)}</span>
                              <span className="block text-[10px] font-bold bg-error/10 text-error px-2 py-0.5 rounded-full mt-1 font-body">{item.status}</span>
                            </div>
                            <button
                              onClick={() => handleSettleUp(item.to_user_name, item.amount, item.to_user_id, item.group_id)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-primary-container text-white shadow-md shadow-primary/20 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 font-body shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span> Bayar
                            </button>
                          </div>
                        </div>
                      ))
                )}

                {activeTab === 'owed' && (
                  owedList.length === 0
                    ? (
                      <div className="text-center py-12 glass-card rounded-3xl">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">account_balance</span>
                        <p className="text-on-surface-variant/50 text-sm font-body">Tidak ada piutang aktif.</p>
                      </div>
                    )
                    : owedList.map((item) => (
                        <div key={item.expense_split_id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-lift border-l-4 border-l-secondary">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg shrink-0">
                              {item.from_user_name[0]}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-on-surface leading-tight font-headline">{item.from_user_name}</h3>
                              <p className="text-xs text-on-surface-variant/50 font-body mt-0.5">Grup: <span className="text-primary font-semibold">{item.group_name}</span></p>
                              <p className="text-xs text-on-surface-variant/40 font-body">{item.expense_title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xl font-extrabold text-secondary tracking-tight font-headline">{formatRupiah(item.amount)}</span>
                              <span className="block text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full mt-1 font-body">{item.status}</span>
                            </div>
                            <button
                              onClick={() => handleBuzzer(item.expense_id, item.from_user_id)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold border-2 border-error/30 text-error hover:bg-error hover:text-white hover:border-error transition-all flex items-center gap-1.5 font-body shrink-0 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-sm">notifications_active</span> Buzzer
                            </button>
                          </div>
                        </div>
                      ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        defaultContact={settleData.contact}
        defaultAmount={settleData.amount}
        toUserId={settleData.toUserId}
        groupId={settleData.groupId}
        onSuccess={fetchData}
      />
      <AddFriendModal isOpen={isAddFriendModalOpen} onClose={() => setIsAddFriendModalOpen(false)} onSuccess={fetchData} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
    </div>
  );
};

export default DebtTracking;
