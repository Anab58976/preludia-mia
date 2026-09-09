import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, FileMusic, Package, Paperclip, Quote } from "lucide-react";

import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { MiaAvatar } from "@/components/mia-avatar";
import { PROJECT_STATUSES, type ProjectStatus } from "@/data/preludia";
import { useStore } from "@/lib/store";
import { currency, deadlineLabel, fullDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projetos/$id")({
  head: () => ({
    meta: [
      { title: "Projeto — Prelúdia" },
      {
        name: "description",
        content:
          "Ficha musical completa, tarefas, arquivos, feedbacks e dados comerciais do projeto.",
      },
      { property: "og:title", content: "Projeto — Prelúdia" },
      {
        property: "og:description",
        content: "Tonalidade, andamento, instrumentação e entregas em um só lugar.",
      },
    ],
  }),
  component: DetalheProjeto,
});

const abas = ["Ficha musical", "Tarefas", "Arquivos", "Feedbacks", "Entrega"] as const;

function DetalheProjeto() {
  const { id } = Route.useParams();
  const store = useStore();
  const [aba, setAba] = useState<(typeof abas)[number]>("Ficha musical");

  const project = store.projectById(id);
  if (!project) throw notFound();

  const cliente = store.clientById(project.clientId);
  const tarefas = store.tasks.filter((t) => t.projectId === project.id);
  const arquivos = store.files.filter((f) => f.projectId === project.id);
  const feedbacks = store.feedbacks.filter((f) => f.projectId === project.id);
  const saldo = project.budget - project.paid;

  return (
    <div className="space-y-6">
      <Link to="/projetos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Projetos
      </Link>

      <header className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cliente?.name} · {project.type} · entrega em {fullDate(project.deadline)} (
              {deadlineLabel(project.deadline)})
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {PROJECT_STATUSES.map((status: ProjectStatus, index) => {
            const atual = PROJECT_STATUSES.indexOf(project.status);
            const passou = index <= atual;
            return (
              <button
                key={status}
                type="button"
                onClick={() => store.setProjectStatus(project.id, status)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  passou
                    ? "border-transparent bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-secondary",
                  index === atual && "border-transparent bg-ink text-ink-foreground",
                )}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Orçamento", value: currency(project.budget) },
            { label: "Recebido", value: currency(project.paid) },
            { label: "Saldo", value: currency(saldo) },
            { label: "Andamento", value: `${project.progress}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-secondary/70 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b">
        {abas.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAba(item)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              aba === item
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {aba === "Ficha musical" && (
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <FileMusic className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Ficha musical</h2>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Tonalidade original", value: project.sheet.originalKey },
              { label: "Tonalidade do arranjo", value: project.sheet.arrangementKey },
              {
                label: "Andamento",
                value: project.sheet.bpm ? `${project.sheet.bpm} BPM` : "A definir",
              },
              { label: "Duração", value: project.sheet.duration },
              { label: "Compasso", value: project.sheet.timeSignature },
              { label: "Estrutura", value: project.sheet.structure },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="staff-lines my-6 h-5 opacity-60" aria-hidden />

          <p className="text-xs tracking-wide text-muted-foreground uppercase">Instrumentação</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.sheet.instrumentation.length === 0 && (
              <span className="text-sm text-muted-foreground">Ainda não definida.</span>
            )}
            {project.sheet.instrumentation.map((item) => (
              <span key={item} className="rounded-full bg-blue-soft px-3 py-1 text-xs">
                {item}
              </span>
            ))}
          </div>

          <p className="mt-6 text-xs tracking-wide text-muted-foreground uppercase">Observações</p>
          <p className="mt-1 text-sm">{project.sheet.notes || "Sem observações."}</p>
        </section>
      )}

      {aba === "Tarefas" && (
        <section className="rounded-xl border bg-card">
          <ul className="divide-y">
            {tarefas.length === 0 && (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                Nenhuma tarefa neste projeto ainda.
              </li>
            )}
            {tarefas.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-4">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => store.toggleTask(task.id)}
                  className="size-4 accent-[var(--primary)]"
                  aria-label={`Concluir ${task.title}`}
                />
                <span className={cn("flex-1 text-sm", task.done && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
                <PriorityBadge priority={task.priority} />
                <span className="text-xs text-muted-foreground">{fullDate(task.dueDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aba === "Arquivos" && (
        <section className="grid gap-4 sm:grid-cols-2">
          {arquivos.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum arquivo enviado neste projeto.</p>
          )}
          {arquivos.map((file) => (
            <div key={file.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <Paperclip className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.category} · {file.size} · {fullDate(file.updatedAt)}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {aba === "Feedbacks" && (
        <section className="space-y-4">
          {feedbacks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum feedback registrado.{" "}
              <Link to="/feedbacks" className="text-primary hover:underline">
                Analisar uma mensagem com a Mia
              </Link>
              .
            </p>
          )}
          {feedbacks.map((feedback) => (
            <article key={feedback.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">
                  {feedback.author} · {feedback.source}
                </p>
                <span className="text-xs text-muted-foreground">{fullDate(feedback.date)}</span>
              </div>
              <p className="mt-3 flex gap-2 rounded-lg bg-secondary/70 p-3 text-sm text-muted-foreground">
                <Quote className="mt-0.5 size-4 shrink-0" />
                {feedback.original}
              </p>
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-blue-soft/50 p-3">
                <MiaAvatar size={28} />
                <div>
                  <p className="text-sm">{feedback.summary}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                    {feedback.changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Urgência: {feedback.urgency} · Tom: {feedback.tone}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {aba === "Entrega" && (
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Resumo de entrega para o cliente</h2>
          </div>
          <div className="mt-5 space-y-4 rounded-xl border bg-secondary/40 p-5">
            <div>
              <p className="font-display text-xl">{project.title}</p>
              <p className="text-sm text-muted-foreground">
                Preparado para {cliente?.name} — {fullDate(project.deadline)}
              </p>
            </div>
            <div className="staff-lines h-4 opacity-60" aria-hidden />
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Tonalidade: </span>
                {project.sheet.arrangementKey}
              </p>
              <p>
                <span className="text-muted-foreground">Andamento: </span>
                {project.sheet.bpm ? `${project.sheet.bpm} BPM` : "A definir"}
              </p>
              <p>
                <span className="text-muted-foreground">Duração: </span>
                {project.sheet.duration}
              </p>
              <p>
                <span className="text-muted-foreground">Formação: </span>
                {project.sheet.instrumentation.join(", ") || "A definir"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Arquivos incluídos</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {arquivos.length === 0 && <li>Nenhum arquivo anexado ainda.</li>}
                {arquivos.map((file) => (
                  <li key={file.id}>
                    {file.category} — {file.name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium">Situação financeira</p>
              <p className="text-sm text-muted-foreground">
                {currency(project.paid)} recebidos de {currency(project.budget)} — saldo de{" "}
                {currency(saldo)}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => store.setProjectStatus(project.id, "Aguardando cliente")}
            className="mt-5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ink-foreground"
          >
            Marcar como enviado ao cliente
          </button>
        </section>
      )}
    </div>
  );
}
