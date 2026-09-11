import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CircleDollarSign,
  FileMusic,
  ListChecks,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";

import { MiaAvatar } from "@/components/mia-avatar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prelúdia — gestão para quem vive de música" },
      {
        name: "description",
        content:
          "Organize projetos musicais, prazos, clientes e finanças em um só lugar, com a assistente Mia analisando feedbacks e resumindo entregas.",
      },
      { property: "og:title", content: "Prelúdia — gestão para quem vive de música" },
      {
        property: "og:description",
        content:
          "Projetos, ficha musical, feedbacks e financeiro num só lugar, com a assistente Mia.",
      },
    ],
  }),
  component: Landing,
});

const recursos = [
  {
    icon: FileMusic,
    title: "Ficha musical completa",
    text: "Tonalidade, BPM, compasso, instrumentação e estrutura salvos em cada projeto.",
  },
  {
    icon: MessageSquareQuote,
    title: "Feedbacks traduzidos pela Mia",
    text: "Cole a mensagem do cliente e receba um resumo objetivo das alterações pedidas.",
  },
  {
    icon: ListChecks,
    title: "Tarefas e entregas",
    text: "Prazos, arquivos por categoria e um resumo pronto para enviar ao cliente.",
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro claro",
    text: "Faturamento do mês, valores a receber e status de pagamento por projeto.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <MiaAvatar size={30} />
          <p className="font-display text-lg font-semibold">Prelúdia</p>
        </div>
        <Link
          to="/comecar"
          className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Entrar
        </Link>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 lg:px-8 lg:pt-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-soft/70 px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" aria-hidden />
            Com a assistente Mia
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-semibold sm:text-5xl">
            O estúdio inteiro organizado: projetos, prazos, clientes e dinheiro.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Feito para compositores, maestros, produtores e arranjadores — e também para quem
            encomenda uma obra e quer acompanhar cada etapa com clareza.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/comecar"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              Começar agora
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/painel"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Ver uma demonstração
            </Link>
          </div>
          <div className="staff-lines mt-12 h-10 opacity-60" aria-hidden />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
          <h2 className="text-2xl font-semibold">Tudo que um projeto musical exige</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recursos.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border bg-card p-5">
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold">Para quem produz</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Controle a fila de arranjos, o andamento de cada obra, os arquivos entregues e o que
                ainda falta receber.
              </p>
              <Link
                to="/comecar"
                search={{ perfil: "produtor" }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                Criar conta de profissional
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </article>
            <article className="rounded-2xl border bg-blue-soft/50 p-6">
              <h2 className="text-lg font-semibold">Para quem encomenda</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Acompanhe o andamento da sua obra, envie observações e receba as entregas
                organizadas, sem correr atrás por mensagem.
              </p>
              <Link
                to="/comecar"
                search={{ perfil: "cliente" }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                Criar conta de cliente
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t px-5 py-8 text-center text-xs text-muted-foreground lg:px-8">
        Prelúdia — gestão para profissionais da música e do audiovisual.
      </footer>
    </div>
  );
}
