import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { monthlyRevenue } from "@/data/preludia";
import { useStore } from "@/lib/store";
import { currency, fullDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Prelúdia" },
      {
        name: "description",
        content:
          "Receitas, valores a receber, status de pagamento e métricas de produção do seu estúdio.",
      },
      { property: "og:title", content: "Financeiro — Prelúdia" },
      {
        property: "og:description",
        content: "Acompanhe faturamento, pendências e produção mês a mês.",
      },
    ],
  }),
  component: Financeiro,
});

const statusStyles: Record<string, string> = {
  Pago: "bg-success-soft text-foreground",
  "A receber": "bg-blue-soft text-accent-foreground",
  Atrasado: "bg-danger-soft text-destructive",
};

function Financeiro() {
  const { payments, projects, projectById } = useStore();

  const recebido = payments.filter((p) => p.status === "Pago").reduce((s, p) => s + p.amount, 0);
  const aReceber = payments.filter((p) => p.status === "A receber").reduce((s, p) => s + p.amount, 0);
  const atrasado = payments.filter((p) => p.status === "Atrasado").reduce((s, p) => s + p.amount, 0);

  const porStatus = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const cores = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--muted-foreground)",
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receitas e pendências ligadas aos seus projetos.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Recebido", value: recebido },
          { label: "A receber", value: aReceber },
          { label: "Em atraso", value: atrasado },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{currency(item.value)}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Faturamento por mês</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} />
                <Tooltip
                  formatter={(value: number) => currency(value)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
                <Legend />
                <Bar dataKey="faturado" name="Faturado" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="aReceber" name="A receber" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Produção por status</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {porStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={cores[index % cores.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-4 text-base font-semibold">Lançamentos</h2>
        <ul className="divide-y">
          {[...payments]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{payment.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {projectById(payment.projectId)?.title} · {fullDate(payment.date)}
                  </p>
                </div>
                <span className="text-sm font-medium">{currency(payment.amount)}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs",
                    statusStyles[payment.status],
                  )}
                >
                  {payment.status}
                </span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
