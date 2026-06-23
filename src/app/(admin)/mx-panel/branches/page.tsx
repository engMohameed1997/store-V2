'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Package,
  Search,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson, putJson, deleteJson } from '@/lib/client/api';

const ADMIN_BASE = '/api/v1/mx-panel';

interface Branch {
  id: string;
  name: string;
  nameAr: string | null;
  address: string;
  addressAr: string | null;
  phone: string;
  isActive: boolean;
}

interface ProductInfo {
  id: string;
  name: string;
  nameAr: string | null;
  sku: string | null;
}

interface VariantInfo {
  id: string;
  name: string;
  sku: string | null;
}

interface BranchInventoryItem {
  id: string;
  stock: number;
  productId: string;
  variantId: string | null;
  product: ProductInfo;
  variant: VariantInfo | null;
}

interface ProductListItem {
  id: string;
  name: string;
  nameAr: string | null;
  sku: string | null;
  variants: {
    id: string;
    name: string;
    sku: string | null;
  }[];
}

export default function BranchesPage() {
  const { isAuthenticated } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', nameAr: '', address: '', addressAr: '', phone: '', isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Inventory State
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [inventory, setInventory] = useState<BranchInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [productsList, setProductsList] = useState<ProductListItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Stock Form State
  const [showStockForm, setShowStockForm] = useState(false);
  const [stockProductId, setStockProductId] = useState('');
  const [stockVariantId, setStockVariantId] = useState<string>('');
  const [stockQty, setStockQty] = useState('0');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const opts = {};

  const fetchBranches = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const result = await getJson<Branch[]>(`${ADMIN_BASE}/branches`, opts);
      if (result.success && result.data) {
        setBranches(result.data);
      }
    } catch {
      setError('فشل في تحميل الفروع');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated || productsList.length > 0) return;
    setLoadingProducts(true);
    try {
      // Get products for stock selection
      const result = await getJson<any>(`${ADMIN_BASE}/products?limit=100`, opts);
      if (result.success && result.data) {
        setProductsList(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  }, [isAuthenticated, productsList]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'اسم الفرع مطلوب';
    else if (formData.name.trim().length < 2) errs.name = 'يجب أن يكون 2 أحرف على الأقل';

    if (!formData.address.trim()) errs.address = 'العنوان مطلوب';
    else if (formData.address.trim().length < 5) errs.address = 'يجب أن يكون 5 أحرف على الأقل';

    if (!formData.phone.trim()) errs.phone = 'رقم الهاتف مطلوب';
    else if (!/^07\d{9}$/.test(formData.phone.trim())) errs.phone = 'يجب أن يبدأ بـ 07 ويتكون من 11 رقم';

    if (formData.nameAr.trim() && formData.nameAr.trim().length < 2) errs.nameAr = 'يجب أن يكون 2 أحرف على الأقل';
    if (formData.addressAr.trim() && formData.addressAr.trim().length < 5) errs.addressAr = 'يجب أن يكون 5 أحرف على الأقل';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', nameAr: '', address: '', addressAr: '', phone: '', isActive: true });
    setFormErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || submitting) return;

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        const result = await putJson<Branch>(`${ADMIN_BASE}/branches/${editingId}`, formData, opts);
        if (result.success) {
          await fetchBranches();
          resetForm();
        } else {
          alert(result.error.message);
        }
      } else {
        const result = await postJson<Branch>(`${ADMIN_BASE}/branches`, formData, opts);
        if (result.success) {
          await fetchBranches();
          resetForm();
        } else {
          alert(result.error.message);
        }
      }
    } catch {
      alert('فشل في حفظ بيانات الفرع');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      name: branch.name,
      nameAr: branch.nameAr || '',
      address: branch.address,
      addressAr: branch.addressAr || '',
      phone: branch.phone,
      isActive: branch.isActive,
    });
    setEditingId(branch.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟ سيتم حذف جميع كميات المخزون المرتبطة به.')) return;
    try {
      const result = await deleteJson(`${ADMIN_BASE}/branches/${id}`, opts);
      if (result.success) {
        setBranches(prev => prev.filter(b => b.id !== id));
        if (selectedBranch?.id === id) {
          setSelectedBranch(null);
          setInventory([]);
        }
      } else {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف الفرع');
    }
  };

  const loadInventory = async (branch: Branch) => {
    if (!isAuthenticated) return;
    setSelectedBranch(branch);
    setLoadingInventory(true);
    try {
      const result = await getJson<BranchInventoryItem[]>(`${ADMIN_BASE}/branches/${branch.id}/inventory`, opts);
      if (result.success && result.data) {
        setInventory(result.data);
      }
      await fetchProducts();
    } catch {
      alert('فشل في تحميل مخزون الفرع');
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleSetStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !selectedBranch || updatingStock) return;

    if (!stockProductId) {
      alert('الرجاء اختيار المنتج');
      return;
    }

    setUpdatingStock(true);
    try {
      const result = await postJson(
        `${ADMIN_BASE}/branches/${selectedBranch.id}/inventory`,
        {
          productId: stockProductId,
          variantId: stockVariantId || null,
          stock: Number(stockQty) || 0,
        },
        opts
      );
      if (result.success) {
        setShowStockForm(false);
        setStockProductId('');
        setStockVariantId('');
        setStockQty('0');
        await loadInventory(selectedBranch);
      } else {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في تحديث كمية المخزون');
    } finally {
      setUpdatingStock(false);
    }
  };

  const selectedProductObj = productsList.find(p => p.id === stockProductId);

  const filteredInventory = inventory.filter(item => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      item.product.name.toLowerCase().includes(term) ||
      (item.product.nameAr && item.product.nameAr.toLowerCase().includes(term)) ||
      (item.product.sku && item.product.sku.toLowerCase().includes(term)) ||
      (item.variant && item.variant.name.toLowerCase().includes(term)) ||
      (item.variant && item.variant.sku && item.variant.sku.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">إدارة الفروع والمخازن</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          إضافة فرع / مخزن
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-foreground">{editingId ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">اسم الفرع بالانكليزي *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => { setFormData({ ...formData, name: e.target.value }); if (formErrors.name) setFormErrors({ ...formErrors, name: '' }); }}
                className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm ${formErrors.name ? 'border-red-500' : 'border-border'}`}
              />
              {formErrors.name && <span className="text-red-500 text-xs mt-1">{formErrors.name}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الاسم بالعربية</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={e => { setFormData({ ...formData, nameAr: e.target.value }); if (formErrors.nameAr) setFormErrors({ ...formErrors, nameAr: '' }); }}
                className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm ${formErrors.nameAr ? 'border-red-500' : 'border-border'}`}
              />
              {formErrors.nameAr && <span className="text-red-500 text-xs mt-1">{formErrors.nameAr}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">رقم الهاتف *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => { setFormData({ ...formData, phone: e.target.value }); if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' }); }}
                className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm ${formErrors.phone ? 'border-red-500' : 'border-border'}`}
              />
              {formErrors.phone && <span className="text-red-500 text-xs mt-1">{formErrors.phone}</span>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">العنوان بالانكليزي *</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => { setFormData({ ...formData, address: e.target.value }); if (formErrors.address) setFormErrors({ ...formErrors, address: '' }); }}
                className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm ${formErrors.address ? 'border-red-500' : 'border-border'}`}
              />
              {formErrors.address && <span className="text-red-500 text-xs mt-1">{formErrors.address}</span>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">العنوان بالعربية</label>
              <input
                type="text"
                value={formData.addressAr}
                onChange={e => { setFormData({ ...formData, addressAr: e.target.value }); if (formErrors.addressAr) setFormErrors({ ...formErrors, addressAr: '' }); }}
                className={`w-full px-3 py-2 border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm ${formErrors.addressAr ? 'border-red-500' : 'border-border'}`}
              />
              {formErrors.addressAr && <span className="text-red-500 text-xs mt-1">{formErrors.addressAr}</span>}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs text-foreground font-medium">نشط ويعمل</span>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              حفظ الفرع
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition text-foreground"
            >
              <X size={16} />
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Branches and Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-sm text-foreground">قائمة الفروع والمخازن</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : branches.length === 0 ? (
            <div className="p-4 bg-card border border-border rounded-2xl text-center text-muted-foreground text-xs">
              لا توجد فروع مضافة حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map(branch => (
                <div
                  key={branch.id}
                  className={`bg-card border rounded-2xl p-4 transition ${
                    selectedBranch?.id === branch.id
                      ? 'border-primary shadow-sm bg-primary/5'
                      : 'border-border hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{branch.nameAr || branch.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1">{branch.addressAr || branch.address}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5" dir="ltr">{branch.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      branch.isActive
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }`}>
                      {branch.isActive ? 'نشط' : 'معطّل'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => loadInventory(branch)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <Package size={12} />
                      عرض المخزون
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/10 text-muted-foreground hover:text-red-500 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Management panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedBranch ? (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    مخزون فرع: {selectedBranch.nameAr || selectedBranch.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">إدارة وتعديل كميات المنتجات والبدائل في هذا الفرع</p>
                </div>
                <button
                  onClick={() => setShowStockForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:bg-primary-dark transition shrink-0"
                >
                  <Plus size={14} />
                  تعديل / تعيين كمية
                </button>
              </div>

              {/* Set Stock Form overlay/inline */}
              {showStockForm && (
                <form onSubmit={handleSetStock} className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-foreground">تعديل كمية المخزون لمنتج</h4>
                    <button type="button" onClick={() => setShowStockForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">اختر المنتج *</label>
                      <select
                        value={stockProductId}
                        onChange={e => { setStockProductId(e.target.value); setStockVariantId(''); }}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs outline-none focus:border-primary"
                        required
                      >
                        <option value="">-- اختر منتج --</option>
                        {productsList.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nameAr || p.name} {p.sku ? `(SKU: ${p.sku})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">اختر البديل (اختياري)</label>
                      <select
                        value={stockVariantId}
                        onChange={e => setStockVariantId(e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs outline-none focus:border-primary"
                        disabled={!selectedProductObj || !selectedProductObj.variants?.length}
                      >
                        <option value="">بدون بديل (المنتج الرئيسي)</option>
                        {selectedProductObj?.variants?.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} {v.sku ? `(SKU: ${v.sku})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">الكمية المتوفرة *</label>
                      <input
                        type="number"
                        min="0"
                        value={stockQty}
                        onChange={e => setStockQty(e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-lg bg-background text-foreground text-xs outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="submit"
                      disabled={updatingStock}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs hover:bg-primary-dark transition disabled:opacity-50"
                    >
                      {updatingStock ? 'جاري الحفظ...' : 'حفظ المخزون'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStockForm(false)}
                      className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted transition text-foreground"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              {/* Inventory Search & Table */}
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="بحث في منتجات المخزون بالاسم أو SKU..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 border border-border rounded-xl bg-background text-foreground text-xs outline-none focus:border-primary transition"
                  />
                </div>

                {loadingInventory ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-xs">
                    لا توجد منتجات مضافة لهذا الفرع حالياً.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="p-3 font-bold text-foreground">المنتج</th>
                          <th className="p-3 font-bold text-foreground">البديل (Variant)</th>
                          <th className="p-3 font-bold text-foreground">SKU</th>
                          <th className="p-3 font-bold text-foreground text-left">الكمية المتوفرة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredInventory.map(item => (
                          <tr key={item.id} className="hover:bg-muted/10 transition">
                            <td className="p-3 font-medium text-foreground">
                              {item.product.nameAr || item.product.name}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {item.variant ? item.variant.name : <span className="text-[10px] text-muted-foreground/50">المنتج الرئيسي</span>}
                            </td>
                            <td className="p-3 font-mono text-muted-foreground">
                              {item.variant ? item.variant.sku : item.product.sku || '-'}
                            </td>
                            <td className="p-3 text-left font-bold text-primary">
                              {item.stock}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground text-xs flex flex-col items-center justify-center min-h-[300px]">
              <Package size={48} className="opacity-20 mb-3" />
              قم باختيار فرع أو مخزن من القائمة لعرض وإدارة المخزون والكميات المتوفرة.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
