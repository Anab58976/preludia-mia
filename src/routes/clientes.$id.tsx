import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

import { MiaAvatar } from "@/components/mia-avatar";
import { StatusBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { currency, fullDate } from "@/lib/format";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Cliente — Prelúdia" },
      {
        name: "description",
        content: "Histórico de projetos, total faturado, contatos e feedbacks do cliente.",
      },
      { property: "og:title", content: "Cliente — Prelúdia" },
      {
        property: "og:description",
        content: "Tudo o que você já produziu para este cliente, reunido em uma ficha.",
      },
    ],
  }),
  component: DetalheCliente,
});

function DetalheCliente() {
  const { id } = Route.useParams();
  const store = useStore();

  const client = store.clientById(id);
  if (!client) throw notFound();

  const projetos = store.projects.filter((p) => p.clientId === client.id);
  const idsProjetos = new Set(projetos.map((p) => p.id));
  const feedbacks = store.feedbacks.filter((f) => idsProjetos.has(f.projectId));
  const faturado = projetos.reduce((sum, p) => sum + p.paid, 0);
  const aReceber = projetos.reduce((sum, p) => sum + (p.budget - p.paid), 0);

  return (
    <div className="space-y-6">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <header className="rounded-xl border bg-card p-6">
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contato principal: {client.contact} · cliente desde {fullDate(client.since)}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5" /> {client.email}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5" /> {client.phone}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {client.city}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Projetos realizados", value: String(projetos.length) },
            { label: "Total faturado", value: currency(faturado) },
            { label: "Saldo em aberto", value: currency(aReceber) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-secondary/70 p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-4 text-base font-semibold">Histórico de projetos</h2>
        <ul className="divide-y">
          {projetos.map((project) => (
            <li key={project.id}>
              <Link
                to="/projetos/$id"
                params={{ id: project.id }}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.type} · entrega {fullDate(project.deadline)}
                  </p>
                </div>
                <span className="text-sm">{currency(project.budget)}</span>
                <StatusBadge status={project.status} className="hidden sm:inline-flex" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Feedbacks</h2>
        {feedbacks.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum feedback registrado deste cliente.</p>
        )}
        {feedbacks.map((feedback) => (
          <article key={feedback.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <p className="font-medium">{feedback.source}</p>
              <span className="text-xs text-muted-foreground">{fullDate(feedback.date)}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{feedback.original}</p>
            <div className="mt-3 flex items-start gap-3 rounded-lg bg-blue-soft/50 p-3">
              <MiaAvatar size={26} />
              <p className="text-sm">{feedback.summary}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
