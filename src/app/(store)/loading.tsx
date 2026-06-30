export default function StoreLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero skeleton */}
      <div className="h-[220px] sm:h-[320px] md:h-[400px] bg-muted rounded-2xl animate-pulse mb-6" />

      {/* Categories skeleton */}
      <div className="flex gap-4 mb-8 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-muted animate-pulse" />
            <div className="w-14 h-3 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Products skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-3 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg mb-3" />
            <div className="h-3 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2 mb-3" />
            <div className="h-9 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
