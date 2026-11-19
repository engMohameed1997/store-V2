'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bot, X, Sparkles, RotateCcw, LogIn } from 'lucide-react';
import { useStoreChat } from '@/hooks/use-store-chat';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import { useAuth } from '@/components/providers/auth-provider';

function getFriendlyError(error: Error): string {
  const raw = (error.message || '').trim();
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const msg = parsed?.error?.message;
      if (typeof msg === 'string' && msg) return msg;
    } catch {
      // not JSON — fall through to generic handling
    }
  }
  if (!raw || /fetch|network|failed|an error occurred/i.test(raw)) {
    return 'حدث خطأ. يرجى المحاولة مرة أخرى.';
  }
  return raw;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const chat = useStoreChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages, chat.status]);

  // Shown to everyone so visitors know it exists; guests get a login prompt.
  // The API itself still rejects anyone without a session.
  if (isAuthLoading) return null;

  const isLoading = chat.status === 'submitted' || chat.status === 'streaming';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    chat.sendMessage({ text: input.trim() });
    setInput('');
  };

  const handleReset = () => {
    if (isLoading) chat.stop();
    chat.setMessages([]);
    chat.clearError?.();
    setInput('');
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    chat.sendMessage({ text });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="افتح المساعد الذكي"
        className="fixed bottom-36 left-4 md:bottom-24 md:left-6 z-50 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Sparkles size={22} className="shrink-0" />
        <span className="text-sm font-medium hidden sm:inline">مساعد ذكي</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-36 left-4 md:bottom-24 md:left-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-96 h-[60vh] max-h-[600px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-medium text-sm">المساعد الذكي</span>
          {isAuthenticated && chat.remaining !== null && (
            <span className="text-[11px] opacity-80" title="الرسائل المتبقية اليوم">
              · متبقي {chat.remaining}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAuthenticated && chat.messages.length > 0 && (
            <button
              onClick={handleReset}
              aria-label="محادثة جديدة"
              title="محادثة جديدة"
              className="hover:bg-primary-foreground/20 rounded-lg p-1 transition"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق"
            className="hover:bg-primary-foreground/20 rounded-lg p-1 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6 py-8">
          <Bot size={40} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            مرحباً! أنا المساعد الذكي للمتجر. أساعدك تلقى المنتجات وتتابع طلباتك وتعرف تفاصيل التوصيل.
          </p>
          <p className="text-sm font-medium">سجّل دخولك حتى تستخدم المساعد</p>
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full transition"
          >
            <LogIn size={16} />
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            onClick={() => setIsOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition"
          >
            ما عندك حساب؟ أنشئ حساب جديد
          </Link>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
            <ChatMessages messages={chat.messages} status={chat.status} onSuggestion={handleSuggestion} />
          </div>

          {chat.error && (
            <div className="px-4 py-2 text-xs text-destructive bg-destructive/10 border-t border-destructive/20">
              {getFriendlyError(chat.error)}
            </div>
          )}

          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSubmit={handleSend}
            onStop={chat.stop}
          />
        </>
      )}
    </div>
  );
}
