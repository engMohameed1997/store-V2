'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { useStoreChat } from '@/hooks/use-store-chat';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const chat = useStoreChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages, chat.status]);

  const isLoading = chat.status === 'submitted' || chat.status === 'streaming';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    chat.sendMessage({ text: input.trim() });
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="افتح المساعد الذكي"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <Sparkles size={22} className="shrink-0" />
        <span className="text-sm font-medium hidden sm:inline">مساعد ذكي</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[calc(100vw-3rem)] sm:w-96 h-[60vh] max-h-[600px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-medium text-sm">المساعد الذكي</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          aria-label="إغلاق"
          className="hover:bg-primary-foreground/20 rounded-lg p-1 transition"
        >
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <ChatMessages messages={chat.messages} status={chat.status} />
      </div>

      {chat.error && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/10 border-t border-destructive/20">
          {chat.error.message || 'حدث خطأ. حاول مرة أخرى.'}
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
