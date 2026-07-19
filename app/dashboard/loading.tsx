export default function DashboardLoading() {
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl animate-pulse flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
          <div className="space-y-2.5">
            <div className="h-3 w-40 rounded bg-muted" />
            <div className="h-7 w-64 rounded bg-muted" />
            <div className="h-4 w-80 rounded bg-muted" />
          </div>
          <div className="h-10 w-44 rounded-md bg-muted" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-background p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-muted" />
                  <div className="h-6 w-10 rounded bg-muted" />
                </div>
                <div className="size-9 rounded-md bg-muted" />
              </div>
              <div className="mt-3 h-3 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border bg-background">
            <div className="border-b px-5 py-4">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-2 h-3 w-52 rounded bg-muted" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 px-5 py-4">
                  <div className="size-1.5 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-background">
            <div className="border-b px-5 py-4">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-2 h-3 w-40 rounded bg-muted" />
            </div>
            <div className="space-y-4 px-5 py-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 rounded-full bg-muted" />
                    <div className="h-3 w-14 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-background">
          <div className="border-b px-5 py-4">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="mt-2 h-3 w-56 rounded bg-muted" />
          </div>
          <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-3 p-5">
                <div className="mb-1 h-4 w-32 rounded bg-muted" />
                {Array.from({ length: 3 }).map((__, row) => (
                  <div key={row} className="flex items-center justify-between gap-3">
                    <div className="h-3.5 w-2/3 rounded bg-muted" />
                    <div className="h-5 w-12 rounded-full bg-muted" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}