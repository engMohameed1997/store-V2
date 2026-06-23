'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Settings,
  Loader2,
  AlertCircle,
  Save,
  Check,
  Store,
  Phone,
  Globe,
  FileText,
  Bot,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, putJson } from '@/lib/client/api';

const ADMIN_BASE = '/api/v1/mx-panel';

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [storeName, setStoreName] = useState('');
  const [storeNameAr, setStoreNameAr] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storePhone2, setStorePhone2] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsappGreeting, setWhatsappGreeting] = useState('');
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  const opts = {};

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const result = await getJson<Record<string, unknown>>(`${ADMIN_BASE}/settings`, opts);
      if (result.success && result.data) {
        const d = result.data as unknown as Record<string, string>;
        setStoreName(d.storeName || '');
        setStoreNameAr(d.storeNameAr || '');
        setStoreDescription(d.storeDescription || '');
        setStorePhone(d.storePhone || '');
        setStorePhone2(d.storePhone2 || '');
        setStoreEmail(d.storeEmail || '');
        setStoreAddress(d.storeAddress || '');
        setSocialFacebook(d.socialFacebook || '');
        setSocialInstagram(d.socialInstagram || '');
        setSocialTiktok(d.socialTiktok || '');
        setSocialWhatsapp(d.socialWhatsapp || '');
        setSocialTelegram(d.socialTelegram || '');
        setTermsAndConditions(d.termsAndConditions || '');
        setPrivacyPolicy(d.privacyPolicy || '');
        setReturnPolicy(d.returnPolicy || '');
        setTelegramBotToken(d.telegramBotToken || '');
        setTelegramChatId(d.telegramChatId || '');
        setWhatsappGreeting(d.whatsappGreeting || '');
        try {
          const kw = d.searchKeywords;
          setSearchKeywords(Array.isArray(kw) ? kw : kw ? JSON.parse(kw as string) : []);
        } catch { setSearchKeywords([]); }
      }
    } catch {
      setError('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!isAuthenticated || saving) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        storeName, storeNameAr, storeDescription,
        storePhone, storePhone2, storeEmail, storeAddress,
        socialFacebook, socialInstagram, socialTiktok, socialWhatsapp, socialTelegram,
        termsAndConditions, privacyPolicy, returnPolicy,
        telegramBotToken, telegramChatId, whatsappGreeting,
        searchKeywords: JSON.stringify(searchKeywords),
      };
      const result = await putJson(`${ADMIN_BASE}/settings`, payload, opts);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">إعدادات المتجر</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'تم الحفظ' : 'حفظ الإعدادات'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Store Info */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">معلومات المتجر</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">اسم المتجر (إنجليزي)</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">اسم المتجر (عربي)</label>
              <input type="text" value={storeNameAr} onChange={(e) => setStoreNameAr(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">وصف المتجر</label>
              <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">العنوان</label>
              <input type="text" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">معلومات التواصل</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">رقم الهاتف الأساسي</label>
              <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)}
                placeholder="+964"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">رقم الهاتف الثاني</label>
              <input type="text" value={storePhone2} onChange={(e) => setStorePhone2(e.target.value)}
                placeholder="+964"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">البريد الإلكتروني</label>
              <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
          </div>
        </section>

        {/* Social */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">روابط التواصل الاجتماعي</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">فيسبوك</label>
              <input type="url" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">انستجرام</label>
              <input type="url" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">تيكتوك</label>
              <input type="url" value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)}
                placeholder="https://tiktok.com/..."
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">واتساب</label>
              <input type="text" value={socialWhatsapp} onChange={(e) => setSocialWhatsapp(e.target.value)}
                placeholder="+964..."
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">تلجرام</label>
              <input type="text" value={socialTelegram} onChange={(e) => setSocialTelegram(e.target.value)}
                placeholder="https://t.me/..."
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" dir="ltr" />
            </div>
          </div>
        </section>

        {/* Telegram Bot */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">بوت تيليغرام (إشعارات الموظفين)</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            عند إعداد البوت، سيتم إرسال إشعارات تلقائية للموظفين عند ورود طلب جديد أو تذكرة دعم.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Bot Token (من @BotFather)</label>
              <input type="password" value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm font-mono" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Chat ID (المجموعة أو القناة)</label>
              <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-1001234567890"
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm font-mono" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">رسالة واتساب الترحيبية</label>
              <input type="text" value={whatsappGreeting} onChange={(e) => setWhatsappGreeting(e.target.value)}
                placeholder="مرحبًا، أحتاج مساعدة بخصوص..."
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm" />
            </div>
          </div>
        </section>

        {/* Search Keywords */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">كلمات البحث المقترحة</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            هذه الكلمات تظهر كاقتراحات في شريط البحث للزبائن قبل النتائج التلقائية.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const kw = newKeyword.trim();
                  if (kw && !searchKeywords.includes(kw)) {
                    setSearchKeywords([...searchKeywords, kw]);
                    setNewKeyword('');
                  }
                }
              }}
              placeholder="أضف كلمة بحث..."
              className="flex-1 px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const kw = newKeyword.trim();
                if (kw && !searchKeywords.includes(kw)) {
                  setSearchKeywords([...searchKeywords, kw]);
                  setNewKeyword('');
                }
              }}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchKeywords.map((kw) => (
              <span key={kw} className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm text-foreground">
                {kw}
                <button
                  type="button"
                  onClick={() => setSearchKeywords(searchKeywords.filter((k) => k !== kw))}
                  className="text-muted-foreground hover:text-red-500 transition"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            {searchKeywords.length === 0 && (
              <p className="text-xs text-muted-foreground">لم تتم إضافة كلمات بعد</p>
            )}
          </div>
        </section>

        {/* Policies */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">السياسات والشروط</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">الشروط والأحكام</label>
              <textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">سياسة الخصوصية</label>
              <textarea value={privacyPolicy} onChange={(e) => setPrivacyPolicy(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">سياسة الإرجاع</label>
              <textarea value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm resize-none" />
            </div>
          </div>
        </section>

        {/* Bottom Save */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ جميع الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
}
