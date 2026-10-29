import { useEffect, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { Project, MusicSheet } from "@/data/preludia";
import { toast } from "sonner";
export function MusicEditor({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { updateProject } = useStore();
  const [sheet, setSheet] = useState<MusicSheet>(project.sheet);
  const [instruments, setInstruments] = useState("");
  useEffect(() => { if (open) { setSheet(project.sheet); setInstruments(project.sheet.instrumentation.join(", ")); } }, [project, open]);
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
  const change = <K extends keyof MusicSheet>(key: K, value: MusicSheet[K]) => setSheet(old => ({ ...old, [key]: value }));
  const save = (e: FormEvent) => { e.preventDefault(); updateProject(project.id, { sheet: { ...sheet, bpm: Math.max(0, Number(sheet.bpm) || 0), instrumentation: instruments.split(",").map(s => s.trim()).filter(Boolean) } }); onOpenChange(false); toast.success("Ficha musical atualizada."); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar ficha musical</DialogTitle></DialogHeader>
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-3"><label className="text-sm">Tonalidade original<input className={field} value={sheet.originalKey} onChange={e => change("originalKey",e.target.value)}/></label><label className="text-sm">Tonalidade do arranjo<input className={field} value={sheet.arrangementKey} onChange={e => change("arrangementKey",e.target.value)}/></label></div>
      <div className="grid grid-cols-3 gap-3"><label className="text-sm">BPM<input type="number" min="0" max="400" className={field} value={sheet.bpm} onChange={e => change("bpm",Number(e.target.value))}/></label><label className="text-sm">Duração<input className={field} value={sheet.duration} onChange={e => change("duration",e.target.value)}/></label><label className="text-sm">Compasso<input className={field} value={sheet.timeSignature} onChange={e => change("timeSignature",e.target.value)}/></label></div>
      <label className="block text-sm">Instrumentação (separada por vírgulas)<textarea className={field} rows={2} value={instruments} onChange={e => setInstruments(e.target.value)}/></label>
      <label className="block text-sm">Estrutura musical<textarea className={field} rows={2} value={sheet.structure} onChange={e => change("structure",e.target.value)}/></label>
      <label className="block text-sm">Observações<textarea className={field} rows={3} value={sheet.notes} onChange={e => change("notes",e.target.value)}/></label>
      <button type="submit" className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ink-foreground">Salvar ficha musical</button>
    </form>
  </DialogContent></Dialog>;
}
