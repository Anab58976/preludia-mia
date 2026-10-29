import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TODAY } from "@/lib/format";
import type { Payment } from "@/data/preludia";
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
  const store = useStore();
  const { payments, projects, projectById } = store;
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<Payment | undefined>(undefined);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0");
  const [date, setDate] = useState(TODAY);
  const [paymentStatus, setPaymentStatus] = useState<Payment["status"]>("A receber");
  const openEditor = (payment?: Payment) => {
    setEditing(payment); setProjectId(payment?.projectId ?? projects[0]?.id ?? ""); setDescription(payment?.description ?? "");
    setAmount(String(payment?.amount ?? 0)); setDate(payment?.date ?? TODAY); setPaymentStatus(payment?.status ?? "A receber"); setEditor(true);
  };
  const save = (event: FormEvent) => { event.preventDefault();
    if (!projectId || !description.trim() || Number(amount) <= 0) { toast.error("Preencha lançamento, projeto e valor válido."); return; }
    const fields = { projectId, description: description.trim(), amount: Number(amount), date, status: paymentStatus };
    if (editing) store.updatePayment(editing.id, fields); else store.addPayment(fields);
    setEditor(false); toast.success("Lançamento salvo.");
  };
  const monthlyRevenue = useMemo(() => {
    const groups = new Map<string, { month: string; faturado: number; aReceber: number }>();
    for (const payment of payments) { const key = payment.date.slice(0,7); const row = groups.get(key) ?? { month: key, faturado: 0, aReceber: 0 };
      if (payment.status === "Pago") row.faturado += payment.amount; else row.aReceber += payment.amount; groups.set(key, row); }
    return [...groups.values()].sort((a,b) => a.month.localeCompare(b.month)).slice(-9).map(row => ({...row, month: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${row.month}-01T12:00:00Z`))}));
  }, [payments]);

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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">Financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receitas e pendências ligadas aos seus projetos.
        </p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => { const csv = ["Projeto,Descrição,Valor,Data,Status", ...payments.map(p => [projectById(p.projectId)?.title ?? "", p.description, String(p.amount), p.date, p.status].map(v => `"${v.replaceAll(String.fromCharCode(34), String.fromCharCode(34,34))}"`).join(","))].join("\n"); const blob = new Blob(["\uFEFF" + csv], {type:"text/csv;charset=utf-8"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="preludia-financeiro.csv"; a.click(); URL.revokeObjectURL(url); }} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><Download className="size-4"/> Exportar CSV</button><button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm text-ink-foreground"><Plus className="size-4"/> Lançamento</button></div>
      </header>
      <Dialog open={editor} onOpenChange={setEditor}><DialogContent><DialogHeader><DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-3"><label className="block text-sm">Projeto<select required value={projectId} onChange={e => setProjectId(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2">{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label><label className="block text-sm">Descrição<input required value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2"/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">Valor (R$)<input required type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2"/></label><label className="text-sm">Data<input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2"/></label></div><label className="block text-sm">Situação<select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as Payment["status"])} className="mt-1 w-full rounded-lg border bg-background p-2"><option>Pago</option><option>A receber</option><option>Atrasado</option></select></label><button type="submit" className="w-full rounded-lg bg-ink px-4 py-2 text-sm text-ink-foreground">Salvar lançamento</button></form></DialogContent></Dialog>

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
                <button type="button" aria-label={`Editar ${payment.description}`} onClick={() => openEditor(payment)} className="rounded-lg border p-2"><Pencil className="size-3.5"/></button><button type="button" aria-label={`Excluir ${payment.description}`} onClick={() => { if (window.confirm("Excluir lançamento financeiro?")) store.deletePayment(payment.id); }} className="rounded-lg border p-2 text-destructive"><Trash2 className="size-3.5"/></button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
