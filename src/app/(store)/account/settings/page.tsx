'use client';

import { useState } from 'react';
import { Lock, Shield } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { putJson } from '@/lib/client/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (!isAuthenticated) return;
    setSaving(true);
    const res = await putJson('/api/v1/user/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    setSaving(false);
    if (res.success) {
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(!res.success ? res.error.message : 'حدث خطأ');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">الإعدادات</h1>

      {/* Change Password */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">تغيير كلمة المرور</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">كلمة المرور الحالية</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Shield size={16} />
            {saving ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}
