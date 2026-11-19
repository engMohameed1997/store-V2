'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UIMessage } from 'ai';
import { Bot, User, Loader2, Wrench } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import type { ChatProductCard } from '@/lib/chatbot/search';

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = ['ابحث عن منتج', 'أين طلبي؟', 'معلومات التوصيل', 'سياسة الإرجاع'];

function extractText(parts: UIMessage['parts']): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

/** A product tool call is still running. */
function isSearching(parts: UIMessage['parts']): boolean {
  return parts.some(
    (p) => p.type.startsWith('tool-') && 'state' in p && (p.state === 'input-streaming' || p.state === 'input-available')
  );
}

const MAX_CARDS = 6;

function isProductCard(v: unknown): v is ChatProductCard {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return typeof p.slug === 'string' && typeof p.name === 'string' && typeof p.price === 'number';
}

/** Products returned by the search / details tools in this reply. */
function extractProducts(parts: UIMessage['parts']): ChatProductCard[] {
  const seen = new Set<string>();
  const cards: ChatProductCard[] = [];
  for (const part of parts) {
    if (!part.type.startsWith('tool-') || !('output' in part) || part.state !== 'output-available') continue;
    const output = part.output as { products?: unknown; product?: unknown } | undefined;
    const list = [...(Array.isArray(output?.products) ? output.products : []), output?.product];
    for (const item of list) {
      if (isProductCard(item) && !seen.has(item.slug)) {
        seen.add(item.slug);
        cards.push(item);
      }
    }
  }
  return cards.slice(0, MAX_CARDS);
}

/**
 * Replies use light markdown. Images and link targets are dropped: products
 * are shown as cards, and the reply shouldn't send visitors elsewhere.
 */
function cleanReply(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[ \t]*[-*•]?[ \t]*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((seg, i) =>
    seg.length > 4 && seg.startsWith('**') && seg.endsWith('**') ? (
      <strong key={i} className="font-semibold">{seg.slice(2, -2)}</strong>
    ) : (
      seg
    )
  );
}

function ProductRow({ product }: { product: ChatProductCard }) {
  const [imageFailed, setImageFailed] = useState(false);
  const discounted = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 hover:border-primary/50 hover:bg-muted/40 transition"
    >
      <div className="shrink-0 w-14 h-14 rounded-lg bg-white overflow-hidden flex items-center justify-center">
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-2xl opacity-30">📦</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">{product.name}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-primary">
            {formatPrice(product.price)} <span className="text-[10px] font-normal">د.ع</span>
          </span>
          {discounted && (
            <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
          {!product.inStock && <span className="text-[10px] text-muted-foreground">نفذ</span>}
        </div>
      </div>
    </Link>
  );
}

export function ChatMessages({ messages, status, onSuggestion }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
        <Bot size={40} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          مرحباً! أنا المساعد الذكي للمتجر. اسألني عن المنتجات، الطلبات، التوصيل، أو أي استفسار آخر.
        </p>
        {onSuggestion && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="text-xs rounded-full border border-border bg-muted/50 hover:bg-muted px-3 py-1.5 text-foreground transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const text = extractText(msg.parts);

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

        const reply = cleanReply(text);
        const searching = isSearching(msg.parts);
        const products = extractProducts(msg.parts);

        return (
          <div key={msg.id} className="flex gap-2 justify-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="space-y-1 max-w-[85%]">
              {searching && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1 w-fit">
                  <Wrench size={12} />
                  <span>جاري البحث في بيانات المتجر...</span>
                </div>
              )}
              {reply && (
                <div className="bg-muted rounded-2xl rounded-tr-sm px-3 py-2">
                  <p className="text-sm whitespace-pre-wrap break-words">{renderBold(reply)}</p>
                </div>
              )}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  {products.map((p) => (
                    <ProductRow key={p.slug} product={p} />
                  ))}
                </div>
              )}
              {!reply && !searching && products.length === 0 && status === 'streaming' && (
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
