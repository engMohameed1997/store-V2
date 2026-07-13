'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FolderTree,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Upload,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import { uploadFile } from '@/lib/client/api';
import type { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from '@/lib/client/admin';

export default function CategoriesPage() {
  const client = useAdminClient();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', slug: '', position: '0', image: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const uploadPathPattern = /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp))$/i;

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadFile(file, 'categories');
      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, image: result.data!.url }));
      } else if (!result.success) {
        alert(`فشل رفع الصورة: ${result.error.message}`);
      }
    } catch {
      alert('فشل في رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.categories.list();
      if (result.success && result.data) {
        setCategories(result.data as AdminCategory[]);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل الأصناف');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', slug: '', position: '0', image: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || submitting) return;

    const trimmedName = formData.name.trim();
    const trimmedSlug = formData.slug.trim() || generateSlug(trimmedName);

    if (!trimmedName) {
      alert('الاسم مطلوب');
      return;
    }
    if (!trimmedSlug) {
      alert('الـ Slug مطلوب');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const input: UpdateCategoryInput = {
          name: trimmedName,
          nameAr: formData.nameAr.trim() || undefined,
          slug: trimmedSlug,
          position: Number(formData.position) || 0,
          image: formData.image.trim() || undefined,
        };
        const result = await client.categories.update(editingId, input);
        if (result.success) {
          await fetchCategories();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      } else {
        const input: CreateCategoryInput = {
          name: trimmedName,
          nameAr: formData.nameAr.trim() || undefined,
          slug: trimmedSlug,
          position: Number(formData.position) || 0,
          image: formData.image.trim() || undefined,
        };
        const result = await client.categories.create(input);
        if (result.success) {
          await fetchCategories();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      }
    } catch {
      alert('فشل في حفظ الصنف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setFormData({
      name: category.name,
      nameAr: category.nameAr || '',
      slug: category.slug,
      position: String(category.position || 0),
      image: category.image && uploadPathPattern.test(category.image) ? category.image : '',
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!client || actionId) return;
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    setActionId(id);
    try {
      const result = await client.categories.delete(id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف الصنف');
    } finally {
      setActionId(null);
    }
  };

  const handleMove = async (category: AdminCategory, direction: 'up' | 'down') => {
    if (!client || actionId) return;
    setActionId(category.id);
    try {
      const currentPos = category.position || 0;
      const targetPos = direction === 'up' ? Math.max(0, currentPos - 1) : currentPos + 1;
      const result = await client.categories.update(category.id, { position: targetPos });
      if (result.success) {
        await fetchCategories();
      }
    } catch {
      // Silent
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FolderTree size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">الأصناف</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          إضافة صنف
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">الاسم (إنجليزي) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
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
                <label className="block text-xs font-medium text-muted-foreground mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm font-mono"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">الترتيب</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  min="0"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">صورة القسم (اختياري)</label>
              <label className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition bg-background h-[104px] ${
                formData.image ? 'border-border hover:border-primary/50' : 'border-2 border-dashed border-border hover:border-primary/50'
              }`}>
                {uploadingImage ? (
                  <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" />
                ) : formData.image ? (
                  <img src={formData.image} alt="" className="w-12 h-12 rounded-lg object-contain bg-muted shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Upload size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {formData.image ? (
                    <p className="text-xs text-foreground truncate font-mono" dir="ltr">{formData.image.split('/').pop()}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">اضغط لرفع صورة القسم</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WEBP — حد أقصى 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
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
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderTree size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد أصناف</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الاسم</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الاسم (عربي)</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Slug</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">الترتيب</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-8 h-8 rounded-lg object-contain bg-muted shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">
                            📁
                          </div>
                        )}
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cat.nameAr || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">{cat.slug}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleMove(cat, 'up')}
                          disabled={actionId !== null}
                          className="p-1 rounded hover:bg-muted text-muted-foreground transition disabled:opacity-50"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <span className="font-mono text-xs w-6">{cat.position ?? 0}</span>
                        <button
                          onClick={() => handleMove(cat, 'down')}
                          disabled={actionId !== null}
                          className="p-1 rounded hover:bg-muted text-muted-foreground transition disabled:opacity-50"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      }`}>
                        {cat.isActive ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                          title="تعديل"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={actionId === cat.id}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50"
                          title="حذف"
                        >
                          {actionId === cat.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
