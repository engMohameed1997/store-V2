'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Truck,
  Loader2,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson, putJson, deleteJson } from '@/lib/client/api';

const ADMIN_BASE = '/api/v1/mx-panel';

interface ShippingZone {
  id: string;
  name: string;
  governorates: string[];
  baseCost: number | string;
  freeAbove: number | string | null;
  estimatedDays: number;
  isActive: boolean;
}

interface LocationData {
  name: string;
  districts: { name: string; subDistricts: string[] }[];
}

export default function ShippingPage() {
  const { isAuthenticated } = useAuth();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formGovernorates, setFormGovernorates] = useState<string[]>([]);
  const [formBaseCost, setFormBaseCost] = useState('');
  const [formFreeAbove, setFormFreeAbove] = useState('');
  const [formEstimatedDays, setFormEstimatedDays] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [expandedGov, setExpandedGov] = useState<string | null>(null);

  const opts = {};

  useEffect(() => {
    getJson<{ governorates: LocationData[] }>('/api/v1/locations').then((res) => {
      if (res.success && res.data) {
        setLocations((res.data as { governorates: LocationData[] }).governorates);
      }
    });
  }, []);

  const fetchZones = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const result = await getJson<ShippingZone[]>(`${ADMIN_BASE}/shipping`, opts);
      if (result.success && result.data) {
        setZones(result.data as unknown as ShippingZone[]);
      }
    } catch {
      setError('فشل في تحميل مناطق التوصيل');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormName('');
    setFormGovernorates([]);
    setFormBaseCost('');
    setFormFreeAbove('');
    setFormEstimatedDays('');
    setFormIsActive(true);
  };

  const openEdit = (z: ShippingZone) => {
    setEditId(z.id);
    setFormName(z.name);
    setFormGovernorates(z.governorates);
    setFormBaseCost(String(z.baseCost));
    setFormFreeAbove(z.freeAbove ? String(z.freeAbove) : '');
    setFormEstimatedDays(String(z.estimatedDays));
    setFormIsActive(z.isActive);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || saving) return;
    if (!formName.trim() || formGovernorates.length === 0) {
      setError('الاسم والمحافظات مطلوبة');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: formName.trim(),
      governorates: formGovernorates,
      baseCost: Number(formBaseCost) || 0,
      freeAbove: formFreeAbove ? Number(formFreeAbove) : null,
      estimatedDays: Number(formEstimatedDays) || 1,
      isActive: formIsActive,
    };

    try {
      if (editId) {
        const result = await putJson(`${ADMIN_BASE}/shipping/${editId}`, payload, opts);
        if (result.success) {
          await fetchZones();
          resetForm();
        } else if (!result.success) {
          setError(result.error.message);
        }
      } else {
        const result = await postJson(`${ADMIN_BASE}/shipping`, payload, opts);
        if (result.success) {
          await fetchZones();
          resetForm();
        } else if (!result.success) {
          setError(result.error.message);
        }
      }
    } catch {
      setError('فشل في حفظ منطقة التوصيل');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف منطقة التوصيل؟')) return;
    try {
      const result = await deleteJson(`${ADMIN_BASE}/shipping/${id}`, opts);
      if (result.success) {
        setZones((prev) => prev.filter((z) => z.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف منطقة التوصيل');
    }
  };

  const toggleGovernorate = (gov: string) => {
    setFormGovernorates((prev) =>
      prev.includes(gov) ? prev.filter((g) => g !== gov) : [...prev, gov]
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">إدارة التوصيل</h1>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition"
          >
            <Plus size={16} />
            إضافة منطقة
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="mr-auto p-1"><X size={14} /></button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">
              {editId ? 'تعديل منطقة التوصيل' : 'إضافة منطقة توصيل جديدة'}
            </h2>
            <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-muted transition">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">اسم المنطقة *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: بغداد والوسط"
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">تكلفة التوصيل (د.ع) *</label>
                <input
                  type="number"
                  value={formBaseCost}
                  onChange={(e) => setFormBaseCost(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">توصيل مجاني فوق (د.ع)</label>
                <input
                  type="number"
                  value={formFreeAbove}
                  onChange={(e) => setFormFreeAbove(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">مدة التوصيل المتوقعة (أيام) *</label>
                <input
                  type="number"
                  value={formEstimatedDays}
                  onChange={(e) => setFormEstimatedDays(e.target.value)}
                  placeholder="3"
                  className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Governorates Selection */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">المحافظات المشمولة *</label>
              <div className="space-y-1 max-h-64 overflow-y-auto border border-border rounded-xl p-3">
                {locations.map((gov) => (
                  <div key={gov.name}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGovernorate(gov.name)}
                        className={`flex-1 text-right px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          formGovernorates.includes(gov.name)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {formGovernorates.includes(gov.name) && <Check size={12} className="inline ml-1" />}
                        {gov.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedGov(expandedGov === gov.name ? null : gov.name)}
                        className="p-1.5 rounded-lg hover:bg-muted transition"
                      >
                        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${expandedGov === gov.name ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {expandedGov === gov.name && (
                      <div className="pr-6 pt-1 pb-2">
                        <p className="text-[10px] text-muted-foreground mb-1">الأقضية:</p>
                        <div className="flex flex-wrap gap-1">
                          {gov.districts.map((d) => (
                            <span key={d.name} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm text-foreground">نشط</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : editId ? 'حفظ التعديلات' : 'إضافة المنطقة'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-border rounded-xl text-sm hover:bg-muted transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MapPin size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد مناطق توصيل</p>
          <p className="text-xs mt-1">أضف مناطق التوصيل لتفعيل الشحن</p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{zone.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      zone.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                      {zone.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {zone.governorates.map((g) => (
                      <span key={g} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(zone)}
                    className="p-2 rounded-lg text-primary hover:bg-primary/10 transition"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-6 text-xs text-muted-foreground">
                <span>التكلفة: <strong className="text-foreground">{Number(zone.baseCost).toLocaleString('ar-IQ')} د.ع</strong></span>
                {zone.freeAbove && (
                  <span>مجاني فوق: <strong className="text-foreground">{Number(zone.freeAbove).toLocaleString('ar-IQ')} د.ع</strong></span>
                )}
                <span>المدة المتوقعة: <strong className="text-foreground">{zone.estimatedDays} يوم</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
