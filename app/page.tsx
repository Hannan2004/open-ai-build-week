import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { isAuthenticated } = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Household Ops Agent</h1>

      <p className="text-center text-zinc-600">
        Coordinate chores, groceries, bills, and household schedules.
      </p>

      {!isAuthenticated ? (
        <div className="flex gap-3">
          <SignInButton mode="modal">
            <button className="rounded-md bg-black px-4 py-2 text-white">
              Sign in
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="rounded-md border px-4 py-2">
              Create account
            </button>
          </SignUpButton>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Open dashboard
          </a>

          <UserButton />
        </div>
      )}
    </main>
  );
}