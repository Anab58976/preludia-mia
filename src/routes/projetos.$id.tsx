import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, FileMusic, Package, Quote, Pencil, Trash2, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { ProjectEditor } from "@/components/project-editor";
import { MusicEditor } from "@/components/music-editor";
import { ProjectFiles } from "@/components/project-media";

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
  const [editing, setEditing] = useState(false);
  const [editingSheet, setEditingSheet] = useState(false);
  const navigate = useNavigate();

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

      <ProjectEditor project={project} open={editing} onOpenChange={setEditing} />
      <MusicEditor project={project} open={editingSheet} onOpenChange={setEditingSheet} />
      <header className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cliente?.name} · {project.type} · entrega em {fullDate(project.deadline)} (
              {deadlineLabel(project.deadline)})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={project.status} /><button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"><Pencil className="size-3.5"/> Editar projeto</button><button type="button" onClick={() => { if (window.confirm("Excluir este projeto e suas tarefas, feedbacks e pagamentos?")) { store.deleteProject(project.id); void navigate({ to: "/projetos" }); toast.success("Projeto excluído."); } }} className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-destructive"><Trash2 className="size-3.5"/> Excluir</button></div>
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
            <button type="button" onClick={() => setEditingSheet(true)} className="ml-auto inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"><Pencil className="size-3.5"/> Editar ficha</button>
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
          <div className="border-b p-4"><button type="button" onClick={() => { const title = window.prompt("Título da nova tarefa:"); if (title?.trim()) { store.addTask({ projectId: project.id, title: title.trim(), priority: "Média", dueDate: project.deadline }); toast.success("Tarefa criada."); } }} className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs text-ink-foreground"><Plus className="size-3.5"/> Nova tarefa</button></div>
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

      {aba === "Arquivos" && <ProjectFiles project={project} />}

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
          <button type="button" onClick={() => { const html = `<!doctype html><html lang="pt-br"><meta charset="UTF-8"><title>Entrega — ${project.title.replaceAll("<", "&lt;")}</title><style>body{font-family:system-ui;max-width:700px;margin:64px auto;padding:20px;line-height:1.6;color:#182033}header{border-bottom:3px solid #2563eb}h1{font-size:28px}li{margin:8px 0}</style><header><h2>PRELÚDIA · ENTREGA MUSICAL</h2></header><h1>${project.title.replaceAll("<", "&lt;")}</h1><p>Para: ${(cliente?.name ?? "Cliente").replaceAll("<", "&lt;")}</p><p>Data: ${fullDate(project.deadline)}</p><h3>Ficha musical</h3><p>Tonalidade: ${project.sheet.arrangementKey.replaceAll("<", "&lt;")} · BPM: ${project.sheet.bpm} · Duração: ${project.sheet.duration.replaceAll("<", "&lt;")}</p><h3>Arquivos para entrega</h3><ul>${arquivos.map(f => `<li>${f.category}: ${f.name.replaceAll("<", "&lt;")}</li>`).join("")}</ul><p>Solicite os arquivos ao profissional. Este resumo não envia os áudios.</p></html>`; const blob = new Blob([html], {type: "text/html"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `entrega-${project.id}.html`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); toast.success("Resumo da entrega exportado."); }} className="mr-2 mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><Download className="size-4"/> Exportar resumo</button>
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
