import { createFileRoute } from "@tanstack/react-router";
import { CloudUpload, MessageCircle, Receipt, Share2 } from "lucide-react";

import { MiaAvatar } from "@/components/mia-avatar";
import { roadmap } from "@/data/preludia";

export const Route = createFileRoute("/em-breve")({
  head: () => ({
    meta: [
      { title: "Em Breve — Prelúdia" },
      {
        name: "description",
        content:
          "As próximas integrações da Prelúdia: bot de WhatsApp, Dropbox e Google Drive, emissão de NF e publicação social.",
      },
      { property: "og:title", content: "Em Breve — Prelúdia" },
      {
        property: "og:description",
        content: "O que vem por aí na plataforma dos profissionais da música.",
      },
    ],
  }),
  component: EmBreve,
});

const icones = [MessageCircle, CloudUpload, Receipt, Share2];

function EmBreve() {
  return (
    <div className="space-y-8">
      <header className="rounded-xl border bg-ink p-8 text-ink-foreground">
        <div className="flex items-start gap-4">
          <MiaAvatar size={56} />
          <div>
            <h1 className="text-3xl font-semibold">Em breve na Prelúdia</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Estamos construindo as integrações que tiram o trabalho repetitivo do seu dia: receber
              pedidos, sincronizar arquivos, emitir nota e divulgar o resultado.
            </p>
          </div>
        </div>
        <div className="staff-lines mt-8 h-6 opacity-30" aria-hidden />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {roadmap.map((item, index) => {
          const Icone = icones[index % icones.length];
          return (
            <article key={item.title} className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-soft">
                  <Icone className="size-5 text-primary" />
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">{item.tag}</span>
              </div>
              <h2 className="mt-4 text-lg font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              <p className="mt-4 text-xs tracking-wide text-muted-foreground uppercase">
                Previsão: {item.eta}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
