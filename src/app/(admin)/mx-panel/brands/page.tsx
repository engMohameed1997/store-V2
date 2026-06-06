'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Tag,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminBrand, CreateBrandInput, UpdateBrandInput } from '@/lib/client/admin';

export default function BrandsPage() {
  const client = useAdminClient();
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', logo: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.brands.list();
      if (result.success && result.data) {
        setBrands(result.data as AdminBrand[]);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل البراندات');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', logo: '', description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || submitting) return;

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      alert('الاسم مطلوب');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        nameAr: formData.nameAr.trim() || undefined,
        logo: formData.logo.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

      if (editingId) {
        const result = await client.brands.update(editingId, payload as UpdateBrandInput);
        if (result.success) {
          await fetchBrands();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      } else {
        const result = await client.brands.create(payload as CreateBrandInput);
        if (result.success) {
          await fetchBrands();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      }
    } catch {
      alert('فشل في حفظ البراند');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (brand: AdminBrand) => {
    setFormData({
      name: brand.name,
      nameAr: brand.nameAr || '',
      logo: brand.logo || '',
      description: brand.description || '',
    });
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!client || actionId) return;
    if (!confirm('هل أنت متأكد من حذف هذا البراند؟')) return;
    setActionId(id);
    try {
      const result = await client.brands.delete(id);
      if (result.success) {
        setBrands((prev) => prev.filter((b) => b.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف البراند');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Tag size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">البراندات</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          إضافة براند
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">{editingId ? 'تعديل البراند' : 'إضافة براند جديد'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الاسم (إنجليزي) *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الاسم (عربي)</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">رابط الشعار (URL)</label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                dir="ltr"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الوصف</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Tag size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد براندات</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الاسم</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الاسم (عربي)</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {brand.logo && (
                          <img src={brand.logo} alt={brand.name} className="w-8 h-8 rounded-lg object-contain bg-muted" />
                        )}
                        <span className="font-medium text-foreground">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{brand.nameAr || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        brand.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {brand.isActive ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          disabled={actionId === brand.id}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50"
                          title="حذف"
                        >
                          {actionId === brand.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
