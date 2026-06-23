'use client';

import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit, onStop }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-border">
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="اكتب رسالتك..."
        disabled={isLoading}
        maxLength={500}
        className="flex-1 bg-background text-foreground text-sm rounded-xl px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
      />
      {isLoading ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="إيقاف"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition"
        >
          <Square size={16} />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="إرسال"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition"
        >
          <Send size={16} />
        </button>
      )}
    </form>
  );
}
