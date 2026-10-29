import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, Headphones, Paperclip, Trash2, Upload, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { downloadFile, getBlob, removeBlob, saveBlob } from "@/lib/file-storage";
import { type Project, type ProjectFile, type FileCategory } from "@/data/preludia";
import { fullDate } from "@/lib/format";
const categories: FileCategory[] = ["Partitura", "Áudio", "Stems", "Mix", "Master", "Documentos"];
const audioCategories: FileCategory[] = ["Áudio", "Stems", "Mix", "Master"];
const maxSize = 35 * 1024 * 1024;
export function FileUpload({ projectId }: { projectId: string }) {
  const store = useStore();
  const [category, setCategory] = useState<FileCategory>("Áudio"); const [busy, setBusy] = useState(false);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files ?? []); event.target.value = "";
    setBusy(true);
    for (const file of fileList) {
      if (file.size > maxSize) { toast.error(`${file.name}: máximo de 35 MB por arquivo.`); continue; }
      try {
        const metadata = store.addFile({ projectId, name: file.name, category, size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, updatedAt: new Date().toLocaleDateString("en-CA") });
        try { await saveBlob(metadata.id, file); toast.success(`${file.name} salvo neste navegador.`); } catch(error) { store.deleteFile(metadata.id); throw error; }
      } catch { toast.error(`Não foi possível guardar ${file.name}.`); }
    }
    setBusy(false);
  };
  return <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-secondary/30 p-4">
    <Upload className="size-5 text-primary"/>
    <select aria-label="Categoria do arquivo" value={category} onChange={e => setCategory(e.target.value as FileCategory)} className="rounded-lg border bg-background px-3 py-2 text-sm">{categories.map(c => <option key={c}>{c}</option>)}</select>
    <label className="cursor-pointer rounded-lg bg-ink px-3 py-2 text-sm font-medium text-ink-foreground">{busy ? "Salvando…" : "Escolher arquivos"}<input type="file" multiple accept=".mp3,.wav,.flac,.ogg,.m4a,.aac,.mid,.midi,.pdf,.zip,.txt,.doc,.docx,.png,.jpg" className="sr-only" onChange={upload} disabled={busy}/></label>
    <p className="text-xs text-muted-foreground">Até 35 MB por arquivo. Guardados apenas neste navegador.</p>
  </div>;
}
export function MediaPlayer({ file }: { file: ProjectFile }) {
  const store = useStore(); const [url, setUrl] = useState<string | null>(null); const [missing, setMissing] = useState(false);
  const player = useRef<HTMLAudioElement>(null);
  const notes = store.comments.filter(c => c.fileId === file.id).sort((a,b) => a.seconds-b.seconds);
  useEffect(() => { let objectUrl: string | undefined; let active = true;
    getBlob(file.id).then(blob => { if (!active) return; if (blob) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } else setMissing(true); }).catch(() => setMissing(true));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [file.id]);
  if (!audioCategories.includes(file.category) && !/\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(file.name)) return null;
  if (missing) return <p className="text-xs text-muted-foreground">Áudio demonstrativo, sem mídia anexada.</p>;
  return <div className="mt-3 space-y-2">{url ? <audio ref={player} className="h-10 w-full" controls preload="metadata" src={url} aria-label={`Ouvir ${file.name}`}/> : <p className="text-xs">Carregando áudio…</p>}
    <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Headphones className="size-3"/> Prévia local</span>
    {url && <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => { const text = window.prompt("Comentário neste trecho do áudio:"); if (text?.trim()) { store.addComment({ fileId: file.id, projectId: file.projectId, seconds: Math.round(player.current?.currentTime ?? 0), text: text.trim() }); toast.success("Comentário salvo no trecho."); } }}>+ Comentar trecho</button>}</div>
    {notes.length > 0 && <ul className="space-y-1 rounded-lg bg-secondary/40 p-2">{notes.map(n => <li key={n.id} className="flex items-start gap-2 text-xs"><button type="button" className="shrink-0 text-primary underline" onClick={() => { if (player.current) { player.current.currentTime = n.seconds; void player.current.play(); } }}>{Math.floor(n.seconds/60).toString().padStart(2,"0")}:{(n.seconds%60).toString().padStart(2,"0")}</button><span className="flex-1">{n.text}</span><button type="button" aria-label="Excluir comentário" onClick={() => store.deleteComment(n.id)} className="text-destructive">×</button></li>)}</ul>}
  </div>;
}
export function ProjectFiles({ project }: { project: Project }) {
  const store = useStore(); const files = store.files.filter(f => f.projectId === project.id);
  const audioFiles = files.filter(f => audioCategories.includes(f.category) || /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(f.name));
  const [leftId, setLeftId] = useState(""); const [rightId, setRightId] = useState("");
  const remove = async (file: ProjectFile) => { if (!window.confirm(`Excluir ${file.name}?`)) return; await removeBlob(file.id).catch(() => undefined); store.deleteFile(file.id); toast.success("Arquivo excluído."); };
  const download = async (file: ProjectFile) => { try { await downloadFile(file.id, file.name); } catch(error) { toast.error(error instanceof Error ? error.message : "Arquivo não disponível."); } };
  return <section className="space-y-4"><FileUpload projectId={project.id}/>
    {files.length === 0 && <p className="rounded-xl border p-5 text-sm text-muted-foreground">Adicione sua primeira partitura, áudio ou documento.</p>}
    {audioFiles.length > 1 && <div className="rounded-xl border bg-card p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><GitCompareArrows className="size-4 text-primary"/> Comparar áudios / versões</h3><p className="mt-1 text-xs text-muted-foreground">Selecione dois arquivos para ouvir e comparar as versões.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{[leftId, rightId].map((selected, index) => <div key={index}><label className="text-xs text-muted-foreground">Versão {index + 1}</label><select value={selected} onChange={e => index === 0 ? setLeftId(e.target.value) : setRightId(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"><option value="">Escolher áudio</option>{audioFiles.map(f => <option key={f.id} value={f.id}>{f.name} · v{f.version ?? 1}</option>)}</select>{selected && audioFiles.some(f=>f.id === selected) && <MediaPlayer file={audioFiles.find(f=>f.id === selected)!}/>}</div>)}</div></div>}
    <div className="grid gap-4 sm:grid-cols-2">{files.map(file => <div key={file.id} className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3"><Paperclip className="mt-0.5 size-4 shrink-0 text-muted-foreground"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{file.category} · versão {file.version ?? 1} · {file.size} · {fullDate(file.updatedAt)}</p></div></div>
      <MediaPlayer file={file}/>
      <div className="mt-3 flex gap-2"><button onClick={() => download(file)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"><Download className="size-3.5"/> Baixar</button><button onClick={() => remove(file)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-destructive"><Trash2 className="size-3.5"/> Excluir</button></div>
    </div>)}</div>
  </section>;
}
