import {
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Bot, CalendarDays, CheckSquare, Receipt, ShoppingCart } from "lucide-react";
import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-muted/30 px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center gap-2">
          <Bot className="size-5" aria-hidden="true" />
          <span className="font-semibold">Household Ops Agent</span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Shared household coordination</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Household Ops Agent
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Keep chores, groceries, bills, and schedules in sync with one calm place to coordinate and an agent that spots what needs attention.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Create household
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>

          <div className="border bg-background p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between border-b pb-5">
              <div>
                <p className="text-sm text-muted-foreground">This week at home</p>
                <p className="mt-1 text-lg font-semibold">Everything has an owner</p>
              </div>
              <Bot className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="divide-y">
              <PreviewRow icon={CheckSquare} title="Take out recycling" detail="Assigned before pickup" />
              <PreviewRow icon={ShoppingCart} title="Oat milk and vegetables" detail="Grouped for the next store run" />
              <PreviewRow icon={Receipt} title="Internet bill due Friday" detail="Visible before it becomes overdue" />
              <PreviewRow icon={CalendarDays} title="Family calendar checked" detail="Agent avoids schedule conflicts" />
            </div>
            <div className="mt-5 border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Agent insight</p>
              <p className="mt-1 leading-6 text-muted-foreground">A quick weekly review turns scattered household details into clear, reviewable recommendations.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Bot;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 py-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
