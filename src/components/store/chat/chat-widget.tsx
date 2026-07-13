'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles, RotateCcw } from 'lucide-react';
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

  if (isAuthLoading || !isAuthenticated) return null;

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
        </div>
        <div className="flex items-center gap-1">
          {chat.messages.length > 0 && (
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
    </div>
  );
}
