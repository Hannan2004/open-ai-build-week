import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <UserButton />
      </div>

      <p>Signed-in Clerk user ID:</p>

      <code className="rounded-md bg-zinc-100 p-4">{userId}</code>
    </main>
  );
}