'use client';

import type { UIMessage } from 'ai';
import { Bot, User, Loader2, Wrench } from 'lucide-react';

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
}

function extractText(parts: UIMessage['parts']): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

function hasToolParts(parts: UIMessage['parts']): boolean {
  return parts.some((p) => p.type.startsWith('tool'));
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
        <Bot size={40} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          مرحباً! أنا المساعد الذكي للمتجر. اسألني عن المنتجات، الطلبات، التوصيل، أو أي استفسار آخر.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const text = extractText(msg.parts);
        const hasTools = hasToolParts(msg.parts);

        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="flex gap-2 justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
              </div>
              <div className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <User size={14} className="text-muted-foreground" />
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex gap-2 justify-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="space-y-1 max-w-[85%]">
              {hasTools && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1 w-fit">
                  <Wrench size={12} />
                  <span>جاري البحث في بيانات المتجر...</span>
                </div>
              )}
              {text && (
                <div className="bg-muted rounded-2xl rounded-tr-sm px-3 py-2">
                  <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
                </div>
              )}
              {!text && !hasTools && status === 'streaming' && (
                <div className="flex items-center gap-1 text-muted-foreground px-3 py-2">
                  <Loader2 size={14} className="animate-spin" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
