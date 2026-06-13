'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminCoupon, CreateCouponInput, UpdateCouponInput } from '@/lib/client/admin';

export default function CouponsPage() {
  const client = useAdminClient();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.coupons.list({ page, limit: 20, search: search || undefined });
      if (result.success) {
        const data = result as unknown as { data: AdminCoupon[]; pagination?: { totalPages: number } };
        setCoupons(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  }, [client, page, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormData({ code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || submitting) return;

    const code = formData.code.trim().toUpperCase();
    const value = Number(formData.value);

    if (!code || !value || value <= 0) {
      alert('كود الخصم والقيمة مطلوبين');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateCouponInput = {
        code,
        type: formData.type,
        value,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        expiresAt: formData.expiresAt || undefined,
      };

      if (editingId) {
        const result = await client.coupons.update(editingId, payload as UpdateCouponInput);
        if (result.success) {
          await fetchCoupons();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      } else {
        const result = await client.coupons.create(payload);
        if (result.success) {
          await fetchCoupons();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      }
    } catch {
      alert('فشل في حفظ الكوبون');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (coupon: AdminCoupon) => {
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    });
    setEditingId(coupon.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!client || actionId) return;
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    setActionId(id);
    try {
      const result = await client.coupons.delete(id);
      if (result.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف الكوبون');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Ticket size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">الكوبونات</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          إضافة كوبون
        </button>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="بحث بكود الخصم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </form>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">{editingId ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">كود الخصم *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm font-mono"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">النوع *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              >
                <option value="PERCENTAGE">نسبة مئوية %</option>
                <option value="FIXED">مبلغ ثابت</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">القيمة *</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الحد الأدنى للطلب</label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">أقصى خصم</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">عدد الاستخدامات</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">تاريخ الانتهاء</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {editingId ? 'حفظ التعديل' : 'إضافة'}
            </button>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition">
              <X size={16} />
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Ticket size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد كوبونات</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الكود</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">النوع</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">القيمة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الاستخدام</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الانتهاء</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{coupon.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {coupon.type === 'PERCENTAGE' ? 'نسبة %' : 'مبلغ ثابت'}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {coupon.value}{coupon.type === 'PERCENTAGE' ? '%' : ' د.ع'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                            title="تعديل"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            disabled={actionId === coupon.id}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50"
                            title="حذف"
                          >
                            {actionId === coupon.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
              <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
