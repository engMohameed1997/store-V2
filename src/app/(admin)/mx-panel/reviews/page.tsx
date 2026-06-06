'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Star,
  Loader2,
  AlertCircle,
  Check,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useAdminClient } from '@/hooks/use-admin-client';
import type { AdminReview } from '@/lib/client/admin';

export default function ReviewsPage() {
  const client = useAdminClient();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const result = await client.reviews.list({ page, limit: 20, search: search || undefined });
      if (result.success) {
        const data = result as unknown as { data: AdminReview[]; pagination?: { totalPages: number } };
        setReviews(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (!result.success) {
        setError(result.error.message);
      }
    } catch {
      setError('فشل في تحميل المراجعات');
    } finally {
      setLoading(false);
    }
  }, [client, page, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id: string) => {
    if (!client || actionId) return;
    setActionId(id);
    try {
      const result = await client.reviews.approve(id);
      if (result.success) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isApproved: true } : r)));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في الموافقة على المراجعة');
    } finally {
      setActionId(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!client || actionId || !replyText.trim()) return;
    setActionId(id);
    try {
      const result = await client.reviews.reply(id, replyText.trim());
      if (result.success) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, adminReply: replyText.trim() } : r)));
        setReplyId(null);
        setReplyText('');
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في إرسال الرد');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!client || actionId) return;
    if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) return;
    setActionId(id);
    try {
      const result = await client.reviews.delete(id);
      if (result.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else if (!result.success) {
        alert(result.error.message);
      }
    } catch {
      alert('فشل في حذف المراجعة');
    } finally {
      setActionId(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'} />
    ));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Star size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">المراجعات</h1>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="بحث في المراجعات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
          />
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Star size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد مراجعات</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-2xl p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {review.user ? `${review.user.firstName} ${review.user.lastName}` : 'مستخدم'}
                      </span>
                      {!review.isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                          بانتظار الموافقة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                    {review.product && (
                      <p className="text-xs text-muted-foreground mt-1">المنتج: {review.product.name}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                {/* Content */}
                {review.title && <p className="font-medium text-foreground text-sm mb-1">{review.title}</p>}
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}

                {/* Admin reply */}
                {review.adminReply && (
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                    <p className="text-xs font-medium text-primary mb-1">رد الإدارة:</p>
                    <p className="text-sm text-foreground">{review.adminReply}</p>
                  </div>
                )}

                {/* Reply form */}
                {replyId === review.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="اكتب ردك..."
                      className="flex-1 px-3 py-2 border border-border rounded-xl bg-background text-foreground outline-none focus:border-primary transition text-sm"
                    />
                    <button
                      onClick={() => handleReply(review.id)}
                      disabled={actionId === review.id || !replyText.trim()}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary-dark transition disabled:opacity-50"
                    >
                      إرسال
                    </button>
                    <button
                      onClick={() => { setReplyId(null); setReplyText(''); }}
                      className="px-3 py-2 border border-border rounded-xl text-sm hover:bg-muted transition"
                    >
                      إلغاء
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={actionId === review.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition disabled:opacity-50"
                    >
                      <Check size={14} />
                      موافقة
                    </button>
                  )}
                  {!review.adminReply && replyId !== review.id && (
                    <button
                      onClick={() => { setReplyId(review.id); setReplyText(''); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition"
                    >
                      <MessageSquare size={14} />
                      رد
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={actionId === review.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition disabled:opacity-50 mr-auto"
                  >
                    {actionId === review.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    حذف
                  </button>
                </div>
              </div>
            ))}
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
              <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
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
