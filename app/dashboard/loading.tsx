export default function DashboardLoading() {
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
        <div className="h-16 rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-72 rounded-lg bg-muted" />
          <div className="h-72 rounded-lg bg-muted" />
        </div>
      </div>
    </main>
  );
}
