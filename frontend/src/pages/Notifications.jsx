import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import api from '../services/api';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const Notifications = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buzzerFeedback, setBuzzerFeedback] = useState({ id: null, success: false, error: '' });
  const mounted = useAnimateOnMount();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/users/me/notifications');
      setNotifications(res.data);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleGroupInvite = async (groupId, action) => {
    try {
      await api.patch(`/groups/invitations/${groupId}`, { action });
      fetchNotifications();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleSettlementRespond = async (settlementId, action) => {
    try {
      await api.patch(`/settlements/${settlementId}`, { action });
      fetchNotifications();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleBuzzer = async (expenseId, userId, notifId) => {
    setBuzzerFeedback({ id: notifId, success: false, error: '' });
    try {
      await api.patch(`/expenses/${expenseId}/splits/${userId}/remind`);
      fetchNotifications();
      setBuzzerFeedback({ id: notifId, success: true, error: '' });
      setTimeout(() => setBuzzerFeedback({ id: null, success: false, error: '' }), 3000);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      setBuzzerFeedback({ id: notifId, success: false, error: e.response?.data?.detail || 'Gagal mengirim pengingat' });
      setTimeout(() => setBuzzerFeedback({ id: null, success: false, error: '' }), 3000);
    }
  };

  const tabs = [
    { id: 'all', label: 'Semua', icon: 'inbox' },
    { id: 'unread', label: 'Belum Dibaca', icon: 'mark_email_unread' },
    { id: 'bills', label: 'Tagihan', icon: 'payments' },
    { id: 'system', label: 'Sistem', icon: 'settings' },
  ];

  const TYPE_CONFIG = {
    group_invite: {
      icon: 'group_add',
      accent: 'border-l-primary',
      iconBg: 'bg-primary/10 text-primary',
    },
    settlement_pending: {
      icon: 'hourglass_empty',
      accent: 'border-l-primary-container',
      iconBg: 'bg-primary-container/20 text-primary-container',
    },
    settlement_confirmed: {
      icon: 'receipt_long',
      accent: 'border-l-secondary',
      iconBg: 'bg-secondary/10 text-secondary',
    },
    debt_reminder: {
      icon: 'payments',
      accent: 'border-l-error',
      iconBg: 'bg-error/10 text-error',
    },
    buzzed_reminder: {
      icon: 'warning',
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
    },
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 min-h-screen">
        <TopAppBar searchPlaceholder="Cari notifikasi..." onMenuClick={() => setSidebarOpen(true)} />

        <div className="pt-24 pb-20 max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight font-headline mb-1">
                Notifikasi
              </h1>
              <p className="text-on-surface-variant/70 text-sm font-body">Pantau semua notifikasi dan tindakan yang perlu direspon.</p>
            </div>
            <div className="flex glass-card p-1 rounded-2xl flex-wrap gap-0.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl transition-all text-xs font-bold font-body flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-on-surface-variant/50 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl"></div>)}
              </div>
            ) : (() => {
              const filteredNotifications = notifications.filter(notif => {
                if (activeTab === 'all') return true;
                if (activeTab === 'unread') return ['group_invite', 'settlement_pending', 'buzzed_reminder'].includes(notif.type);
                if (activeTab === 'bills') return ['debt_reminder', 'buzzed_reminder', 'settlement_pending', 'settlement_confirmed'].includes(notif.type);
                if (activeTab === 'system') return ['group_invite'].includes(notif.type);
                return true;
              });

              if (filteredNotifications.length === 0) {
                return (
                  <div className="text-center py-16 glass-card rounded-3xl">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">notifications_off</span>
                    <p className="text-on-surface-variant/50 font-medium font-body">Belum ada notifikasi terbaru.</p>
                  </div>
                );
              }

              return filteredNotifications.map((notif, i) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.debt_reminder;
                let actionButtons = null;

                if (notif.type === "group_invite") {
                  actionButtons = (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleGroupInvite(notif.group_id, 'accept')} className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all font-body hover:brightness-110 active:scale-95">Terima</button>
                      <button onClick={() => handleGroupInvite(notif.group_id, 'reject')} className="px-5 py-2 bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold transition-all font-body hover:bg-surface-container-high active:scale-95">Tolak</button>
                    </div>
                  );
                } else if (notif.type === "settlement_pending") {
                  actionButtons = (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleSettlementRespond(notif.settlement_id, 'accept')} className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all font-body active:scale-95">Konfirmasi Lunas</button>
                      <button onClick={() => handleSettlementRespond(notif.settlement_id, 'reject')} className="px-5 py-2 bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all font-body active:scale-95">Tolak</button>
                    </div>
                  );
                } else if (notif.type === "debt_reminder") {
                  const isBuzzerNotif = buzzerFeedback.id === notif.id;
                  actionButtons = (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => handleBuzzer(notif.expense_id, notif.user_id, notif.id)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-error/30 text-error rounded-xl text-xs font-bold hover:bg-error hover:text-white transition-all font-body active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        Kirim Buzzer
                      </button>
                      {isBuzzerNotif && buzzerFeedback.success && (
                        <p className="text-xs font-semibold text-secondary font-body flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Pengingat berhasil dikirim
                        </p>
                      )}
                      {isBuzzerNotif && buzzerFeedback.error && (
                        <p className="text-xs font-semibold text-error font-body flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {buzzerFeedback.error}
                        </p>
                      )}
                    </div>
                  );
                } else if (notif.type === "buzzed_reminder") {
                  actionButtons = (
                    <div className="mt-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all font-body active:scale-95">
                        <span className="material-symbols-outlined text-sm">payments</span>
                        Bayar Sekarang
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    className={`glass-card rounded-2xl p-5 border-l-4 ${config.accent} hover-lift transition-all cursor-default ${mounted ? 'animate-in' : 'opacity-0'}`}
                    style={{ animationDelay: `${i * 0.05 + 0.1}s` }}
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
                        <span className="material-symbols-outlined text-2xl" style={notif.type === "settlement_confirmed" ? {fontVariationSettings: "'FILL' 1"} : {}}>{config.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="font-bold text-base text-on-surface font-headline">{notif.title}</h4>
                          <span className="text-[10px] font-medium text-on-surface-variant/40 font-body shrink-0">{notif.time_ago}</span>
                        </div>
                        <p className="text-on-surface-variant/60 text-sm leading-relaxed font-body">{notif.message}</p>
                        {actionButtons}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Action Required Summary */}
          {notifications.filter(n => n.type === 'settlement_pending' || n.type === 'group_invite').length > 0 && (
            <div className={`mt-10 p-6 glass-card rounded-3xl relative overflow-hidden ${mounted ? 'animate-in stagger-6' : 'opacity-0'}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <p className="text-primary font-bold text-[10px] tracking-widest uppercase mb-1 font-body">Tindakan Diperlukan</p>
                  <h4 className="text-xl font-extrabold text-on-surface font-headline">
                    {notifications.filter(n => n.type === 'settlement_pending' || n.type === 'group_invite').length} Notifikasi Menunggu Respon
                  </h4>
                  <p className="text-on-surface-variant/50 text-sm font-body mt-1">Kamu memiliki undangan atau persetujuan yang perlu divalidasi.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
};

export default Notifications;
