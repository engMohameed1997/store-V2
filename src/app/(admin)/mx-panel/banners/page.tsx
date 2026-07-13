'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ImageIcon,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import { uploadFile } from '@/lib/client/api';
import type { AdminBanner, CreateBannerInput, UpdateBannerInput } from '@/lib/client/admin';

export default function BannersPage() {
  const client = useAdminClient();
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', titleAr: '', image: '', mobileImage: '', videoUrl: '', link: '', position: '1',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<'image' | 'mobileImage' | 'video' | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.banners.list();
      if (result.success && result.data) {
        setBanners(result.data as AdminBanner[]);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل البانرات');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const resetForm = () => {
    const maxPosition = banners.length > 0 ? Math.max(...banners.map(b => b.position)) : 0;
    setFormData({ title: '', titleAr: '', image: '', mobileImage: '', videoUrl: '', link: '', position: String(maxPosition + 1) });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || submitting) return;

    const title = formData.title.trim();
    const image = formData.image.trim();

    if (!title || !image) {
      alert('العنوان وصورة البانر مطلوبان');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateBannerInput & { videoUrl?: string } = {
        title,
        titleAr: formData.titleAr.trim() || undefined,
        image,
        mobileImage: formData.mobileImage.trim() || undefined,
        videoUrl: formData.videoUrl.trim() || undefined,
        link: formData.link.trim() || undefined,
        position: Number(formData.position) || 0,
      };

      if (editingId) {
        const result = await client.banners.update(editingId, payload as UpdateBannerInput);
        if (result.success) {
          await fetchBanners();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      } else {
        const result = await client.banners.create(payload);
        if (result.success) {
          await fetchBanners();
          resetForm();
        } else if (!result.success) {
          alert(result.error.message);
        }
      }
    } catch {
      alert('فشل في حفظ البانر');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadPathPattern = /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|mp4|webm)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|mp4|webm))$/i;

  const handleBannerUpload = async (field: 'image' | 'mobileImage' | 'videoUrl', file?: File) => {
    if (!file) return;
    setUploadingField(field === 'videoUrl' ? 'video' : field);
    try {
      const result = await uploadFile(file, 'banners');
      if (result.success && result.data) {
        setFormData((prev) => ({ ...prev, [field]: result.data!.url }));
      } else if (!result.success) {
        alert(`فشل رفع الملف: ${result.error.message}`);
      }
    } catch {
      alert('فشل في رفع الملف، حاول مرة أخرى');
    } finally {
      setUploadingField(null);
    }
  };

  const handleEdit = (banner: AdminBanner) => {
    setFormData({
      title: banner.title,
      titleAr: banner.titleAr || '',
      image: uploadPathPattern.test(banner.image) ? banner.image : '',
      mobileImage: banner.mobileImage && uploadPathPattern.test(banner.mobileImage) ? banner.mobileImage : '',
      videoUrl: banner.videoUrl || '',
      link: banner.link || '',
      position: String(banner.position),
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!client || actionId) return;
    if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return;
    setActionId(id);
    try {
      const result = await client.banners.delete(id);
      if (result.success) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف البانر');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">البانرات</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          إضافة بانر
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">{editingId ? 'تعديل البانر' : 'إضافة بانر جديد'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">العنوان *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">العنوان (عربي)</label>
              <input
                type="text"
                value={formData.titleAr}
                onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              />
            </div>
            {/* Banner Image Upload */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">صورة البانر *</label>
              <label className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition bg-background ${
                formData.image ? 'border-border hover:border-primary/50' : 'border-2 border-dashed border-border hover:border-primary/50'
              }`}>
                {uploadingField === 'image' ? (
                  <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" />
                ) : formData.image ? (
                  <img src={formData.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Upload size={16} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {formData.image
                    ? <p className="text-xs text-foreground truncate" dir="ltr">{formData.image}</p>
                    : <p className="text-xs text-muted-foreground">اضغط لرفع صورة البانر</p>
                  }
                  <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WEBP — حد أقصى 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingField !== null}
                  onChange={(e) => handleBannerUpload('image', e.target.files?.[0])}
                />
              </label>
            </div>
            {/* Mobile Image Upload */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">صورة الموبايل (اختياري)</label>
              <label className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition bg-background ${
                formData.mobileImage ? 'border-border hover:border-primary/50' : 'border-2 border-dashed border-border hover:border-primary/50'
              }`}>
                {uploadingField === 'mobileImage' ? (
                  <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" />
                ) : formData.mobileImage ? (
                  <img src={formData.mobileImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Upload size={16} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {formData.mobileImage
                    ? <p className="text-xs text-foreground truncate" dir="ltr">{formData.mobileImage}</p>
                    : <p className="text-xs text-muted-foreground">صورة مخصصة لشاشات الموبايل</p>
                  }
                  <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WEBP — حد أقصى 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingField !== null}
                  onChange={(e) => handleBannerUpload('mobileImage', e.target.files?.[0])}
                />
              </label>
            </div>
            {/* Promo Video Upload or Link */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">الفيديو الترويجي (اختياري)</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition bg-background ${
                  formData.videoUrl ? 'border-border hover:border-primary/50' : 'border-2 border-dashed border-border hover:border-primary/50'
                }`}>
                  {uploadingField === 'video' ? (
                    <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" />
                  ) : formData.videoUrl ? (
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">فيديو</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Upload size={16} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {formData.videoUrl
                      ? <p className="text-xs text-foreground truncate" dir="ltr">{formData.videoUrl}</p>
                      : <p className="text-xs text-muted-foreground">اضغط لرفع فيديو ترويجي</p>
                    }
                    <p className="text-[10px] text-muted-foreground mt-0.5">MP4, WebM — حد أقصى 50MB</p>
                  </div>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    disabled={uploadingField !== null}
                    onChange={(e) => handleBannerUpload('videoUrl', e.target.files?.[0])}
                  />
                </label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-[11px]"
                  dir="ltr"
                  placeholder="أو ضع رابط خارجي هنا..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">رابط التوجيه</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                dir="ltr"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الترتيب</label>
              <input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="1"
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

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد بانرات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition">
              <div className="aspect-[16/7] bg-muted relative">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    banner.isActive
                      ? 'bg-green-500/90 text-white'
                      : 'bg-red-500/90 text-white'
                  }`}>
                    {banner.isActive ? 'نشط' : 'معطّل'}
                  </span>
                  {banner.videoUrl && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/90 text-white">
                      فيديو
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground text-sm truncate">{banner.title}</h3>
                {banner.titleAr && <p className="text-xs text-muted-foreground truncate">{banner.titleAr}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-muted-foreground">ترتيب: {banner.position}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      disabled={actionId === banner.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50"
                    >
                      {actionId === banner.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
