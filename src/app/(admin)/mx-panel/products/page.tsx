'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminProduct, AdminBranch } from '@/lib/client/admin';

export default function ProductsPage() {
  const client = useAdminClient();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Advanced Filter States
  const [status, setStatus] = useState<string>('all'); // all, active, inactive
  const [stockStatus, setStockStatus] = useState<string>('all'); // all, in_stock, out_of_stock
  const [branchId, setBranchId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt_desc'); // createdAt_desc, price_asc, price_desc, name_asc
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [branches, setBranches] = useState<AdminBranch[]>([]);

  // Fetch branches dynamically
  useEffect(() => {
    if (!client) return;
    client.branches.list()
      .then((result) => {
        if (result.success) {
          setBranches(result.data || []);
        }
      })
      .catch(() => {
        // Fail silently
      });
  }, [client]);

  const fetchProducts = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');

    // Parse status to isActive
    let isActive: boolean | undefined = undefined;
    if (status === 'active') isActive = true;
    if (status === 'inactive') isActive = false;

    // Parse sortBy and sortOrder
    let sortField = 'createdAt';
    let sortOrder: 'asc' | 'desc' = 'desc';
    if (sortBy === 'price_asc') {
      sortField = 'price';
      sortOrder = 'asc';
    } else if (sortBy === 'price_desc') {
      sortField = 'price';
      sortOrder = 'desc';
    } else if (sortBy === 'name_asc') {
      sortField = 'name';
      sortOrder = 'asc';
    }

    try {
      const result = await client.products.list({
        page,
        limit: 20,
        search: search || undefined,
        isActive,
        stockStatus: stockStatus === 'all' ? undefined : (stockStatus as any),
        branchId: branchId === 'all' || !branchId ? undefined : branchId,
        sortBy: sortField,
        sortOrder,
      });
      if (result.success) {
        const data = result as unknown as { data: AdminProduct[]; pagination?: { totalPages: number } };
        setProducts(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [client, page, search, status, stockStatus, branchId, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!client || deleting) return;
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    setDeleting(id);
    try {
      const result = await client.products.delete(id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف المنتج');
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setStatus('all');
    setStockStatus('all');
    setBranchId('all');
    setSortBy('createdAt_desc');
    setSearch('');
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Package size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
        </div>
        <Link
          href="/mx-panel/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          إضافة منتج
        </Link>
      </div>

      {/* Search & Advanced Filter Toggles */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث في المنتجات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        </form>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl font-bold text-sm transition ${
              showFilters
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            <SlidersHorizontal size={18} />
            تصفية متقدمة
          </button>

          {(status !== 'all' || stockStatus !== 'all' || branchId !== 'all' || sortBy !== 'createdAt_desc' || search !== '') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-card hover:bg-muted text-muted-foreground rounded-xl font-bold text-sm transition"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw size={18} />
              <span className="hidden sm:inline">إعادة تعيين</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 transition-all duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground">حالة المنتج</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="inactive">معطّل</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground">الفرع</label>
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
              >
                <option value="all">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nameAr || b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground">حالة المخزون</label>
              <select
                value={stockStatus}
                onChange={(e) => {
                  setStockStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="in_stock">متوفر</option>
                <option value="out_of_stock">نفذ من المخزون</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground">ترتيب حسب</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
              >
                <option value="createdAt_desc">الأحدث</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="name_asc">الاسم: أ - ي</option>
              </select>
            </div>
          </div>
        </div>
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
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد منتجات</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">المنتج</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">السعر</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">المخزون</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{product.name}</div>
                        {product.nameAr && (
                          <div className="text-xs text-muted-foreground">{product.nameAr}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {product.price.toLocaleString('ar-EG')} د.ع
                        {product.compareAtPrice && (
                          <span className="text-xs text-muted-foreground line-through mr-2">
                            {product.compareAtPrice.toLocaleString('ar-EG')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={product.stock <= 0 ? 'text-red-500 font-medium' : 'text-foreground'}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                          {product.isActive ? 'نشط' : 'معطّل'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/mx-panel/products/${product.id}`}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                            title="تعديل"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50"
                            title="حذف"
                          >
                            {deleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
              <span className="text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
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
