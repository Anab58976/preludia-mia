import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

import { useStore } from "@/lib/store";
import { currency, fullDate } from "@/lib/format";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — Prelúdia" },
      {
        name: "description",
        content:
          "Cadastro de clientes com contatos, histórico de projetos, total faturado e feedbacks.",
      },
      { property: "og:title", content: "Clientes — Prelúdia" },
      {
        property: "og:description",
        content: "Todo o relacionamento com maestros, produtoras e artistas em um lugar só.",
      },
    ],
  }),
  component: Clientes,
});

function Clientes() {
  const { clients, projects } = useStore();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {clients.length} clientes ativos no seu caderno.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {clients.map((client) => {
          const doCliente = projects.filter((p) => p.clientId === client.id);
          const faturado = doCliente.reduce((sum, p) => sum + p.paid, 0);
          return (
            <Link
              key={client.id}
              to="/clientes/$id"
              params={{ id: client.id }}
              className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-medium group-hover:text-primary">{client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {client.contact} · {client.city}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  Desde {fullDate(client.since)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {client.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {client.phone}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/70 p-3">
                  <p className="text-xs text-muted-foreground">Projetos</p>
                  <p className="font-medium">{doCliente.length}</p>
                </div>
                <div className="rounded-lg bg-secondary/70 p-3">
                  <p className="text-xs text-muted-foreground">Total faturado</p>
                  <p className="font-medium">{currency(faturado)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
