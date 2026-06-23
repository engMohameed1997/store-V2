'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ImageIcon,
  Save,
  Upload,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import { uploadFile } from '@/lib/client/api';
import type { AdminCategory, AdminBrand, AdminBranch, UpdateProductInput } from '@/lib/client/admin';

interface ImageInput {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface SpecInput {
  key: string;
  value: string;
}

export default function EditProductPage() {
  const client = useAdminClient();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);

  const [originalPrice, setOriginalPrice] = useState('');
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    compareAtPrice: '',
    costPrice: '',
    stock: '0',
    lowStockThreshold: '5',
    weight: '',
    isActive: true,
    isFeatured: false,
    isDigital: false,
    categoryId: '',
    brandId: '',
    branchId: '',
    metaTitle: '',
    metaDescription: '',
    warrantyDuration: '',
    warrantyUnit: '',
    warrantyCoverage: '',
  });

  const [images, setImages] = useState<ImageInput[]>([]);
  const [specs, setSpecs] = useState<SpecInput[]>([]);

  useEffect(() => {
    const orig = Number(originalPrice);
    if (!orig || orig <= 0) {
      setFormData((prev) => ({ ...prev, price: originalPrice, compareAtPrice: '' }));
      return;
    }

    if (discountType === 'none') {
      setFormData((prev) => ({ ...prev, price: originalPrice, compareAtPrice: '' }));
    } else if (discountType === 'percentage') {
      const val = Number(discountValue) || 0;
      const finalPrice = Math.max(0, orig * (1 - val / 100));
      setFormData((prev) => ({
        ...prev,
        price: finalPrice.toFixed(2),
        compareAtPrice: originalPrice,
      }));
    } else if (discountType === 'amount') {
      const val = Number(discountValue) || 0;
      const finalPrice = Math.max(0, orig - val);
      setFormData((prev) => ({
        ...prev,
        price: finalPrice.toFixed(2),
        compareAtPrice: originalPrice,
      }));
    }
  }, [originalPrice, discountType, discountValue]);

  const fetchProduct = useCallback(async () => {
    if (!client || !productId) return;
    setLoading(true);
    setError('');

    try {
      const result = await client.products.get(productId);
      if (result.success && result.data) {
        const p = result.data as unknown as Record<string, unknown>;

        // Load pricing
        if (p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)) {
          setOriginalPrice(String(p.compareAtPrice));
          setDiscountType('percentage');
          const diff = Number(p.compareAtPrice) - Number(p.price);
          const pct = Math.round((diff / Number(p.compareAtPrice)) * 100);
          setDiscountValue(String(pct));
        } else {
          setOriginalPrice(String(p.price || ''));
          setDiscountType('none');
          setDiscountValue('');
        }

        const branchInventories = p.branchInventories as Array<{ branchId: string; stock: number }> || [];
        const loadedBranchId = branchInventories[0]?.branchId || '';

        setFormData({
          name: (p.name as string) || '',
          nameAr: (p.nameAr as string) || '',
          description: (p.description as string) || '',
          descriptionAr: (p.descriptionAr as string) || '',
          price: String(p.price || ''),
          compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
          costPrice: p.costPrice ? String(p.costPrice) : '',
          stock: String(p.stock ?? 0),
          lowStockThreshold: String(p.lowStockThreshold ?? 5),
          weight: p.weight ? String(p.weight) : '',
          isActive: p.isActive !== false,
          isFeatured: p.isFeatured === true,
          isDigital: p.isDigital === true,
          categoryId: (p.categoryId as string) || '',
          brandId: (p.brandId as string) || '',
          branchId: loadedBranchId,
          metaTitle: (p.metaTitle as string) || '',
          metaDescription: (p.metaDescription as string) || '',
          warrantyDuration: p.warrantyDuration ? String(p.warrantyDuration) : '',
          warrantyUnit: (p.warrantyUnit as string) || '',
          warrantyCoverage: (p.warrantyCoverage as string) || '',
        });

        // Load images — clear any legacy external URLs that don't match the upload path pattern
        if (Array.isArray(p.images)) {
          const uploadPathPattern = /^\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i;
          const loadedImages: ImageInput[] = (p.images as Array<Record<string, unknown>>).map((img) => {
            const raw = typeof img === 'string' ? img : (img.url as string) || '';
            return {
              url: uploadPathPattern.test(raw) ? raw : '',
              alt: typeof img === 'string' ? '' : (img.alt as string) || '',
              isPrimary: typeof img === 'string' ? false : img.isPrimary === true,
            };
          });
          setImages(loadedImages);
        }

        // Load specs
        if (Array.isArray(p.specs)) {
          const loadedSpecs: SpecInput[] = (p.specs as Array<Record<string, unknown>>).map((s) => ({
            key: (s.key as string) || '',
            value: (s.value as string) || '',
          }));
          setSpecs(loadedSpecs);
        }
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل بيانات المنتج');
    } finally {
      setLoading(false);
    }
  }, [client, productId]);

  const fetchLookups = useCallback(async () => {
    if (!client) return;
    try {
      const [catResult, brandResult, branchResult] = await Promise.allSettled([
        client.categories.list(),
        client.brands.list(),
        client.branches.list(),
      ]);
      if (catResult.status === 'fulfilled' && catResult.value.success && catResult.value.data) {
        setCategories(catResult.value.data as AdminCategory[]);
      }
      if (brandResult.status === 'fulfilled' && brandResult.value.success && brandResult.value.data) {
        setBrands(brandResult.value.data as AdminBrand[]);
      }
      if (branchResult.status === 'fulfilled' && branchResult.value.success && branchResult.value.data) {
        setBranches(branchResult.value.data as AdminBranch[]);
      }
    } catch {
      // Silent
    }
  }, [client]);

  useEffect(() => {
    fetchProduct();
    fetchLookups();
  }, [fetchProduct, fetchLookups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || submitting) return;

    const name = formData.name.trim();
    if (!name) {
      setError('اسم المنتج مطلوب');
      return;
    }

    const price = Number(formData.price);
    if (!price || price <= 0) {
      setError('السعر يجب أن يكون أكبر من صفر');
      return;
    }

    const compareAtPrice = formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined;
    if (compareAtPrice !== undefined && compareAtPrice <= price) {
      setError('سعر المقارنة (السعر الأصلي قبل الخصم) يجب أن يكون أكبر من السعر النهائي');
      return;
    }

    if (!formData.branchId) {
      setError('الرجاء اختيار الفرع التابع له المنتج');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        name,
        nameAr: formData.nameAr.trim() || undefined,
        description: formData.description.trim() || undefined,
        descriptionAr: formData.descriptionAr.trim() || undefined,
        price,
        compareAtPrice,
        stock: Number(formData.stock) || 0,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isDigital: formData.isDigital,
        categoryId: formData.categoryId || undefined,
        brandId: formData.brandId || undefined,
        branchId: formData.branchId || undefined,
      };

      // Warranty
      if (formData.warrantyDuration && formData.warrantyUnit) {
        payload.warrantyDuration = Number(formData.warrantyDuration);
        payload.warrantyUnit = formData.warrantyUnit;
        payload.warrantyCoverage = formData.warrantyCoverage.trim() || null;
      } else {
        payload.warrantyDuration = null;
        payload.warrantyUnit = null;
        payload.warrantyCoverage = null;
      }

      // Images
      const filteredImages = images.filter((img) => img.url.trim());
      if (filteredImages.length > 0) {
        payload.images = filteredImages.map((img, idx) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || undefined,
          position: idx,
          isPrimary: img.isPrimary,
        }));
      } else {
        payload.images = [];
      }

      // Optional numeric fields
      if (formData.costPrice) payload.costPrice = Number(formData.costPrice);
      if (formData.lowStockThreshold) payload.lowStockThreshold = Number(formData.lowStockThreshold);
      if (formData.weight) payload.weight = Number(formData.weight);
      if (formData.metaTitle.trim()) payload.metaTitle = formData.metaTitle.trim();
      if (formData.metaDescription.trim()) payload.metaDescription = formData.metaDescription.trim();

      // Specs
      const filteredSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
      if (filteredSpecs.length > 0) {
        payload.specs = filteredSpecs.map((s, idx) => ({
          key: s.key.trim(),
          value: s.value.trim(),
          position: idx,
        }));
      } else {
        payload.specs = [];
      }

      const result = await client.products.update(productId, payload as unknown as UpdateProductInput);
      if (result.success) {
        router.push('/mx-panel/products');
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحديث المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  const addImage = () => {
    setImages([...images, { url: '', alt: '', isPrimary: images.length === 0 }]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    setImages(newImages);
  };

  const updateImage = (index: number, field: keyof ImageInput, value: string | boolean) => {
    const newImages = [...images];
    if (field === 'isPrimary' && value === true) {
      newImages.forEach((img) => (img.isPrimary = false));
    }
    if (field === 'url' || field === 'alt') {
      newImages[index][field] = value as string;
    } else {
      newImages[index][field] = value as boolean;
    }
    setImages(newImages);
  };

  const handleUploadFile = async (idx: number, file?: File) => {
    if (!file) return;
    setUploading(idx);
    setError('');
    try {
      const result = await uploadFile(file, 'products');
      if (result.success && result.data) {
        updateImage(idx, 'url', result.data.url);
      } else if (!result.success) {
        setError(`فشل رفع الصورة: ${result.error.message}`);
      }
    } catch {
      setError('فشل في رفع الصورة، حاول مرة أخرى');
    } finally {
      setUploading(null);
    }
  };

  const addSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, field: keyof SpecInput, value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/mx-panel/products"
          className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition"
        >
          <ArrowRight size={18} />
        </Link>
        <Package size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">تعديل المنتج</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">المعلومات الأساسية</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">اسم المنتج (إنجليزي) *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                required
                maxLength={255}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">اسم المنتج (عربي)</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                maxLength={255}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">الوصف (إنجليزي)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none"
                rows={3}
                maxLength={5000}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">الوصف (عربي)</label>
              <textarea
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none"
                rows={3}
                maxLength={5000}
              />
            </div>
          </div>
        </section>

        {/* Pricing & Stock */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">التسعير والمخزون</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">السعر الأصلي *</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">نوع الخصم</label>
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as any);
                  setDiscountValue('');
                }}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              >
                <option value="none">بدون خصم</option>
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="amount">مبلغ ثابت</option>
              </select>
            </div>
            {discountType !== 'none' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {discountType === 'percentage' ? 'نسبة الخصم (%)' : 'قيمة الخصم'}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  min="0"
                  max={discountType === 'percentage' ? '100' : undefined}
                  step={discountType === 'percentage' ? '1' : '0.01'}
                />
              </div>
            )}
            {discountType !== 'none' && originalPrice && (
              <div className="sm:col-span-2 lg:col-span-3 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">السعر النهائي بعد الخصم:</span>
                <span className="text-sm font-bold text-primary">{formData.price} د.ع</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">سعر التكلفة</label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">المخزون</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">حد التنبيه (المخزون المنخفض)</label>
              <input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الوزن (كجم)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </section>

        {/* Classification */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">التصنيف والفرع</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الصنف</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              >
                <option value="">بدون صنف</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameAr || cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">البراند</label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              >
                <option value="">بدون براند</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.nameAr || brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الفرع *</label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                required
              >
                <option value="">اختر فرع المنتج...</option>
                {branches.map((br) => (
                  <option key={br.id} value={br.id}>
                    {br.nameAr || br.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Options */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">الخيارات</h2>
          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">نشط (ظاهر في المتجر)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">منتج مميز</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDigital}
                onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">منتج رقمي</span>
            </label>
          </div>
        </section>

        {/* Images */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">الصور</h2>
            <button
              type="button"
              onClick={addImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition"
            >
              <Plus size={14} />
              إضافة صورة
            </button>
          </div>
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">لم يتم إضافة صور بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 border border-border rounded-xl bg-background">
                  {/* Upload Thumbnail */}
                  <label className={`relative w-16 h-16 rounded-lg overflow-hidden border bg-muted cursor-pointer group shrink-0 transition ${img.url ? 'border-border' : 'border-2 border-dashed border-border hover:border-primary/50'}`}>
                    {uploading === idx ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 size={18} className="animate-spin text-muted-foreground" />
                      </div>
                    ) : img.url ? (
                      <>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Upload size={14} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                        <Upload size={15} className="text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">رفع</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploading !== null}
                      onChange={(e) => handleUploadFile(idx, e.target.files?.[0])}
                    />
                  </label>
                  {/* Alt text + path preview */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={img.alt}
                      onChange={(e) => updateImage(idx, 'alt', e.target.value)}
                      placeholder="النص البديل للصورة"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:border-primary transition text-sm"
                    />
                    {img.url && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 truncate" dir="ltr">{img.url}</p>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer shrink-0 pt-2">
                    <input
                      type="radio"
                      name="primaryImage"
                      checked={img.isPrimary}
                      onChange={() => updateImage(idx, 'isPrimary', true)}
                      className="w-3 h-3"
                    />
                    رئيسية
                  </label>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Specs */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">المواصفات</h2>
            <button
              type="button"
              onClick={addSpec}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition"
            >
              <Plus size={14} />
              إضافة مواصفة
            </button>
          </div>
          {specs.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">لم يتم إضافة مواصفات</p>
          ) : (
            <div className="space-y-2">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateSpec(idx, 'key', e.target.value)}
                    placeholder="الخاصية (مثل: اللون)"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:border-primary transition text-sm"
                    maxLength={100}
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                    placeholder="القيمة (مثل: أحمر)"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground outline-none focus:border-primary transition text-sm"
                    maxLength={500}
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Warranty */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">الضمان</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">مدة الضمان</label>
              <input
                type="number"
                value={formData.warrantyDuration}
                onChange={(e) => setFormData({ ...formData, warrantyDuration: e.target.value })}
                placeholder="مثال: 12"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">وحدة المدة</label>
              <select
                value={formData.warrantyUnit}
                onChange={(e) => setFormData({ ...formData, warrantyUnit: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
              >
                <option value="">اختيار...</option>
                <option value="DAYS">يوم</option>
                <option value="MONTHS">شهر</option>
                <option value="YEARS">سنة</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">تغطية الضمان</label>
              <input
                type="text"
                value={formData.warrantyCoverage}
                onChange={(e) => setFormData({ ...formData, warrantyCoverage: e.target.value })}
                placeholder="مثال: ضمان عيوب الصناعة"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                maxLength={1000}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">اذا تم تحديد المدة والوحدة، سيتم إنشاء بطاقة ضمان تلقائياً عند شحن/تسليم الطلب</p>
        </section>

        {/* SEO */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">تحسين محركات البحث (SEO)</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">عنوان الميتا</label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                maxLength={70}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{formData.metaTitle.length}/70</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">وصف الميتا</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none"
                rows={2}
                maxLength={160}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{formData.metaDescription.length}/160</p>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ التعديلات
          </button>
          <Link
            href="/mx-panel/products"
            className="px-6 py-3 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
