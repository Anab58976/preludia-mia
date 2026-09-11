import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Music4, UserRound } from "lucide-react";
import { useState } from "react";

import { MiaAvatar } from "@/components/mia-avatar";

type Perfil = "produtor" | "cliente";

export const Route = createFileRoute("/comecar")({
  validateSearch: (search: Record<string, unknown>): { perfil?: Perfil } => {
    const perfil = search["perfil"];
    return perfil === "produtor" || perfil === "cliente" ? { perfil } : {};
  },
  head: () => ({
    meta: [
      { title: "Criar conta — Prelúdia" },
      {
        name: "description",
        content:
          "Comece no Prelúdia: escolha se você produz música ou encomenda projetos e conheça a plataforma em poucos passos.",
      },
      { property: "og:title", content: "Criar conta — Prelúdia" },
      {
        property: "og:description",
        content: "Escolha seu perfil, conheça a plataforma e entre no seu painel.",
      },
    ],
  }),
  component: Comecar,
});

const introducao: Record<Perfil, { titulo: string; itens: string[] }> = {
  produtor: {
    titulo: "Como o Prelúdia funciona para quem produz",
    itens: [
      "Cadastre cada obra com ficha musical: tonalidade, BPM, compasso, instrumentação e estrutura.",
      "Acompanhe o fluxo Orçamento → Aprovado → Em produção → Revisão → Concluído.",
      "Cole os áudios e mensagens do cliente e deixe a Mia resumir as alterações pedidas.",
      "Veja faturamento do mês, valores a receber e prazos apertados na primeira tela.",
    ],
  },
  cliente: {
    titulo: "Como o Prelúdia funciona para quem encomenda",
    itens: [
      "Acompanhe em que etapa a sua obra está, sem precisar perguntar.",
      "Envie observações por escrito ou por voz e receba um resumo do que foi combinado.",
      "Receba partituras, áudios e mixagens organizados por tipo de arquivo.",
      "Consulte valores, pagamentos feitos e o saldo de cada projeto.",
    ],
  },
};

function Comecar() {
  const { perfil: perfilInicial } = Route.useSearch();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(perfilInicial ?? null);
  const [passo, setPasso] = useState(perfilInicial ? 2 : 1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  function escolher(valor: Perfil) {
    setPerfil(valor);
    setPasso(2);
  }

  function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "preludia-conta",
        JSON.stringify({ nome, email, perfil }),
      );
    }
    navigate({ to: "/painel" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <MiaAvatar size={28} />
          <span className="font-display text-lg font-semibold">Prelúdia</span>
        </Link>
        <p className="text-xs text-muted-foreground">Passo {passo} de 3</p>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">
        {passo === 1 ? (
          <section>
            <h1 className="text-3xl font-semibold">Como você vai usar o Prelúdia?</h1>
            <p className="mt-2 text-muted-foreground">
              Escolha o seu perfil para começarmos do jeito certo.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => escolher("produtor")}
                className="rounded-2xl border bg-card p-6 text-left transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Music4 className="size-6 text-primary" aria-hidden />
                <h2 className="mt-3 font-semibold">Eu produzo música</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Compositor, maestro, arranjador ou produtor musical.
                </p>
              </button>
              <button
                type="button"
                onClick={() => escolher("cliente")}
                className="rounded-2xl border bg-card p-6 text-left transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <UserRound className="size-6 text-primary" aria-hidden />
                <h2 className="mt-3 font-semibold">Eu quero encomendar um projeto</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Igreja, produtora, artista ou empresa contratando uma obra.
                </p>
              </button>
            </div>
          </section>
        ) : null}

        {passo === 2 && perfil ? (
          <section>
            <h1 className="text-3xl font-semibold">{introducao[perfil].titulo}</h1>
            <ul className="mt-6 space-y-3">
              {introducao[perfil].itens.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl border bg-card p-4 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPasso(1)}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </button>
              <button
                type="button"
                onClick={() => setPasso(3)}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
              >
                Continuar
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </section>
        ) : null}

        {passo === 3 && perfil ? (
          <section>
            <h1 className="text-3xl font-semibold">Criar sua conta</h1>
            <p className="mt-2 text-muted-foreground">
              {perfil === "produtor"
                ? "Vamos abrir o painel do seu estúdio."
                : "Vamos abrir o acompanhamento dos seus projetos."}
            </p>
            <form onSubmit={entrar} className="mt-6 max-w-md space-y-4">
              <div>
                <label htmlFor="nome" className="text-sm font-medium">
                  Seu nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  placeholder="Julia Alcassa"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  placeholder="voce@email.com"
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasso(2)}
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Voltar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
                >
                  Entrar no painel
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Nesta versão de demonstração, os dados ficam apenas no seu navegador.
              </p>
            </form>
          </section>
        ) : null}
      </main>
    </div>
  );
}
