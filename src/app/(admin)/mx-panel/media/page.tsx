'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FolderOpen,
  Plus,
  Loader2,
  AlertCircle,
  Copy,
  Trash2,
  Search,
  Upload,
  Check,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, deleteJson } from '@/lib/client/api';
import { toast } from 'sonner';

const ADMIN_BASE = '/api/v1/mx-panel';

interface MediaAsset {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function MediaPage() {
  const { accessToken } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const opts = { token: accessToken! };

  const fetchAssets = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const result = await getJson<MediaAsset[]>(`${ADMIN_BASE}/media`, opts);
      if (result.success && result.data) {
        setAssets(result.data);
      }
    } catch {
      setError('فشل في تحميل مكتبة الوسائط');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleUpload = async (file?: File) => {
    if (!file || !accessToken) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${ADMIN_BASE}/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        setAssets(prev => [result.data, ...prev]);
        toast.success('تم رفع الملف بنجاح');
      } else {
        toast.error(result.error?.message || 'فشل في رفع الملف');
      }
    } catch {
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || deletingId) return;
    if (!confirm('هل أنت متأكد من حذف هذا الملف نهائياً؟')) return;
    setDeletingId(id);
    try {
      const result = await deleteJson(`${ADMIN_BASE}/media/${id}`, opts);
      if (result.success) {
        setAssets(prev => prev.filter(a => a.id !== id));
        toast.success('تم حذف الملف بنجاح');
      } else {
        toast.error(result.error.message || 'فشل في حذف الملف');
      }
    } catch {
      toast.error('فشل في حذف الملف');
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    toast.success('تم نسخ رابط الملف بنجاح');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredAssets = assets.filter(asset => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return asset.fileName.toLowerCase().includes(term) || asset.url.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderOpen size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">معرض الوسائط</h1>
        </div>
        
        {/* Upload Button */}
        <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark transition cursor-pointer ${
          uploading ? 'opacity-50 pointer-events-none' : ''
        }`}>
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Upload size={18} />
          )}
          <span>{uploading ? 'جاري الرفع...' : 'رفع ملف جديد'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={e => handleUpload(e.target.files?.[0])}
          />
        </label>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute right-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالاسم أو المسار..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 border border-border rounded-xl bg-background text-foreground text-xs outline-none focus:border-primary transition"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          إجمالي الملفات: {assets.length}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Grid of Assets */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد ملفات مرفوعة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col group relative">
              {/* Media Preview */}
              <div className="aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
                <img
                  src={asset.url}
                  alt={asset.fileName}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
                
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyToClipboard(asset)}
                    className="p-2 bg-white text-black hover:bg-slate-100 rounded-xl shadow-sm transition"
                    title="نسخ مسار الصورة"
                  >
                    {copiedId === asset.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    disabled={deletingId === asset.id}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                    title="حذف نهائي"
                  >
                    {deletingId === asset.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>

              {/* Information */}
              <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                <p className="text-xs font-medium text-foreground truncate" title={asset.fileName}>
                  {asset.fileName}
                </p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                  <span>{formatSize(asset.fileSize)}</span>
                  <span>{new Date(asset.createdAt).toLocaleDateString('ar-IQ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
