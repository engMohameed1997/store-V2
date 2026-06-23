'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Send,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getJson, postJson, putJson } from '@/lib/client/api';
import { TicketStatus } from '@/lib/types/ticket';

const ADMIN_BASE = '/api/v1/mx-panel';

interface TicketMessage {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  messages?: TicketMessage[];
}

const statusMap: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  [TicketStatus.OPEN]: { label: 'مفتوح', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  [TicketStatus.IN_PROGRESS]: { label: 'قيد المتابعة', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  [TicketStatus.WAITING_CUSTOMER]: { label: 'بانتظار الزبون', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  [TicketStatus.RESOLVED]: { label: 'تم الحل', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  [TicketStatus.CLOSED]: { label: 'مغلق', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/20' },
};

export default function TicketsPage() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const opts = {};

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const url = statusFilter === 'ALL'
        ? `${ADMIN_BASE}/tickets`
        : `${ADMIN_BASE}/tickets?status=${statusFilter}`;
      const result = await getJson<SupportTicket[]>(url, opts);
      if (result.success && result.data) {
        setTickets(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const selectTicket = async (ticket: SupportTicket) => {
    if (!isAuthenticated) return;
    setLoadingDetails(true);
    setSelectedTicket(ticket);
    try {
      const result = await getJson<SupportTicket>(`${ADMIN_BASE}/tickets/${ticket.id}`, opts);
      if (result.success && result.data) {
        setSelectedTicket(result.data);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !selectedTicket || submittingReply || !replyBody.trim()) return;

    setSubmittingReply(true);
    try {
      const result = await postJson<TicketMessage>(
        `${ADMIN_BASE}/tickets/${selectedTicket.id}`,
        { body: replyBody.trim() },
        opts
      );
      if (result.success && result.data) {
        setSelectedTicket(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: TicketStatus.WAITING_CUSTOMER,
            messages: [...(prev.messages || []), result.data!],
          };
        });
        setReplyBody('');
        // Update list status
        setTickets(prev =>
          prev.map(t => (t.id === selectedTicket.id ? { ...t, status: TicketStatus.WAITING_CUSTOMER } : t))
        );
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!isAuthenticated || !selectedTicket || changingStatus) return;

    setChangingStatus(status);
    try {
      const result = await putJson<SupportTicket>(
        `${ADMIN_BASE}/tickets/${selectedTicket.id}`,
        { status },
        opts
      );
      if (result.success && result.data) {
        setSelectedTicket(prev => {
          if (!prev) return null;
          return { ...prev, status };
        });
        setTickets(prev =>
          prev.map(t => (t.id === selectedTicket.id ? { ...t, status } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setChangingStatus(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      `${t.user.firstName} ${t.user.lastName}`.toLowerCase().includes(term) ||
      (t.user.phone && t.user.phone.includes(term))
    );
  });

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">خدمة العملاء والشكاوى</h1>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-xl text-xs hover:bg-muted transition text-foreground"
        >
          <RefreshCw size={14} />
          تحديث القائمة
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Side: Tickets List */}
        <div className="w-full md:w-96 flex flex-col bg-card border border-border rounded-2xl min-h-0 overflow-hidden">
          {/* Filters & Search */}
          <div className="p-4 border-b border-border space-y-3 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث في التذاكر أو العملاء..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-border rounded-xl bg-background text-foreground text-xs outline-none focus:border-primary transition"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {['ALL', ...Object.values(TicketStatus)].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted-dark text-muted-foreground'
                  }`}
                >
                  {status === 'ALL' ? 'الكل' : statusMap[status as TicketStatus]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                لا توجد تذاكر دعم تطابق الفلاتر
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const info = statusMap[ticket.status];
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`w-full p-4 text-right flex flex-col gap-1 transition ${
                      isSelected ? 'bg-primary/5 border-r-4 border-primary' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs text-foreground truncate max-w-[200px]">
                        {ticket.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${info.bg} ${info.color} shrink-0`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {ticket.description}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {ticket.user.firstName} {ticket.user.lastName}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString('ar-IQ')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat / Ticket details */}
        <div className="hidden md:flex flex-1 flex-col bg-card border border-border rounded-2xl min-h-0 overflow-hidden relative">
          {selectedTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="p-4 border-b border-border flex justify-between items-center bg-card shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{selectedTicket.title}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 text-foreground font-medium">
                      {selectedTicket.user.firstName} {selectedTicket.user.lastName}
                    </span>
                    {selectedTicket.user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} />
                        {selectedTicket.user.phone}
                      </span>
                    )}
                    <span>التذكرة #{selectedTicket.id.slice(0, 8)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    disabled={changingStatus !== null}
                    onChange={e => handleUpdateStatus(e.target.value as TicketStatus)}
                    className="px-3 py-1.5 border border-border rounded-xl bg-background text-foreground text-xs outline-none focus:border-primary transition"
                  >
                    {Object.values(TicketStatus).map(status => (
                      <option key={status} value={status}>
                        {statusMap[status].label}
                      </option>
                    ))}
                  </select>
                  {changingStatus && <Loader2 size={14} className="animate-spin text-primary" />}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10 space-y-4">
                <div className="bg-card border border-border p-4 rounded-2xl max-w-2xl">
                  <p className="text-xs text-muted-foreground mb-1">وصف المشكلة الأساسية:</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {loadingDetails ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  selectedTicket.messages?.map(message => {
                    const isStaff = message.isStaff;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 max-w-[80%] ${isStaff ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
                      >
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          isStaff
                            ? 'bg-primary text-primary-foreground rounded-tl-none'
                            : 'bg-card border border-border text-foreground rounded-tr-none'
                        }`}>
                          <div className={`text-[10px] font-bold mb-1 ${
                            isStaff ? 'text-primary-foreground/85' : 'text-primary'
                          }`}>
                            {isStaff ? 'فريق الدعم' : `${message.user.firstName} ${message.user.lastName}`}
                          </div>
                          <p className="whitespace-pre-wrap">{message.body}</p>
                          <span className={`block text-[9px] mt-1.5 text-left ${
                            isStaff ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handlePostReply} className="p-4 border-t border-border bg-card flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="اكتب ردك هنا للزبون..."
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  className="flex-1 px-4 py-3 border border-border rounded-xl bg-background text-foreground text-sm outline-none focus:border-primary transition"
                  disabled={submittingReply}
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyBody.trim()}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl flex items-center justify-center transition hover:bg-primary-dark disabled:opacity-50 shrink-0"
                >
                  {submittingReply ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} className="rotate-180" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <MessageSquare size={48} className="opacity-30 mb-3" />
              <p className="text-sm font-medium">اختر تذكرة دعم من القائمة لعرض تفاصيلها والرد عليها</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
