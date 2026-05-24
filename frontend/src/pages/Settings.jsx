import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopAppBar from '../components/layout/TopAppBar';
import BottomNav from '../components/layout/BottomNav';
import NewExpenseModal from '../components/ui/NewExpenseModal';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useAnimateOnMount from '../hooks/useAnimateOnMount';

const SettingRow = ({ icon, iconBg, iconColor, label, description, onClick, danger = false, children, expanded }) => (
  <div>
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 transition-all group text-left ${danger ? 'hover:bg-error/5' : 'hover:bg-surface-container/50'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <span className={`font-semibold font-body block ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</span>
          {description && <span className="text-xs text-on-surface-variant/40 font-body">{description}</span>}
        </div>
      </div>
      <span className={`material-symbols-outlined transition-transform duration-300 ${danger ? 'text-error/40' : 'text-on-surface-variant/30'} ${expanded ? 'rotate-90' : ''}`}>
        chevron_right
      </span>
    </button>
    {expanded && (
      <div className="px-5 pb-5 pt-3 bg-surface-container/30 expand-enter">
        {children}
      </div>
    )}
  </div>
);

const Settings = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const mounted = useAnimateOnMount();

  const [nameForm, setNameForm] = useState({ value: user?.name || '', loading: false, error: '', success: false });

  const [pwForm, setPwForm] = useState({
    current: '', newPw: '', confirm: '',
    loading: false, error: '', success: false,
    showCurrent: false, showNew: false, showConfirm: false,
  });

  const [notifPrefs, setNotifPrefs] = useState({
    notif_new_expense: true,
    notif_debt_reminder: true,
    notif_settlement: true,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFetched, setNotifFetched] = useState(false);

  const toggle = (key) => {
    setExpanded(prev => prev === key ? null : key);
  };

  // Fetch notification preferences when section is expanded
  useEffect(() => {
    if (expanded === 'notif' && !notifFetched) {
      setNotifLoading(true);
      api.get('/users/me/notifications/preferences')
        .then(res => {
          setNotifPrefs(res.data);
          setNotifFetched(true);
        })
        .catch(() => {})
        .finally(() => setNotifLoading(false));
    }
  }, [expanded, notifFetched]);

  const handleToggleNotif = useCallback(async (key) => {
    const newValue = !notifPrefs[key];
    setNotifPrefs(prev => ({ ...prev, [key]: newValue }));
    try {
      await api.patch('/users/me/notifications/preferences', { [key]: newValue });
    } catch {
      // Revert on error
      setNotifPrefs(prev => ({ ...prev, [key]: !newValue }));
    }
  }, [notifPrefs]);

  const handleUpdateName = async () => {
    if (!nameForm.value.trim()) {
      setNameForm(f => ({ ...f, error: 'Nama tidak boleh kosong' }));
      return;
    }
    setNameForm(f => ({ ...f, loading: true, error: '', success: false }));
    try {
      const res = await api.patch('/users/me', { name: nameForm.value.trim() });
      if (setUser) setUser(res.data);
      setNameForm(f => ({ ...f, loading: false, success: true }));
      setTimeout(() => setNameForm(f => ({ ...f, success: false })), 2000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal memperbarui nama';
      setNameForm(f => ({ ...f, loading: false, error: msg }));
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current) {
      setPwForm(f => ({ ...f, error: 'Password lama wajib diisi' }));
      return;
    }
    if (pwForm.newPw.length < 8) {
      setPwForm(f => ({ ...f, error: 'Password baru minimal 8 karakter' }));
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwForm(f => ({ ...f, error: 'Konfirmasi password tidak cocok' }));
      return;
    }
    setPwForm(f => ({ ...f, loading: true, error: '', success: false }));
    try {
      await api.patch('/users/me/password', {
        current_password: pwForm.current,
        new_password: pwForm.newPw,
      });
      setPwForm({ current: '', newPw: '', confirm: '', loading: false, error: '', success: true, showCurrent: false, showNew: false, showConfirm: false });
      setTimeout(() => setPwForm(f => ({ ...f, success: false })), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Gagal mengubah password';
      setPwForm(f => ({ ...f, loading: false, error: msg }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:ml-64 min-h-screen">
        <TopAppBar searchPlaceholder="Cari pengaturan..." onMenuClick={() => setSidebarOpen(true)} />

        <section className="max-w-2xl mx-auto px-6 pt-24 pb-12">
          <div className={`mb-8 ${mounted ? 'animate-in' : 'opacity-0'}`}>
            <h1 className="text-2xl font-extrabold text-on-surface font-headline">Pengaturan</h1>
            <p className="text-sm text-on-surface-variant/60 font-body mt-1">Kelola akun dan preferensi kamu</p>
          </div>

          {/* Profile Card */}
          <div className={`flex items-center gap-4 glass-card rounded-3xl p-5 mb-8 hover-lift ${mounted ? 'animate-in stagger-2' : 'opacity-0'}`}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-2xl font-extrabold text-white font-headline flex-shrink-0 shadow-lg shadow-primary/15">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-on-surface font-headline">{user?.name || '—'}</p>
              <p className="text-sm text-on-surface-variant/60 font-body">{user?.email || '—'}</p>
            </div>
          </div>

          {/* Menu */}
          <div className={`glass-card rounded-3xl overflow-hidden divide-y divide-surface-container/30 ${mounted ? 'animate-in stagger-3' : 'opacity-0'}`}>

            {/* Edit Profil */}
            <SettingRow
              icon="person"
              iconBg="bg-primary/8 group-hover:bg-primary"
              iconColor="text-primary group-hover:text-white"
              label="Edit Profil"
              description="Ubah nama dan informasi akun"
              onClick={() => toggle('profil')}
              expanded={expanded === 'profil'}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/50 font-body mb-1.5 block uppercase tracking-wider">Nama</label>
                  <input
                    type="text"
                    value={nameForm.value}
                    onChange={e => setNameForm(f => ({ ...f, value: e.target.value, error: '' }))}
                    className="w-full bg-surface-container/50 border border-transparent focus:border-primary/30 focus:bg-white rounded-xl px-4 py-3 text-sm text-on-surface outline-none transition-all font-body"
                    placeholder="Nama lengkap"
                  />
                  {nameForm.error && <p className="text-error text-xs mt-1 font-body">{nameForm.error}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/50 font-body mb-1.5 block uppercase tracking-wider">Email</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-surface-container/30 border border-transparent rounded-xl px-4 py-3 text-sm text-on-surface-variant/40 outline-none font-body cursor-not-allowed"
                  />
                  <p className="text-[10px] text-on-surface-variant/30 mt-1 font-body">Email tidak dapat diubah</p>
                </div>
                <button
                  onClick={handleUpdateName}
                  disabled={nameForm.loading}
                  className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-3 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-60 font-body"
                >
                  {nameForm.loading ? 'Menyimpan...' : nameForm.success ? '✓ Tersimpan!' : 'Simpan Perubahan'}
                </button>
              </div>
            </SettingRow>

            {/* Notifikasi */}
            <SettingRow
              icon="notifications"
              iconBg="bg-secondary/8 group-hover:bg-secondary"
              iconColor="text-secondary group-hover:text-white"
              label="Notifikasi"
              description="Atur preferensi notifikasi"
              onClick={() => toggle('notif')}
              expanded={expanded === 'notif'}
            >
              <div className="space-y-4">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></div>
                    <span className="ml-2 text-xs text-on-surface-variant/50 font-body">Memuat preferensi...</span>
                  </div>
                ) : (
                  [
                    { key: 'notif_new_expense', label: 'Pengeluaran baru di grup', desc: 'Notifikasi saat ada expense ditambahkan' },
                    { key: 'notif_debt_reminder', label: 'Pengingat utang', desc: 'Ingatkan jika masih ada utang belum lunas' },
                    { key: 'notif_settlement', label: 'Settlement diterima', desc: 'Notifikasi saat ada pembayaran masuk' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-on-surface font-body">{item.label}</p>
                        <p className="text-xs text-on-surface-variant/40 font-body">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotif(item.key)}
                        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-300 cursor-pointer ${
                          notifPrefs[item.key]
                            ? 'bg-secondary'
                            : 'bg-surface-container'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transition-all duration-300 ${
                            notifPrefs[item.key]
                              ? 'translate-x-5 bg-white'
                              : 'translate-x-0 bg-on-surface-variant/30'
                          }`}
                        ></div>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </SettingRow>

            {/* Keamanan */}
            <SettingRow
              icon="lock"
              iconBg="bg-surface-container group-hover:bg-on-surface"
              iconColor="text-on-surface-variant group-hover:text-surface"
              label="Keamanan"
              description="Sesi dan keamanan akun"
              onClick={() => toggle('keamanan')}
              expanded={expanded === 'keamanan'}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/50 font-body mb-1.5 block uppercase tracking-wider">Password Lama</label>
                  <div className="relative">
                    <input
                      type={pwForm.showCurrent ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value, error: '' }))}
                      className="w-full bg-surface-container/50 border border-transparent focus:border-primary/30 focus:bg-white rounded-xl px-4 py-3 pr-11 text-sm text-on-surface outline-none transition-all font-body"
                      placeholder="Masukkan password lama"
                    />
                    <button
                      type="button"
                      onClick={() => setPwForm(f => ({ ...f, showCurrent: !f.showCurrent }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">{pwForm.showCurrent ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/50 font-body mb-1.5 block uppercase tracking-wider">Password Baru</label>
                  <div className="relative">
                    <input
                      type={pwForm.showNew ? 'text' : 'password'}
                      value={pwForm.newPw}
                      onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value, error: '' }))}
                      className="w-full bg-surface-container/50 border border-transparent focus:border-primary/30 focus:bg-white rounded-xl px-4 py-3 pr-11 text-sm text-on-surface outline-none transition-all font-body"
                      placeholder="Minimal 8 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setPwForm(f => ({ ...f, showNew: !f.showNew }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">{pwForm.showNew ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant/50 font-body mb-1.5 block uppercase tracking-wider">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <input
                      type={pwForm.showConfirm ? 'text' : 'password'}
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value, error: '' }))}
                      className="w-full bg-surface-container/50 border border-transparent focus:border-primary/30 focus:bg-white rounded-xl px-4 py-3 pr-11 text-sm text-on-surface outline-none transition-all font-body"
                      placeholder="Ulangi password baru"
                    />
                    <button
                      type="button"
                      onClick={() => setPwForm(f => ({ ...f, showConfirm: !f.showConfirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">{pwForm.showConfirm ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {pwForm.error && <p className="text-error text-xs font-body">{pwForm.error}</p>}
                {pwForm.success && (
                  <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                    <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                    <p className="text-sm font-semibold text-secondary font-body">Password berhasil diubah!</p>
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={pwForm.loading}
                  className="w-full bg-gradient-to-r from-on-surface to-on-surface/80 text-surface font-bold py-3 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-on-surface/15 active:scale-[0.98] disabled:opacity-60 font-body"
                >
                  {pwForm.loading ? 'Menyimpan...' : 'Ubah Password'}
                </button>
              </div>
            </SettingRow>

            {/* Bantuan */}
            <SettingRow
              icon="help"
              iconBg="bg-amber-500/8 group-hover:bg-amber-500"
              iconColor="text-amber-600 group-hover:text-white"
              label="Bantuan"
              description="FAQ dan panduan penggunaan"
              onClick={() => toggle('bantuan')}
              expanded={expanded === 'bantuan'}
            >
              <div className="space-y-3 text-sm font-body text-on-surface-variant">
                {[
                  { q: 'Bagaimana cara menambah anggota grup?', a: 'Buka detail grup lalu ketuk tombol "Tambah Anggota" dan masukkan email.' },
                  { q: 'Bagaimana cara catat pengeluaran?', a: 'Tekan tombol + di navigasi bawah, isi detail pengeluaran dan pilih grup.' },
                  { q: 'Bagaimana cara melunasi utang?', a: 'Buka halaman Debt Tracking, pilih utang, lalu tekan "Bayar".' },
                ].map(item => (
                  <div key={item.q} className="p-3 bg-surface-container/30 rounded-xl">
                    <p className="font-semibold text-on-surface mb-1 text-sm">{item.q}</p>
                    <p className="text-xs text-on-surface-variant/50">{item.a}</p>
                  </div>
                ))}
              </div>
            </SettingRow>

            {/* Tentang */}
            <SettingRow
              icon="info"
              iconBg="bg-primary/8 group-hover:bg-primary-container"
              iconColor="text-primary group-hover:text-on-primary-container"
              label="Tentang Aplikasi"
              description="Versi dan informasi"
              onClick={() => toggle('tentang')}
              expanded={expanded === 'tentang'}
            >
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between py-2 border-b border-surface-container/50">
                  <span className="text-on-surface-variant/50">Versi</span>
                  <span className="font-semibold text-on-surface">1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-container/50">
                  <span className="text-on-surface-variant/50">Dibuat oleh</span>
                  <span className="font-semibold text-on-surface">CC26-PSU310</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-on-surface-variant/50">Tahun</span>
                  <span className="font-semibold text-on-surface">2026</span>
                </div>
                <p className="text-xs text-on-surface-variant/30 pt-2">SplitMate — Precision Fluidity in Finance.</p>
              </div>
            </SettingRow>

            {/* Keluar */}
            <SettingRow
              icon="logout"
              iconBg="bg-error/8"
              iconColor="text-error"
              label="Keluar"
              description="Logout dari akun"
              onClick={handleLogout}
              danger
            />

          </div>
        </section>
      </main>

      <BottomNav onAddClick={() => setIsExpenseModalOpen(true)} />
      <NewExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
};

export default Settings;
