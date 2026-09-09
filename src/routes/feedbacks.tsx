import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Quote, Save } from "lucide-react";
import { toast } from "sonner";

import { MiaAvatar } from "@/components/mia-avatar";
import { analisarFeedback, type FeedbackAnalysis } from "@/lib/feedback.functions";
import { useStore } from "@/lib/store";
import { fullDate, TODAY } from "@/lib/format";

export const Route = createFileRoute("/feedbacks")({
  head: () => ({
    meta: [
      { title: "Feedbacks com a Mia — Prelúdia" },
      {
        name: "description",
        content:
          "Cole a mensagem do cliente e a Mia interpreta as alterações pedidas, resume e salva no projeto.",
      },
      { property: "og:title", content: "Feedbacks com a Mia — Prelúdia" },
      {
        property: "og:description",
        content: "Transforme áudios e mensagens de WhatsApp em uma lista clara de ajustes.",
      },
    ],
  }),
  component: Feedbacks,
});

function Feedbacks() {
  const store = useStore();
  const analisar = useServerFn(analisarFeedback);
  const [texto, setTexto] = useState("");
  const [projetoId, setProjetoId] = useState(store.projects[0]?.id ?? "");
  const [autor, setAutor] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [analise, setAnalise] = useState<FeedbackAnalysis | null>(null);

  const projeto = store.projectById(projetoId);

  const executar = async () => {
    if (texto.trim().length < 5) {
      toast.error("Cole a mensagem do cliente para a Mia analisar.");
      return;
    }
    setCarregando(true);
    setAnalise(null);
    try {
      const resultado = await analisar({
        data: { texto, projeto: projeto?.title ?? "Projeto" },
      });
      setAnalise(resultado);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "A Mia não conseguiu analisar agora.",
      );
    } finally {
      setCarregando(false);
    }
  };

  const salvar = () => {
    if (!analise || !projeto) return;
    store.addFeedback({
      projectId: projeto.id,
      author: autor.trim() || store.clientById(projeto.clientId)?.contact || "Cliente",
      source: "Mensagem colada",
      date: TODAY,
      original: texto,
      summary: analise.resumo,
      changes: analise.alteracoes,
      urgency: analise.urgencia,
      tone: analise.tom,
    });
    toast.success("Feedback salvo no projeto.");
    setTexto("");
    setAnalise(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Feedbacks com a Mia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole a mensagem do cliente — WhatsApp, e-mail, o que for — e receba os ajustes
          organizados.
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

          <label className="mt-4 block text-sm">
            <span className="text-muted-foreground">Mensagem do cliente</span>
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              rows={10}
              placeholder="Ex: Oi! Ouvi aqui e ficou ótimo, só acho que o refrão está baixo demais e o final corta muito seco..."
              className="mt-1 w-full resize-y rounded-lg border bg-background p-3 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={executar}
            disabled={carregando}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ink-foreground disabled:opacity-60"
          >
            {carregando ? <Loader2 className="size-4 animate-spin" /> : <MiaAvatar size={18} />}
            {carregando ? "A Mia está lendo..." : "Analisar com a Mia"}
          </button>
        </section>

        <section className="rounded-xl border bg-card p-5">
          {!analise && !carregando && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
              <MiaAvatar size={64} />
              <p className="text-sm text-muted-foreground">
                A leitura da Mia aparece aqui: resumo, lista de alterações, urgência e uma resposta
                pronta para enviar.
              </p>
            </div>
          )}

          {carregando && (
            <div className="flex h-full items-center justify-center py-12 text-sm text-muted-foreground">
              Interpretando a mensagem...
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
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
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
