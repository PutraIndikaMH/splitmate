import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const NewExpenseModal = ({ isOpen, onClose, groupId, onSuccess }) => {
  const { user } = useContext(AuthContext);

  // ── Form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'lainnya',
    split_type: 'equal',
    notes: '',
    paid_by: '',
  });

  // ── Data ────────────────────────────────────────────────────
  const [groups, setGroups]     = useState([]);
  const [members, setMembers]   = useState([]);   // { user_id, name, avatar_url }
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');

  // equal mode: which members are checked
  const [checkedMembers, setCheckedMembers] = useState({});

  // custom mode: per-member amount string
  const [customAmounts, setCustomAmounts] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Fetch members ────────────────────────────────────────────
  const fetchMembers = useCallback(async (gId) => {
    if (!gId) return;
    try {
      const res = await api.get(`/groups/${gId}`);
      const raw = res.data?.members ?? [];
      const mapped = raw.map((m) => ({
        user_id:    m.user_id,
        name:       m.user?.name ?? 'Unknown',
        avatar_url: m.user?.avatar_url ?? null,
      }));
      setMembers(mapped);

      // default: all members checked
      const allChecked = {};
      const allAmounts = {};
      mapped.forEach((m) => {
        allChecked[m.user_id] = true;
        allAmounts[m.user_id] = '';
      });
      setCheckedMembers(allChecked);
      setCustomAmounts(allAmounts);

      // default paid_by = current user (if member)
      const meInGroup = mapped.find((m) => m.user_id === user?.id);
      setForm((f) => ({ ...f, paid_by: meInGroup ? user.id : (mapped[0]?.user_id ?? '') }));
    } catch {
      setMembers([]);
    }
  }, [user?.id]);

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const gId = groupId || selectedGroupId;
    setSelectedGroupId(gId || '');
    if (!groupId) {
      api.get('/groups').then((r) => {
        // Filter out closed groups
        const activeGroups = (r.data || []).filter(g => g.status !== 'closed');
        setGroups(activeGroups);
      }).catch(() => {});
    }
    if (gId) fetchMembers(gId);
  }, [isOpen, groupId]);   // eslint-disable-line

  useEffect(() => {
    if (selectedGroupId && !groupId) fetchMembers(selectedGroupId);
  }, [selectedGroupId, groupId, fetchMembers]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────
  const formatRupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

  const selectedMembers = members.filter((m) => checkedMembers[m.user_id]);

  const perPersonEqual =
    selectedMembers.length > 0 && form.amount
      ? Math.floor((Number(form.amount) / selectedMembers.length) * 100) / 100
      : 0;

  const customTotal = members.reduce((acc, m) => {
    return acc + (Number(customAmounts[m.user_id]) || 0);
  }, 0);

  const customDiff = Number(form.amount || 0) - customTotal;

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) { setError('Deskripsi wajib diisi'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Total biaya wajib diisi'); return; }
    const gId = selectedGroupId || groupId;
    if (!gId) { setError('Pilih grup terlebih dahulu'); return; }
    if (!form.paid_by) { setError('Pilih siapa yang bayar'); return; }

    let payload = {
      title:    form.title.trim(),
      amount:   Number(form.amount),
      category: form.category,
      notes:    form.notes.trim() || null,
      paid_by:  form.paid_by,
    };

    if (form.split_type === 'equal') {
      if (selectedMembers.length === 0) { setError('Pilih minimal 1 anggota untuk split'); return; }

      if (selectedMembers.length === members.length) {
        // semua anggota → kirim sebagai equal, biarkan backend hitung
        payload.split_type = 'equal';
      } else {
        // subset anggota → kirim sebagai custom dengan jumlah rata
        const perPerson = Math.round((Number(form.amount) / selectedMembers.length) * 100) / 100;
        let remainder   = Number(form.amount) - perPerson * selectedMembers.length;
        remainder       = Math.round(remainder * 100) / 100;

        payload.split_type = 'custom';
        payload.splits = selectedMembers.map((m, idx) => ({
          user_id:     m.user_id,
          amount_owed: idx === 0 ? perPerson + remainder : perPerson,
        }));
      }
    } else {
      // Custom mode
      const totalCustom = members.reduce((acc, m) => acc + (Number(customAmounts[m.user_id]) || 0), 0);
      const diff = Math.abs(Number(form.amount) - totalCustom);
      if (diff > 0.01) {
        setError(`Total pembagian (${formatRupiah(totalCustom)}) harus sama dengan total biaya (${formatRupiah(form.amount)})`);
        return;
      }
      payload.split_type = 'custom';
      payload.splits = members
        .filter((m) => Number(customAmounts[m.user_id]) > 0)
        .map((m) => ({
          user_id:     m.user_id,
          amount_owed: Number(customAmounts[m.user_id]),
        }));
      if (payload.splits.length === 0) { setError('Minimal satu orang harus menanggung biaya'); return; }
    }

    setLoading(true);
    try {
      await api.post(`/groups/${gId}/expenses`, payload);
      // reset
      setForm({ title: '', amount: '', category: 'lainnya', split_type: 'equal', notes: '', paid_by: user?.id ?? '' });
      setCustomAmounts({});
      setCheckedMembers({});
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menambah pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = [
    { id: 'makanan',      label: 'Makanan',       icon: 'restaurant' },
    { id: 'transportasi', label: 'Transportasi',  icon: 'directions_car' },
    { id: 'travel',       label: 'Travel',         icon: 'flight' },
    { id: 'belanja',      label: 'Belanja',        icon: 'shopping_bag' },
    { id: 'hiburan',      label: 'Hiburan',        icon: 'movie' },
    { id: 'tagihan',      label: 'Tagihan',        icon: 'receipt' },
    { id: 'lainnya',      label: 'Lainnya',        icon: 'category' },
  ];

  const avatarEl = (m, size = 'w-8 h-8') => m.avatar_url
    ? <img src={m.avatar_url} alt={m.name} className={`${size} rounded-full object-cover flex-shrink-0`} />
    : (
      <div className={`${size} rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0`}>
        {m.name[0]}
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet / Modal */}
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative z-10 flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-headline">Tambah Pengeluaran</h2>
            <p className="text-xs text-slate-500 font-body mt-0.5">Catat & bagi biaya bersama</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Group selector */}
          {!groupId && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-headline">Grup</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              >
                <option value="">— Pilih Grup —</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-headline">Deskripsi</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">description</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Makan siang bareng..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              />
            </div>
          </div>

          {/* Total Biaya */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-headline">Total Biaya</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold font-body text-sm">Rp</span>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 font-bold placeholder-slate-300 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body text-2xl"
              />
            </div>
          </div>

          {/* Kategori + Dibayar oleh */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-headline">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-headline">Dibayar Oleh</label>
              <select
                value={form.paid_by}
                onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm"
              >
                <option value="">— Pilih —</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name}{m.user_id === user?.id ? ' (Kamu)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Split Type Toggle ── */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 font-headline">Cara Bagi</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              {[
                { value: 'equal',  label: 'Sama Rata',  icon: 'group' },
                { value: 'custom', label: 'Kustom',     icon: 'tune' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, split_type: opt.value })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all font-body ${
                    form.split_type === opt.value
                      ? 'bg-white text-primary shadow-sm shadow-primary/10'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Sama Rata: member checklist ── */}
          {form.split_type === 'equal' && members.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-headline">Siapa yang ikut?</p>
                {form.amount && selectedMembers.length > 0 && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full font-body">
                    {formatRupiah(perPersonEqual)} / orang
                  </span>
                )}
              </div>
              {members.map((m) => (
                <label
                  key={m.user_id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    checkedMembers[m.user_id] ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4 flex-shrink-0"
                    checked={!!checkedMembers[m.user_id]}
                    onChange={(e) => setCheckedMembers({ ...checkedMembers, [m.user_id]: e.target.checked })}
                  />
                  {avatarEl(m)}
                  <span className="font-medium text-sm text-slate-700 font-body flex-1">
                    {m.name}
                    {m.user_id === user?.id && <span className="ml-1 text-xs text-slate-400">(Kamu)</span>}
                  </span>
                  {checkedMembers[m.user_id] && form.amount && (
                    <span className="text-xs font-bold text-primary font-body">{formatRupiah(perPersonEqual)}</span>
                  )}
                </label>
              ))}
              {selectedMembers.length === 0 && (
                <p className="text-xs text-center text-red-400 font-medium font-body pt-1">Pilih minimal 1 anggota</p>
              )}
            </div>
          )}

          {/* ── Kustom: per-member amount input ── */}
          {form.split_type === 'custom' && members.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-headline">Nominal per Orang</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full font-body transition-colors ${
                  Math.abs(customDiff) < 0.01
                    ? 'text-green-600 bg-green-50'
                    : 'text-amber-600 bg-amber-50'
                }`}>
                  {Math.abs(customDiff) < 0.01
                    ? '✓ Sesuai'
                    : customDiff > 0
                      ? `Sisa ${formatRupiah(customDiff)}`
                      : `Lebih ${formatRupiah(Math.abs(customDiff))}`
                  }
                </span>
              </div>
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-slate-200">
                  {avatarEl(m)}
                  <span className="font-medium text-sm text-slate-700 font-body flex-1">
                    {m.name}
                    {m.user_id === user?.id && <span className="ml-1 text-xs text-slate-400">(Kamu)</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400 font-body">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={customAmounts[m.user_id] ?? ''}
                      onChange={(e) => setCustomAmounts({ ...customAmounts, [m.user_id]: e.target.value })}
                      placeholder="0"
                      className="w-28 text-right bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-body"
                    />
                  </div>
                </div>
              ))}

              {/* Quick-fill: split sisa rata */}
              {form.amount && customDiff > 0.01 && (
                <button
                  type="button"
                  onClick={() => {
                    const diff = Number(form.amount) - customTotal;
                    const unchecked = members.filter((m) => !Number(customAmounts[m.user_id]));
                    if (unchecked.length === 0) return;
                    const perPerson = Math.floor((diff / unchecked.length) * 100) / 100;
                    let leftover = Math.round((diff - perPerson * unchecked.length) * 100) / 100;
                    const newAmounts = { ...customAmounts };
                    unchecked.forEach((m, i) => {
                      newAmounts[m.user_id] = String(perPerson + (i === 0 ? leftover : 0));
                    });
                    setCustomAmounts(newAmounts);
                  }}
                  className="w-full text-center text-xs font-semibold text-primary hover:underline font-body pt-1 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  Bagi sisa {formatRupiah(customDiff)} rata ke yang belum diisi
                </button>
              )}

              {/* Progress bar */}
              {form.amount > 0 && (
                <div className="pt-1">
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        customTotal > Number(form.amount) ? 'bg-red-400' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, (customTotal / Number(form.amount)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-body mt-1">
                    <span>{formatRupiah(customTotal)} diisi</span>
                    <span>{formatRupiah(Number(form.amount))} total</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Catatan (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-headline">Catatan <span className="normal-case font-normal">(opsional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Tambahkan catatan..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium font-body rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/60 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors font-body text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3.5 px-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all font-body text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              : <><span className="material-symbols-outlined text-lg">check_circle</span> Simpan Pengeluaran</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewExpenseModal;
