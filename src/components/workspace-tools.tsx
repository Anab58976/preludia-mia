import { useRef, useState, type ChangeEvent } from "react";
import { DatabaseBackup, Download, Upload, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

export function WorkspaceTools() {
  const store = useStore(); const [open, setOpen] = useState(false); const inputRef = useRef<HTMLInputElement>(null);
  const saveBackup = () => {
    const { clients, projects, tasks, files, feedbacks, payments, comments } = store;
    const data = JSON.stringify({ clients, projects, tasks, files, feedbacks, payments, comments }, null, 2);
    const blob = new Blob([data], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `preludia-backup-${new Date().toLocaleDateString("en-CA")}.json`; a.click(); URL.revokeObjectURL(url);
    toast.success("Backup das informações exportado.");
  };
  const loadBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; event.target.value = "";
    try { const raw: unknown = JSON.parse(await file.text());
      if (!window.confirm("Importar o backup substitui os registros atuais deste navegador. Continuar?")) return;
      store.importWorkspace(raw as Parameters<typeof store.importWorkspace>[0]); toast.success("Backup restaurado."); setOpen(false);
    } catch { toast.error("O arquivo não contém um backup válido do Prelúdia."); }
  };
  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs hover:bg-secondary"><DatabaseBackup className="size-4"/> Dados e backup</button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Dados do estúdio</DialogTitle></DialogHeader>
      <div className="space-y-4 text-sm"><div className="rounded-lg border bg-blue-soft/30 p-3 text-muted-foreground"><p className="font-semibold text-foreground">Modo local de demonstração</p><p className="mt-1">As informações ficam neste navegador. Não existe sincronização entre aparelhos, conta de usuário ou banco online nesta versão. Os áudios ficam no IndexedDB local e não são incluídos no backup JSON.</p></div>
      <button type="button" onClick={saveBackup} className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-ink-foreground"><Download className="size-4"/> Exportar dados em JSON</button>
      <input type="file" accept="application/json,.json" ref={inputRef} className="hidden" onChange={loadBackup}/>
      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5"><Upload className="size-4"/> Restaurar dados do backup</button>
      <div className="rounded-lg border border-destructive/30 p-3"><p className="flex items-center gap-2 text-sm font-medium"><TriangleAlert className="size-4 text-destructive"/> Zona de cuidado</p><p className="my-2 text-xs text-muted-foreground">Limpar os registros não exclui os arquivos binários do navegador; evite usar o recurso com projetos reais sem salvar cópias.</p><button type="button" className="rounded-lg border border-destructive px-3 py-2 text-xs text-destructive" onClick={() => { if (window.confirm("Tem certeza? Todos os cadastros, projetos, tarefas e pagamentos locais serão apagados.")) { store.resetWorkspace(); setOpen(false); toast.success("Registros locais limpos."); } }}>Limpar registros locais</button></div>
      </div>
    </DialogContent></Dialog>
  </>;
}
