import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CircleDollarSign, Clock3, TriangleAlert } from "lucide-react";

import { MiaAvatar } from "@/components/mia-avatar";
import { StatusBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { currency, daysUntil, deadlineLabel, shortDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Prelúdia" },
      {
        name: "description",
        content:
          "Visão geral dos seus projetos musicais, prazos, entregas e indicadores financeiros do mês.",
      },
      { property: "og:title", content: "Painel — Prelúdia" },
      {
        property: "og:description",
        content: "Projetos, prazos e finanças do seu estúdio em uma só tela.",
      },
    ],
  }),
  component: Painel,
});

function Painel() {
  const { projects, tasks, payments, clientById } = useStore();

  const emProducao = projects.filter((p) => p.status === "Em produção").length;
  const emRevisao = projects.filter((p) => p.status === "Em revisão").length;
  const concluidos = projects.filter((p) => p.status === "Concluído").length;
  const atrasados = projects.filter(
    (p) => p.status !== "Concluído" && daysUntil(p.deadline) < 0,
  ).length;

  const faturadoMes = payments
    .filter((p) => p.status === "Pago" && p.date.startsWith("2026-09"))
    .reduce((sum, p) => sum + p.amount, 0);
  const aReceber = payments
    .filter((p) => p.status !== "Pago")
    .reduce((sum, p) => sum + p.amount, 0);
  const ativos = projects.filter((p) => p.status !== "Concluído" && p.status !== "Orçamento").length;

  const proximos = [...projects]
    .filter((p) => p.status !== "Concluído")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  const tarefasUrgentes = tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Bom dia, Julia</p>
        <h1 className="mt-1 text-3xl font-semibold">Painel do estúdio</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Em produção", value: emProducao, hint: "projetos ativos na bancada" },
          { label: "Em revisão", value: emRevisao, hint: "aguardando ajustes finais" },
          { label: "Concluídos", value: concluidos, hint: "entregues neste ano" },
          { label: "Atrasados", value: atrasados, hint: "precisam de atenção", alerta: true },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              {card.alerta && card.value > 0 && (
                <TriangleAlert className="size-4 text-destructive" />
              )}
            </div>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-semibold">Próximos prazos</h2>
            <Link to="/projetos" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="divide-y">
            {proximos.map((project) => {
              const atrasado = daysUntil(project.deadline) < 0;
              return (
                <li key={project.id}>
                  <Link
                    to="/projetos/$id"
                    params={{ id: project.id }}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/60"
                  >
                    <div className="w-14 shrink-0 rounded-lg bg-secondary px-2 py-2 text-center">
                      <p className="text-sm font-semibold">{shortDate(project.deadline)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{project.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {clientById(project.clientId)?.name}
                      </p>
                    </div>
                    <span
                      className={
                        atrasado
                          ? "text-xs font-medium text-destructive"
                          : "text-xs text-muted-foreground"
                      }
                    >
                      {deadlineLabel(project.deadline)}
                    </span>
                    <StatusBadge status={project.status} className="hidden sm:inline-flex" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-ink p-5 text-ink-foreground">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <CircleDollarSign className="size-4" />
              Faturamento de setembro
            </div>
            <p className="mt-2 text-3xl font-semibold">{currency(faturadoMes)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-ink-muted">A receber</p>
                <p className="mt-1 font-medium">{currency(aReceber)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-ink-muted">Projetos ativos</p>
                <p className="mt-1 font-medium">{ativos}</p>
              </div>
            </div>
            <Link
              to="/financeiro"
              className="mt-4 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink-foreground"
            >
              Ver financeiro <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border bg-blue-soft/50 p-5">
            <div className="flex items-start gap-3">
              <MiaAvatar size={40} />
              <div>
                <p className="text-sm font-semibold">Mia sugere</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A trilha da Claraluz vence em 3 dias e tem um feedback sem resposta. Quer que eu
                  prepare o resumo da entrega?
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/feedbacks"
                className="rounded-lg bg-ink px-3 py-2 text-xs font-medium text-ink-foreground"
              >
                Analisar feedback
              </Link>
              <Link
                to="/tarefas"
                className="rounded-lg border bg-card px-3 py-2 text-xs font-medium"
              >
                Preparar entrega
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">Tarefas mais urgentes</h2>
          <Link to="/tarefas" className="text-sm text-primary hover:underline">
            Ver tudo
          </Link>
        </div>
        <ul className="divide-y">
          {tarefasUrgentes.map((task) => (
            <li key={task.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <Clock3 className="size-4 text-muted-foreground" />
              <span className="flex-1">{task.title}</span>
              <span className="text-xs text-muted-foreground">{deadlineLabel(task.dueDate)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
