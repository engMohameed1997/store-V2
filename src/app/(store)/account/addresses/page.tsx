'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPin, Plus, Trash2, Star, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson, deleteJson } from '@/lib/client/api';
import { toast } from 'sonner';

interface LocationData {
  name: string;
  districts: { name: string; subDistricts: string[] }[];
}

interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  district: string | null;
  nearestPoint: string | null;
  street: string | null;
  building: string | null;
  landmark: string | null;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { accessToken } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [form, setForm] = useState({
    fullName: '', phone: '', governorate: '', city: '', district: '', nearestPoint: '', street: '', landmark: '', isDefault: false,
  });

  // Fetch locations data
  useEffect(() => {
    getJson<{ governorates: LocationData[] }>('/api/v1/locations').then((res) => {
      if (res.success && res.data) {
        setLocations((res.data as { governorates: LocationData[] }).governorates);
      }
    });
  }, []);

  // Get districts for selected governorate
  const availableDistricts = useMemo(() => {
    if (!form.governorate) return [];
    const gov = locations.find((g) => g.name === form.governorate);
    return gov ? gov.districts : [];
  }, [form.governorate, locations]);

  // Get sub-districts for selected district
  const availableSubDistricts = useMemo(() => {
    if (!form.city) return [];
    const district = availableDistricts.find((d) => d.name === form.city);
    return district ? district.subDistricts : [];
  }, [form.city, availableDistricts]);

  const fetchAddresses = useCallback(async () => {
    if (!accessToken) return;
    const res = await getJson<Address[]>('/api/v1/addresses', { token: accessToken });
    if (res.success) setAddresses(res.data as Address[]);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);

    const payload = {
      ...form,
      district: form.district || undefined,
      nearestPoint: form.nearestPoint || undefined,
      street: form.street || undefined,
      landmark: form.landmark || undefined,
    };

    const res = await postJson('/api/v1/addresses', payload, { token: accessToken });
    setSaving(false);
    if (res.success) {
      toast.success('تمت إضافة العنوان');
      setShowForm(false);
      setForm({ fullName: '', phone: '', governorate: '', city: '', district: '', nearestPoint: '', street: '', landmark: '', isDefault: false });
      fetchAddresses();
    } else {
      const errorMsg = !res.success && res.error?.message ? res.error.message : 'حدث خطأ';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    const res = await deleteJson(`/api/v1/addresses/${id}`, { token: accessToken });
    if (res.success) {
      toast.success('تم حذف العنوان');
      fetchAddresses();
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">العناوين</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus size={16} />
          إضافة عنوان
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-card rounded-xl border border-border p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">رقم الهاتف *</label>
              <input
                type="text"
                required
                dir="ltr"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
              />
            </div>

            {/* Governorate Select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">المحافظة *</label>
              <div className="relative">
                <select
                  required
                  value={form.governorate}
                  onChange={e => setForm(p => ({ ...p, governorate: e.target.value, city: '', district: '' }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm appearance-none cursor-pointer"
                >
                  <option value="">اختر المحافظة</option>
                  {locations.map((gov) => (
                    <option key={gov.name} value={gov.name}>{gov.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* District (City/Qadaa) Select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">القضاء *</label>
              <div className="relative">
                <select
                  required
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value, district: '' }))}
                  disabled={!form.governorate}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">اختر القضاء</option>
                  {availableDistricts.map((d) => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Sub-District (Nahiya) Select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الناحية</label>
              <div className="relative">
                <select
                  value={form.district}
                  onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                  disabled={!form.city}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">اختر الناحية (اختياري)</option>
                  {availableSubDistricts.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الشارع / الحي</label>
              <input
                type="text"
                value={form.street}
                onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
                placeholder="مثال: حي النصر، شارع 20"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
              />
            </div>
          </div>

          {/* Nearest Point */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">أقرب نقطة دالة</label>
            <input
              type="text"
              value={form.nearestPoint}
              onChange={e => setForm(p => ({ ...p, nearestPoint: e.target.value }))}
              placeholder="مثال: قرب جامع الرحمن، مقابل مدرسة..."
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">ملاحظات إضافية</label>
            <input
              type="text"
              value={form.landmark}
              onChange={e => setForm(p => ({ ...p, landmark: e.target.value }))}
              placeholder="معلومات إضافية للسائق..."
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary transition text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-foreground">تعيين كعنوان افتراضي</span>
          </label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ العنوان'}
            </button>
          </div>
        </form>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <MapPin size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">لا توجد عناوين</h3>
          <p className="text-sm text-muted-foreground">أضف عنوان توصيل جديد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className={`bg-card rounded-xl border p-4 relative ${addr.isDefault ? 'border-primary' : 'border-border'}`}>
              {addr.isDefault && (
                <span className="absolute top-3 left-3 flex items-center gap-1 text-xs text-primary font-medium">
                  <Star size={12} className="fill-primary" />
                  افتراضي
                </span>
              )}
              <p className="font-semibold text-foreground text-sm">{addr.fullName}</p>
              <p className="text-xs text-muted-foreground mt-1" dir="ltr">{addr.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {addr.governorate}، {addr.city}
                {addr.district && `، ${addr.district}`}
              </p>
              {addr.street && <p className="text-xs text-muted-foreground mt-1">{addr.street}</p>}
              {addr.nearestPoint && <p className="text-xs text-muted-foreground mt-1">أقرب نقطة: {addr.nearestPoint}</p>}
              {addr.landmark && <p className="text-xs text-muted-foreground mt-1">ملاحظات: {addr.landmark}</p>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition"
                >
                  <Trash2 size={12} />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
