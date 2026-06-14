'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Shield,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import { useAuth } from '@/components/providers/auth-provider';
import type { AdminUser, AdminUpdateUserInput } from '@/lib/client/admin';

const CUSTOMER_ROLE_FILTERS = [
  { value: '', label: 'كل الأدوار' },
  { value: 'CUSTOMER', label: 'زبون' },
];

const STAFF_ROLE_FILTERS = [
  { value: '', label: 'كل الأدوار' },
  { value: 'ADMIN', label: 'أدمن' },
  { value: 'SUPER_ADMIN', label: 'مدير النظام' },
  { value: 'SALES', label: 'موظف مبيعات' },
  { value: 'WAREHOUSE', label: 'موظف مخزن' },
  { value: 'CUSTOMER_SERVICE', label: 'خدمة عملاء' },
];

const STATUS_FILTERS = [
  { value: '', label: 'كل الحالات' },
  { value: 'ACTIVE', label: 'نشط' },
  { value: 'SUSPENDED', label: 'موقوف' },
  { value: 'BANNED', label: 'محظور' },
  { value: 'PENDING_VERIFICATION', label: 'بانتظار التحقق' },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  SUSPENDED: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  BANNED: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  PENDING_VERIFICATION: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  SUSPENDED: 'موقوف',
  BANNED: 'محظور',
  PENDING_VERIFICATION: 'بانتظار التحقق',
};

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'زبون',
  ADMIN: 'أدمن',
  SUPER_ADMIN: 'مدير النظام',
  SALES: 'موظف مبيعات',
  WAREHOUSE: 'موظف مخزن',
  CUSTOMER_SERVICE: 'خدمة عملاء',
};

const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'SALES', 'WAREHOUSE', 'CUSTOMER_SERVICE'];

const ASSIGNABLE_ROLES = [
  { value: 'SALES', label: 'موظف مبيعات' },
  { value: 'WAREHOUSE', label: 'موظف مخزن' },
  { value: 'CUSTOMER_SERVICE', label: 'خدمة عملاء' },
  { value: 'ADMIN', label: 'أدمن' },
];

type TabType = 'customers' | 'staff';

export default function UsersPage() {
  const client = useAdminClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const [tab, setTab] = useState<TabType>('customers');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');

    try {
      // For staff tab, filter by staff roles; for customers, filter by CUSTOMER
      const effectiveRole = roleFilter || (tab === 'staff' ? 'ADMIN,SUPER_ADMIN,SALES,WAREHOUSE,CUSTOMER_SERVICE' : 'CUSTOMER');
      const result = await client.users.list({
        page,
        limit: 20,
        search: search || undefined,
        role: effectiveRole,
        status: statusFilter || undefined,
      });
      if (result.success) {
        const data = result as unknown as { data: AdminUser[]; pagination?: { totalPages: number } };
        setUsers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [client, page, search, roleFilter, statusFilter, tab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when switching tabs
  const switchTab = (newTab: TabType) => {
    setTab(newTab);
    setPage(1);
    setRoleFilter('');
    setSearch('');
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!client || actionId) return;
    setActionId(userId);
    try {
      const input: AdminUpdateUserInput = { role: newRole };
      const result = await client.users.update(userId, input);
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في تغيير دور المستخدم');
    } finally {
      setActionId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!client || actionId) return;
    setActionId(userId);
    try {
      const input: AdminUpdateUserInput = { status: newStatus };
      const result = await client.users.update(userId, input);
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في تحديث حالة المستخدم');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!client || actionId) return;
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    setActionId(userId);
    try {
      const result = await client.users.delete(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف المستخدم');
    } finally {
      setActionId(null);
    }
  };

  const roleFilters = tab === 'staff' ? STAFF_ROLE_FILTERS : CUSTOMER_ROLE_FILTERS;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">المستخدمين</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        <button
          onClick={() => switchTab('customers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'customers'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          الزبائن
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => switchTab('staff')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              tab === 'staff'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield size={14} />
            الموظفين
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="appearance-none px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
        >
          {roleFilters.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="appearance-none px-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm cursor-pointer"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا يوجد مستخدمين</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">المستخدم</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">التواصل</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الدور</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">التسجيل</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {user.firstName?.[0]}
                          </div>
                          <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {user.email && <div>{user.email}</div>}
                        {user.phone && <div dir="ltr">{user.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {tab === 'staff' && isSuperAdmin && user.id !== currentUser?.id ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={actionId === user.id}
                            className="appearance-none px-2 py-1 rounded-lg text-xs font-medium border border-border bg-background text-foreground outline-none cursor-pointer disabled:opacity-50"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                            {STAFF_ROLES.includes(user.role) && <Shield size={12} className="text-primary" />}
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          disabled={actionId === user.id}
                          className={`appearance-none px-2 py-1 rounded-full text-xs font-medium border-0 outline-none cursor-pointer ${STATUS_COLORS[user.status] || 'bg-muted text-foreground'} disabled:opacity-50`}
                        >
                          {STATUS_FILTERS.filter((s) => s.value).map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={actionId === user.id}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50"
                            title="حذف"
                          >
                            {actionId === user.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
