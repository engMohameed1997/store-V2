'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, putJson } from '@/lib/client/api';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatar: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

export default function AccountProfilePage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  useEffect(() => {
    if (!accessToken) return;
    getJson<Profile>('/api/v1/user/profile', { token: accessToken })
      .then(res => {
        if (res.success) {
          const p = res.data as Profile;
          setProfile(p);
          setForm({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            email: p.email || '',
            phone: p.phone || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    const res = await putJson('/api/v1/user/profile', {
      firstName: form.firstName,
      lastName: form.lastName,
    }, { token: accessToken });
    setSaving(false);
    if (res.success) {
      toast.success('تم حفظ التغييرات');
    } else {
      toast.error('حدث خطأ في الحفظ');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">الملف الشخصي</h1>

      <form onSubmit={handleSave} className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">الاسم الأول</label>
            <input
              type="text"
              value={form.firstName}
              onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">الاسم الأخير</label>
            <input
              type="text"
              value={form.lastName}
              onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full h-10 px-3 rounded-lg border border-border bg-muted text-muted-foreground outline-none text-sm cursor-not-allowed"
          />
          {profile?.emailVerified && (
            <span className="text-xs text-emerald-500 mt-1 inline-block">✓ موثّق</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">رقم الهاتف</label>
          <input
            type="text"
            value={form.phone}
            disabled
            dir="ltr"
            className="w-full h-10 px-3 rounded-lg border border-border bg-muted text-muted-foreground outline-none text-sm cursor-not-allowed"
          />
          {profile?.phoneVerified && (
            <span className="text-xs text-emerald-500 mt-1 inline-block">✓ موثّق</span>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>

      {/* Account Info */}
      {profile && (
        <div className="mt-6 bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">معلومات الحساب</h3>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p>تاريخ الانضمام: {new Date(profile.createdAt).toLocaleDateString('ar-IQ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
