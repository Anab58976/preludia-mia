import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { TODAY } from "@/lib/format";
import type { Project } from "@/data/preludia";

export function ProjectEditor({ open, onOpenChange, project }: { open: boolean; onOpenChange: (v: boolean) => void; project?: Project }) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState("");
  const [deadline, setDeadline] = useState(TODAY);
  const [budget, setBudget] = useState("0");
  const [progress, setProgress] = useState("0");
  useEffect(() => {
    if (!open) return;
    setTitle(project?.title ?? ""); setClientId(project?.clientId ?? store.clients[0]?.id ?? "");
    setType(project?.type ?? ""); setDeadline(project?.deadline ?? TODAY);
    setBudget(String(project?.budget ?? 0)); setProgress(String(project?.progress ?? 0));
  }, [open, project, store.clients]);
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!clientId || !title.trim() || !deadline || Number(budget) < 0) { toast.error("Preencha os campos obrigatórios."); return; }
    const fields = { title: title.trim(), clientId, type: type.trim() || "Projeto musical", deadline, budget: Number(budget) };
    if (project) store.updateProject(project.id, { ...fields, progress: Math.min(100, Math.max(0, Number(progress) || 0)) });
    else store.addProject(fields);
    toast.success(project ? "Projeto atualizado." : "Projeto criado."); onOpenChange(false);
  };
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{project ? "Editar projeto" : "Novo projeto musical"}</DialogTitle></DialogHeader>
      {store.clients.length === 0 ? <p className="text-sm text-muted-foreground">Cadastre um cliente antes de criar um projeto.</p> : <form onSubmit={save} className="space-y-4">
        <label className="block text-sm">Nome do projeto *<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} className={field} placeholder="Ex.: Trilha do curta-metragem" /></label>
        <label className="block text-sm">Cliente *<select required value={clientId} onChange={e => setClientId(e.target.value)} className={field}>{store.clients.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
        <label className="block text-sm">Tipo de trabalho<input value={type} onChange={e => setType(e.target.value)} className={field} placeholder="Arranjo, trilha, masterização..." /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Prazo *<input required type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={field} /></label><label className="block text-sm">Orçamento (R$) *<input required type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} className={field} /></label></div>
        {project && <label className="block text-sm">Progresso (%)<input type="number" min="0" max="100" value={progress} onChange={e => setProgress(e.target.value)} className={field} /></label>}
        <button type="submit" className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ink-foreground">{project ? "Salvar alterações" : "Criar projeto"}</button>
      </form>}
    </DialogContent>
  </Dialog>;
}
