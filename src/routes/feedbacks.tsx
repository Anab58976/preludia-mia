import { useCallback, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Quote, Save, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { MiaAvatar } from "@/components/mia-avatar";
import { analisarFeedback, type FeedbackAnalysis } from "@/lib/feedback.functions";
import { useStore } from "@/lib/store";
import { fullDate, TODAY } from "@/lib/format";
import {
  formatoDoArquivo,
  lerComoBase64,
  useAudioRecorder,
  MENSAGEM_FORMATO_INVALIDO,
  type AudioCapturado,
} from "@/lib/use-audio-input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feedbacks")({
  head: () => ({
    meta: [
      { title: "Feedbacks em áudio com a Mia — Prelúdia" },
      {
        name: "description",
        content:
          "Grave ou envie o áudio do cliente e a Mia transcreve, lista as alterações pedidas e salva no projeto.",
      },
      { property: "og:title", content: "Feedbacks em áudio com a Mia — Prelúdia" },
      {
        property: "og:description",
        content: "Transforme áudios de WhatsApp em uma lista clara de ajustes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feedbacks,
});

function cronometro(segundos: number) {
  const m = String(Math.floor(segundos / 60)).padStart(2, "0");
  const s = String(segundos % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function Feedbacks() {
  const store = useStore();
  const analisar = useServerFn(analisarFeedback);
  const [audio, setAudio] = useState<AudioCapturado | null>(null);
  const [projetoId, setProjetoId] = useState(store.projects[0]?.id ?? "");
  const [autor, setAutor] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [analise, setAnalise] = useState<FeedbackAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const receberAudio = useCallback((novo: AudioCapturado) => {
    setAnalise(null);
    setAudio(novo);
  }, []);

  const gravador = useAudioRecorder(receberAudio);
  const projeto = store.projectById(projetoId);

  const escolherArquivo = async (file: File | undefined) => {
    if (!file) return;
    const formato = formatoDoArquivo(file);
    if (!formato) {
      toast.error(MENSAGEM_FORMATO_INVALIDO);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("O áudio precisa ter no máximo 20 MB.");
      return;
    }
    try {
      const base64 = await lerComoBase64(file);
      receberAudio({ url: URL.createObjectURL(file), base64, formato, nome: file.name });
    } catch {
      toast.error("Não foi possível ler esse arquivo de áudio.");
    }
  };

  const executar = async () => {
    if (!audio) {
      toast.error("Grave ou envie um áudio para a Mia ouvir.");
      return;
    }
    setCarregando(true);
    setAnalise(null);
    try {
      const resultado = await analisar({
        data: {
          audioBase64: audio.base64,
          formato: audio.formato,
          projeto: projeto?.title ?? "Projeto",
        },
      });
      setAnalise(resultado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A Mia não conseguiu ouvir agora.");
    } finally {
      setCarregando(false);
    }
  };

  const salvar = () => {
    if (!analise || !projeto || !audio) return;
    store.addFeedback({
      projectId: projeto.id,
      author: autor.trim() || store.clientById(projeto.clientId)?.contact || "Cliente",
      source: "Áudio",
      date: TODAY,
      original: analise.transcricao,
      audioUrl: audio.url,
      summary: analise.resumo,
      changes: analise.alteracoes,
      urgency: analise.urgencia,
      tone: analise.tom,
    });
    toast.success("Feedback em áudio salvo no projeto.");
    setAudio(null);
    setAnalise(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Feedbacks em áudio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grave pelo microfone ou envie o áudio do cliente (MP3, WAV, M4A ou OGG) — a Mia ouve e
          organiza os ajustes.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-muted-foreground">Projeto</span>
              <select
                value={projetoId}
                onChange={(event) => setProjetoId(event.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {store.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Quem enviou</span>
              <input
                value={autor}
                onChange={(event) => setAutor(event.target.value)}
                placeholder={store.clientById(projeto?.clientId ?? "")?.contact ?? "Cliente"}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => (gravador.gravando ? gravador.parar() : gravador.iniciar())}
              disabled={!gravador.suportado}
              aria-pressed={gravador.gravando}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
                gravador.gravando && "border-destructive text-destructive",
              )}
            >
              {gravador.gravando ? (
                <Square className="size-4 animate-pulse" aria-hidden />
              ) : (
                <Mic className="size-4" aria-hidden />
              )}
              {gravador.gravando
                ? `Parar gravação · ${cronometro(gravador.segundos)}`
                : "Gravar áudio"}
            </button>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium"
            >
              <Upload className="size-4" aria-hidden /> Enviar arquivo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg"
              className="sr-only"
              onChange={(event) => {
                void escolherArquivo(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
            {!gravador.suportado
              ? "Este navegador não grava áudio — envie um arquivo MP3, WAV, M4A ou OGG."
              : gravador.erro
                ? gravador.erro
                : gravador.gravando
                  ? "Gravando... fale normalmente e clique em parar quando terminar."
                  : "Formatos aceitos para envio: MP3, WAV, M4A e OGG (até 20 MB)."}
          </p>

          {audio && (
            <div className="mt-4 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{audio.nome}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAudio(null);
                    setAnalise(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden /> Remover
                </button>
              </div>
              <audio controls src={audio.url} className="mt-3 w-full">
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          )}

          <button
            type="button"
            onClick={executar}
            disabled={carregando || !audio}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            {carregando ? <Loader2 className="size-4 animate-spin" /> : <MiaAvatar size={18} />}
            {carregando ? "A Mia está ouvindo..." : "Analisar com a Mia"}
          </button>
        </section>

        <section className="rounded-xl border bg-card p-5">
          {!analise && !carregando && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
              <MiaAvatar size={64} />
              <p className="text-sm text-muted-foreground">
                A leitura da Mia aparece aqui: transcrição, resumo, lista de alterações, urgência e
                uma resposta pronta para enviar.
              </p>
            </div>
          )}

          {carregando && (
            <div className="flex h-full items-center justify-center py-12 text-sm text-muted-foreground">
              Ouvindo o áudio...
            </div>
          )}

          {analise && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MiaAvatar size={36} />
                <div>
                  <p className="text-sm font-semibold">Resumo da Mia</p>
                  <p className="mt-1 text-sm">{analise.resumo}</p>
                </div>
              </div>

              {analise.transcricao && (
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Transcrição do áudio
                  </p>
                  <p className="mt-2 rounded-lg bg-secondary/70 p-3 text-sm">
                    {analise.transcricao}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  Alterações pedidas
                </p>
                <ul className="mt-2 space-y-2">
                  {analise.alteracoes.map((item) => (
                    <li key={item} className="rounded-lg bg-secondary/70 px-3 py-2 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-full bg-warning-soft px-3 py-1">
                  Urgência: {analise.urgencia}
                </span>
                <span className="rounded-full bg-blue-soft px-3 py-1">Tom: {analise.tom}</span>
              </div>

              {analise.respostaSugerida && (
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Resposta sugerida
                  </p>
                  <p className="mt-2 flex gap-2 rounded-lg border bg-background p-3 text-sm">
                    <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {analise.respostaSugerida}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={salvar}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <Save className="size-4" /> Salvar no projeto
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Feedbacks registrados</h2>
        {store.feedbacks.map((feedback) => (
          <article key={feedback.id} className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium">
                {store.projectById(feedback.projectId)?.title} · {feedback.author}
              </p>
              <span className="text-xs text-muted-foreground">
                {feedback.source} · {fullDate(feedback.date)}
              </span>
            </div>
            {feedback.audioUrl && (
              <audio controls src={feedback.audioUrl} className="mt-3 w-full">
                Seu navegador não suporta reprodução de áudio.
              </audio>
            )}
            <p className="mt-2 text-sm">{feedback.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {feedback.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
