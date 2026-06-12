'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  X,
  Check,
  Clock,
  Ban,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminWarranty } from '@/lib/client/admin';

const STATUS_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'ACTIVE', label: 'نشط' },
  { value: 'EXPIRED', label: 'منتهي' },
  { value: 'VOIDED', label: 'ملغي' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  ACTIVE: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: <Check size={12} />,
  },
  EXPIRED: {
    bg: 'bg-amber-100 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    icon: <Clock size={12} />,
  },
  VOIDED: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    icon: <Ban size={12} />,
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getUnitLabel(unit: string) {
  switch (unit) {
    case 'DAYS': return 'يوم';
    case 'MONTHS': return 'شهر';
    case 'YEARS': return 'سنة';
    default: return unit;
  }
}

function isExpired(endDate: string) {
  return new Date(endDate) < new Date();
}

export default function WarrantiesPage() {
  const client = useAdminClient();
  const [warranties, setWarranties] = useState<AdminWarranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal state
  const [editId, setEditId] = useState<string | null>(null);
  const [editSerial, setEditSerial] = useState('');
  const [editCoverage, setEditCoverage] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWarranties = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.warranties.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (result.success) {
        const data = result as unknown as {
          data: AdminWarranty[];
          pagination?: { totalPages: number };
        };
        setWarranties(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل الضمانات');
    } finally {
      setLoading(false);
    }
  }, [client, page, search, statusFilter]);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const openEdit = (w: AdminWarranty) => {
    setEditId(w.id);
    setEditSerial(w.serialNumber || '');
    setEditCoverage(w.coverage || '');
    setEditStatus(w.status);
  };

  const closeEdit = () => {
    setEditId(null);
    setEditSerial('');
    setEditCoverage('');
    setEditStatus('');
  };

  const handleSave = async () => {
    if (!client || !editId) return;
    setSaving(true);
    try {
      const result = await client.warranties.update(editId, {
        serialNumber: editSerial || undefined,
        coverage: editCoverage || undefined,
        status: editStatus || undefined,
      });
      if (result.success) {
        setWarranties((prev) =>
          prev.map((w) =>
            w.id === editId
              ? {
                  ...w,
                  serialNumber: editSerial || undefined,
                  coverage: editCoverage || undefined,
                  status: editStatus,
                }
              : w
          )
        );
        closeEdit();
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">إدارة الضمانات</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
          className="relative flex-1 min-w-[200px] max-w-md"
        >
          <input
            type="text"
            placeholder="بحث بالمنتج، الرقم التسلسلي، رقم الطلب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
          />
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm outline-none focus:border-primary transition"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Loading / Empty / List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : warranties.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Shield size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد ضمانات</p>
          <p className="text-xs mt-1">ستظهر هنا عند شحن أو تسليم طلبات لمنتجات تحتوي على ضمان</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    المنتج
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    العميل
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    المدة
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    تاريخ البدء
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    تاريخ الانتهاء
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    الرقم التسلسلي
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    الحالة
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground py-3 px-4">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => {
                  const style = STATUS_STYLES[w.status] || STATUS_STYLES.ACTIVE;
                  const expired = w.status === 'ACTIVE' && isExpired(w.endDate);
                  return (
                    <tr
                      key={w.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30 transition"
                    >
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-foreground">{w.productName}</p>
                        {w.orderItem?.order?.orderNumber && (
                          <p className="text-[11px] text-muted-foreground">
                            طلب: {w.orderItem.order.orderNumber}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {w.orderItem?.order?.user ? (
                          <div>
                            <p className="text-sm text-foreground">
                              {w.orderItem.order.user.firstName} {w.orderItem.order.user.lastName}
                            </p>
                            {w.orderItem.order.user.phone && (
                              <p className="text-[11px] text-muted-foreground">
                                {w.orderItem.order.user.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {w.duration} {getUnitLabel(w.unit)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{formatDate(w.startDate)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${expired ? 'text-red-500 font-medium' : 'text-foreground'}`}>
                          {formatDate(w.endDate)}
                        </span>
                        {expired && (
                          <span className="block text-[10px] text-red-500">منتهي</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground font-mono">
                        {w.serialNumber || (
                          <span className="text-muted-foreground text-xs">لم يحدد</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${style.bg} ${style.text}`}
                        >
                          {style.icon}
                          {w.status === 'ACTIVE'
                            ? 'نشط'
                            : w.status === 'EXPIRED'
                              ? 'منتهي'
                              : 'ملغي'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openEdit(w)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition"
                        >
                          <Edit3 size={14} />
                          تعديل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {warranties.map((w) => {
              const style = STATUS_STYLES[w.status] || STATUS_STYLES.ACTIVE;
              const expired = w.status === 'ACTIVE' && isExpired(w.endDate);
              return (
                <div key={w.id} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{w.productName}</p>
                      {w.orderItem?.order?.orderNumber && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          طلب: {w.orderItem.order.orderNumber}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium shrink-0 ${style.bg} ${style.text}`}
                    >
                      {style.icon}
                      {w.status === 'ACTIVE'
                        ? 'نشط'
                        : w.status === 'EXPIRED'
                          ? 'منتهي'
                          : 'ملغي'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">المدة:</span>{' '}
                      <span className="text-foreground font-medium">
                        {w.duration} {getUnitLabel(w.unit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الرقم التسلسلي:</span>{' '}
                      <span className="text-foreground font-mono">{w.serialNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">البدء:</span>{' '}
                      <span className="text-foreground">{formatDate(w.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الانتهاء:</span>{' '}
                      <span className={expired ? 'text-red-500 font-medium' : 'text-foreground'}>
                        {formatDate(w.endDate)}
                      </span>
                    </div>
                  </div>
                  {w.orderItem?.order?.user && (
                    <p className="text-xs text-muted-foreground mb-3">
                      العميل: {w.orderItem.order.user.firstName} {w.orderItem.order.user.lastName}
                    </p>
                  )}
                  <button
                    onClick={() => openEdit(w)}
                    className="w-full py-2 rounded-xl border border-border text-xs font-medium text-primary hover:bg-primary/5 transition"
                  >
                    <Edit3 size={14} className="inline ml-1" />
                    تعديل
                  </button>
                </div>
              );
            })}
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

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">تعديل الضمان</h2>
              <button
                onClick={closeEdit}
                className="p-1.5 rounded-lg hover:bg-muted transition"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  الرقم التسلسلي
                </label>
                <input
                  type="text"
                  value={editSerial}
                  onChange={(e) => setEditSerial(e.target.value)}
                  placeholder="مثال: SN-123456789"
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  حالة الضمان
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm outline-none focus:border-primary transition"
                >
                  <option value="ACTIVE">نشط</option>
                  <option value="EXPIRED">منتهي</option>
                  <option value="VOIDED">ملغي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  تفاصيل التغطية
                </label>
                <textarea
                  value={editCoverage}
                  onChange={(e) => setEditCoverage(e.target.value)}
                  placeholder="وصف ما يغطيه الضمان..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : (
                  'حفظ التعديلات'
                )}
              </button>
              <button
                onClick={closeEdit}
                className="px-6 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
