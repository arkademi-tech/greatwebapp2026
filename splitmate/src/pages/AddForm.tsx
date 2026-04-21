import { useRef, useState } from 'react';
import type { Expense, Page } from '../types';
import { CATS, MEMBERS } from '../data';
import { fmt } from '../utils';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/PageHeader';

interface AddFormProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  editTarget: Expense | null;
  setEditTarget: (e: Expense | null) => void;
  setPage: (p: Page) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface FormState {
  date: string;
  desc: string;
  cat: string;
  amount: string;
  paidBy: string;
  split: string[];
  note: string;
}

const blank: FormState = { date: '', desc: '', cat: '', amount: '', paidBy: '', split: [], note: '' };

function FieldLabel({ label, required, optional }: { label: string; required?: boolean; optional?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-700 mb-1 flex gap-1 items-center">
      {label}
      {required && <span className="text-red-500">*</span>}
      {optional && <span className="text-slate-400 font-normal">(opsional)</span>}
    </label>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full h-10 rounded-lg border px-3 text-sm text-slate-900 bg-white focus:outline-none transition-colors ${hasError ? 'border-red-500' : 'border-slate-300 focus:border-blue-500'}`;

export function AddForm({ setExpenses, editTarget, setEditTarget, setPage, showToast }: AddFormProps) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState<FormState>(
    isEdit ? { ...editTarget, amount: String(editTarget.amount) } : blank
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.date) e.date = 'Tanggal wajib diisi';
    if (!form.desc.trim()) e.desc = 'Deskripsi wajib diisi';
    if (!form.cat) e.cat = 'Pilih kategori';
    if (!form.amount || isNaN(Number(form.amount.replace(/\D/g, '')))) e.amount = 'Nominal tidak valid';
    if (!form.paidBy) e.paidBy = 'Pilih siapa yang membayar';
    if (!form.split.length) e.split = 'Pilih minimal 1 anggota';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const entry: Expense = {
      ...form,
      amount: Number(form.amount.replace(/\D/g, '')),
      paid: isEdit ? editTarget.paid : false,
      id: isEdit ? editTarget.id : Date.now(),
    };
    if (isEdit) setExpenses(p => p.map(x => x.id === entry.id ? entry : x));
    else setExpenses(p => [entry, ...p]);
    setEditTarget(null);
    setPage('expenses');
    showToast(isEdit ? 'Pengeluaran diperbarui' : 'Pengeluaran berhasil ditambahkan', 'success');
  };

  const formatAmount = (val: string) =>
    val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const sharePerPerson = form.split.length > 0 && form.amount
    ? Math.round(Number(form.amount.replace(/\D/g, '')) / form.split.length)
    : 0;

  return (
    <div className="overflow-auto h-full p-7">
      <PageHeader
        title={isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
        subtitle="Isi detail pengeluaran tim"
        action={
          <Button variant="secondary" icon="arrow-left" onClick={() => { setEditTarget(null); setPage('expenses'); }}>
            Kembali
          </Button>
        }
      />

      <form onSubmit={submit} className="max-w-2xl">
        <div className="grid grid-cols-2 gap-5">
          {/* Tanggal */}
          <div className="flex flex-col">
            <FieldLabel label="Tanggal" required />
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
              className={inputClass(!!errors.date)} />
            {errors.date && <span className="text-xs text-red-500 mt-1">{errors.date}</span>}
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col">
            <FieldLabel label="Deskripsi" required />
            <input type="text" value={form.desc} onChange={e => set('desc', e.target.value)}
              placeholder="mis. Makan siang diskusi…"
              className={inputClass(!!errors.desc)} />
            {errors.desc && <span className="text-xs text-red-500 mt-1">{errors.desc}</span>}
          </div>

          {/* Kategori */}
          <div className="flex flex-col">
            <FieldLabel label="Kategori" required />
            <select value={form.cat} onChange={e => set('cat', e.target.value)}
              className={`${inputClass(!!errors.cat)} ${!form.cat ? 'text-slate-400' : ''}`}>
              <option value="">Pilih kategori…</option>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.cat && <span className="text-xs text-red-500 mt-1">{errors.cat}</span>}
          </div>

          {/* Nominal */}
          <div className="flex flex-col">
            <FieldLabel label="Nominal (Rp)" required />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">Rp</span>
              <input
                value={form.amount}
                onChange={e => set('amount', formatAmount(e.target.value))}
                placeholder="0"
                className={`${inputClass(!!errors.amount)} pl-8`}
              />
            </div>
            {errors.amount && <span className="text-xs text-red-500 mt-1">{errors.amount}</span>}
          </div>

          {/* Dibayar oleh */}
          <div className="flex flex-col">
            <FieldLabel label="Dibayar Oleh" required />
            <select value={form.paidBy} onChange={e => set('paidBy', e.target.value)}
              className={`${inputClass(!!errors.paidBy)} ${!form.paidBy ? 'text-slate-400' : ''}`}>
              <option value="">Siapa yang bayar?</option>
              {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.paidBy && <span className="text-xs text-red-500 mt-1">{errors.paidBy}</span>}
          </div>

          {/* Split kepada */}
          <div className="flex flex-col">
            <FieldLabel label="Split Kepada" required />
            <div
              className="flex gap-3 flex-wrap p-2.5 rounded-lg bg-white"
              style={{ border: `1.5px solid ${errors.split ? '#EF4444' : '#CBD5E1'}` }}
            >
              {MEMBERS.map(m => {
                const on = form.split.includes(m);
                return (
                  <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => set('split', on ? form.split.filter(x => x !== m) : [...form.split, m])}
                      className="accent-blue-600"
                    />
                    <div className="flex items-center gap-1">
                      <Avatar name={m} size={20} />
                      <span className={`text-xs font-${on ? 'semibold text-blue-600' : 'normal text-slate-500'}`}>{m}</span>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.split && <span className="text-xs text-red-500 mt-1">{errors.split}</span>}
            {sharePerPerson > 0 && (
              <span className="text-xs text-slate-400 mt-1">= {fmt(sharePerPerson)} / orang</span>
            )}
          </div>

          {/* Catatan */}
          <div className="flex flex-col col-span-2">
            <FieldLabel label="Catatan" optional />
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Tambahkan catatan…"
              rows={2}
              className="rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 resize-y focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Upload lampiran */}
          <div className="flex flex-col col-span-2">
            <FieldLabel label="Lampiran" optional />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-5 cursor-pointer text-center bg-slate-50 hover:border-blue-500 transition-colors"
            >
              <i className="fi fi-rr-upload flex items-center justify-center text-slate-400 text-xl mb-1.5" />
              {fileName ? (
                <div className="text-sm text-blue-600 font-medium">{fileName}</div>
              ) : (
                <>
                  <div className="text-sm text-slate-500 font-medium">Klik untuk upload nota / struk</div>
                  <div className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — maks. 5 MB</div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.png"
                className="hidden"
                onChange={e => setFileName(e.target.files?.[0]?.name || '')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-2 flex gap-2.5 justify-end pt-2 border-t border-slate-200">
            <Button variant="secondary" type="button" onClick={() => { setEditTarget(null); setPage('expenses'); }}>Batal</Button>
            <Button type="submit" icon={isEdit ? 'check' : 'plus'}>
              {isEdit ? 'Simpan Perubahan' : 'Tambah Pengeluaran'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
