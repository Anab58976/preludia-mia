import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { ProjectEditor } from "@/components/project-editor";
import { createFileRoute, Link } from "@tanstack/react-router";

import { StatusBadge } from "@/components/status-badge";
import { PROJECT_STATUSES } from "@/data/preludia";
import { useStore } from "@/lib/store";
import { currency, deadlineLabel, fullDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projetos/")({
  head: () => ({
    meta: [
      { title: "Projetos — Prelúdia" },
      {
        name: "description",
        content:
          "Acompanhe todos os seus projetos musicais por status, prazo, cliente e situação financeira.",
      },
      { property: "og:title", content: "Projetos — Prelúdia" },
      {
        property: "og:description",
        content: "Do orçamento à entrega final, com ficha musical completa em cada projeto.",
      },
    ],
  }),
  component: Projetos,
});

function Projetos() {
  const { projects, clientById } = useStore();
  const [filtro, setFiltro] = useState<string>("Todos");
  const [busca, setBusca] = useState("");
  const [editor, setEditor] = useState(false);

  const lista = projects.filter((p) => (filtro === "Todos" || p.status === filtro) && `${p.title} ${clientById(p.clientId)?.name ?? ""}`.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} trabalhos cadastrados no seu estúdio.
          </p>
        </div>
        <button type="button" onClick={() => setEditor(true)} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ink-foreground"><Plus className="size-4"/> Novo projeto</button>
      </header>
      <ProjectEditor open={editor} onOpenChange={setEditor} />
      <label className="flex max-w-lg items-center gap-2 rounded-lg border bg-card px-3 py-2"><Search className="size-4 text-muted-foreground"/><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar projeto ou cliente" className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Buscar projeto" /></label>

      <div className="flex flex-wrap gap-2">
        {["Todos", ...PROJECT_STATUSES].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFiltro(status)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              filtro === status
                ? "border-transparent bg-ink text-ink-foreground"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {lista.length === 0 && <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Nenhum projeto encontrado. Crie um projeto para começar.</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        {lista.map((project) => {
          const saldo = project.budget - project.paid;
          return (
            <Link
              key={project.id}
              to="/projetos/$id"
              params={{ id: project.id }}
              className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-medium group-hover:text-primary">
                    {project.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {clientById(project.clientId)?.name} · {project.type}
                  </p>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="staff-lines my-4 h-4 opacity-60" aria-hidden />

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Entrega</p>
                  <p className="font-medium">{fullDate(project.deadline)}</p>
                  <p className="text-xs text-muted-foreground">{deadlineLabel(project.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orçamento</p>
                  <p className="font-medium">{currency(project.budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="font-medium">{currency(saldo)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Andamento</p>
                  <div className="mt-2 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
