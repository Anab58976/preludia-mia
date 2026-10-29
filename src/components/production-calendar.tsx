import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
export function ProductionCalendar() {
  const { projects, tasks } = useStore();
  const [offset, setOffset] = useState(0);
  const month = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1), [offset]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dateKey = (d: number) => `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2, "0")}-${String(d).padStart(2,"0")}`;
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return <section className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-base font-semibold"><CalendarDays className="size-4 text-primary"/> Calendário de produção</h2><div className="flex items-center gap-2"><button type="button" aria-label="Mês anterior" onClick={() => setOffset(v=>v-1)} className="rounded-lg border p-2"><ChevronLeft className="size-4"/></button><span className="min-w-28 text-center text-sm capitalize">{new Intl.DateTimeFormat("pt-BR", {month:"long",year:"numeric"}).format(month)}</span><button type="button" aria-label="Próximo mês" onClick={() => setOffset(v=>v+1)} className="rounded-lg border p-2"><ChevronRight className="size-4"/></button></div></div>
    <p className="mb-4 mt-1 text-xs text-muted-foreground">Prazos de projetos e tarefas são atualizados automaticamente.</p>
    <div className="grid grid-cols-7 gap-1">{weekdays.map(d => <span className="pb-2 text-center text-xs font-semibold text-muted-foreground" key={d}>{d}</span>)}{Array.from({length: first}, (_,i) => <div key={`empty-${i}`}/>)}{Array.from({length},(_,i) => { const day=i+1, key=dateKey(day); const ps = projects.filter(p=>p.deadline===key && p.status!=="Concluído"); const ts=tasks.filter(t=>t.dueDate===key && !t.done); const hasAny=ps.length+ts.length>0; return <div key={key} className={`min-h-16 rounded-lg border p-1.5 sm:min-h-24 ${hasAny ? "bg-blue-soft/40" : "bg-secondary/20"}`}><p className="text-xs font-medium">{day}</p><div className="mt-1 space-y-1">{ps.slice(0,2).map(p=><Link key={p.id} to="/projetos/$id" params={{id:p.id}} title={p.title} className="block truncate rounded bg-primary/10 px-1 text-[10px] text-primary hover:underline">♪ {p.title}</Link>)}{ts.slice(0,2).map(t=><span title={t.title} className="block truncate rounded bg-secondary px-1 text-[10px]" key={t.id}>✓ {t.title}</span>)}{ps.length+ts.length>4&&<span className="text-[10px] text-muted-foreground">+{ps.length+ts.length-4}</span>}</div></div>; })}</div>
  </section>;
}
