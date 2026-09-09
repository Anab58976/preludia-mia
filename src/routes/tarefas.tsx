import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileAudio, FileText, Music2, Package, Plus } from "lucide-react";
import { toast } from "sonner";

import { PriorityBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { deadlineLabel, fullDate, TODAY } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FileCategory, Priority } from "@/data/preludia";

export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Tarefas & Entregas — Prelúdia" },
      {
        name: "description",
        content:
          "Tarefas por projeto com prioridade e prazo, arquivos categorizados e preparação de entregas.",
      },
      { property: "og:title", content: "Tarefas & Entregas — Prelúdia" },
      {
        property: "og:description",
        content: "Partituras, stems, mixes e prazos organizados por projeto.",
      },
    ],
  }),
  component: Tarefas,
});

const categorias: FileCategory[] = [
  "Partitura",
  "Áudio",
  "Stems",
  "Mix",
  "Master",
  "Documentos",
];

const iconePorCategoria: Record<FileCategory, typeof Music2> = {
  Partitura: Music2,
  "Áudio": FileAudio,
  Stems: FileAudio,
  Mix: FileAudio,
  Master: FileAudio,
  Documentos: FileText,
};

function Tarefas() {
  const store = useStore();
  const [titulo, setTitulo] = useState("");
  const [projetoId, setProjetoId] = useState(store.projects[0]?.id ?? "");
  const [prioridade, setPrioridade] = useState<Priority>("Média");
  const [prazo, setPrazo] = useState(TODAY);

  const criar = () => {
    if (!titulo.trim()) {
      toast.error("Escreva o que precisa ser feito.");
      return;
    }
    store.addTask({ projectId: projetoId, title: titulo.trim(), priority: prioridade, dueDate: prazo });
    setTitulo("");
    toast.success("Tarefa criada.");
  };

  const abertas = store.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const concluidas = store.tasks.filter((t) => t.done);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Tarefas & Entregas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {abertas.length} tarefas abertas em {store.projects.length} projetos.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-5">
        <div className="grid gap-3 md:grid-cols-[2fr_1.5fr_1fr_1fr_auto]">
          <input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Nova tarefa..."
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <select
            value={projetoId}
            onChange={(event) => setProjetoId(event.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {store.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select
            value={prioridade}
            onChange={(event) => setPrioridade(event.target.value as Priority)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option>Baixa</option>
            <option>Média</option>
            <option>Alta</option>
          </select>
          <input
            type="date"
            value={prazo}
            onChange={(event) => setPrazo(event.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={criar}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ink-foreground"
          >
            <Plus className="size-4" /> Criar
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-4 text-base font-semibold">Em aberto</h2>
        <ul className="divide-y">
          {abertas.map((task) => {
            const projeto = store.projectById(task.projectId);
            return (
              <li key={task.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => store.toggleTask(task.id)}
                  className="size-4 accent-[var(--primary)]"
                  aria-label={`Concluir ${task.title}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{projeto?.title}</p>
                </div>
                <PriorityBadge priority={task.priority} />
                <span className="text-xs text-muted-foreground">{deadlineLabel(task.dueDate)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {concluidas.length > 0 && (
        <section className="rounded-xl border bg-card">
          <h2 className="border-b px-5 py-4 text-base font-semibold">Concluídas</h2>
          <ul className="divide-y">
            {concluidas.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-3">
                <input
                  type="checkbox"
                  checked
                  onChange={() => store.toggleTask(task.id)}
                  className="size-4 accent-[var(--primary)]"
                  aria-label={`Reabrir ${task.title}`}
                />
                <span className="flex-1 text-sm text-muted-foreground line-through">
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold">Arquivos por categoria</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categorias.map((categoria) => {
            const arquivos = store.files.filter((f) => f.category === categoria);
            const Icone = iconePorCategoria[categoria];
            return (
              <div key={categoria} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-2">
                  <Icone className="size-4 text-primary" />
                  <p className="text-sm font-medium">{categoria}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{arquivos.length}</span>
                </div>
                <ul className={cn("mt-3 space-y-2", arquivos.length === 0 && "text-muted-foreground")}>
                  {arquivos.length === 0 && <li className="text-sm">Nada por aqui ainda.</li>}
                  {arquivos.map((file) => (
                    <li key={file.id} className="text-sm">
                      <p className="truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.projectById(file.projectId)?.title} · {file.size} ·{" "}
                        {fullDate(file.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-ink p-6 text-ink-foreground">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 size-5" />
          <div>
            <h2 className="text-base font-semibold">Preparar entrega</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Escolha um projeto e monte a página-resumo com ficha musical, arquivos e situação
              financeira para enviar ao cliente.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {store.projects
            .filter((p) => p.status !== "Orçamento")
            .map((p) => (
              <Link
                key={p.id}
                to="/projetos/$id"
                params={{ id: p.id }}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20"
              >
                {p.title}
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
