export function RouteFallback() {
  return (
    <div className="wrap py-8">
      <div className="h-8 w-48 animate-pulse rounded-full bg-line" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-3xl bg-line/80" />
        <div className="h-40 animate-pulse rounded-3xl bg-line/80" />
      </div>
    </div>
  );
}
