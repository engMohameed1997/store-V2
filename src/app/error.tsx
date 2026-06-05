"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-7xl font-bold tracking-tighter text-foreground">
          500
        </h1>
        <p className="text-lg text-muted-foreground">
          حدث خطأ غير متوقع
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mx-auto max-w-md text-sm text-destructive">
            {error.message}
          </p>
        )}
      </div>
      <Button onClick={reset} variant="default">
        إعادة المحاولة
      </Button>
    </div>
  );
}
