import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  CircleDollarSign,
  LayoutDashboard,
  ListChecks,
  MessageSquareQuote,
  Music4,
  Sparkle,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { MiaChat } from "@/components/mia-chat";
import { MiaAvatar } from "@/components/mia-avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/projetos", label: "Projetos", icon: Music4 },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/feedbacks", label: "Feedbacks", icon: MessageSquareQuote },
  { to: "/tarefas", label: "Tarefas & Entregas", icon: ListChecks },
  { to: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { to: "/em-breve", label: "Em Breve", icon: Sparkle },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <MiaAvatar size={30} />
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold">Prelúdia</p>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
              Estúdio de gestão musical
            </p>
          </div>
        </div>
        <div className="staff-lines mx-6 h-6 opacity-70" aria-hidden />
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-ink text-ink-foreground hover:bg-ink hover:text-ink-foreground" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="m-3 rounded-xl border bg-blue-soft/60 p-4">
          <p className="text-xs font-medium">Plano Maestro</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Projetos ilimitados e análises da Mia sem limite mensal.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-background/85 px-5 py-3 backdrop-blur lg:px-8">
          <nav className="flex items-center gap-3 overflow-x-auto lg:hidden">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="text-xs whitespace-nowrap text-muted-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <CalendarClock className="size-4" />
            Quarta-feira, 9 de setembro de 2026
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">Julia Alcassa</p>
              <p className="text-xs text-muted-foreground">Compositora e arranjadora</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-ink text-sm font-medium text-ink-foreground">
              JA
            </div>
          </div>
        </header>

        <main className="px-5 py-6 pb-24 lg:px-8 lg:py-8">{children}</main>
      </div>

      <MiaChat />
    </div>
  );
}
