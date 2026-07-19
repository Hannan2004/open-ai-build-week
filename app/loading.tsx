import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        <span>Loading household workspace...</span>
      </div>
    </main>
  );
}
