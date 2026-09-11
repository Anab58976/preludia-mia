import { Pause, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

function coletarTextoDaPagina(): string {
  const main = document.querySelector("main");
  if (!main) return "";
  const partes: string[] = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      if (el.getAttribute("aria-hidden") === "true") return NodeFilter.FILTER_REJECT;
      const tag = el.tagName.toLowerCase();
      if (["script", "style", "svg", "input", "textarea"].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (
        ["h1", "h2", "h3", "h4", "p", "li", "td", "th", "button", "a", "span", "dt", "dd"].includes(
          tag,
        )
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  let atual = walker.nextNode() as HTMLElement | null;
  while (atual) {
    const texto = (atual.innerText || "").trim();
    if (texto && !partes.some((p) => p.includes(texto))) {
      partes.push(texto);
    }
    atual = walker.nextNode() as HTMLElement | null;
  }
  return partes.join(". ").replace(/\s+/g, " ").slice(0, 12000);
}

export function ReadPageButton() {
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function alternar() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setErro("Seu navegador não permite leitura em voz alta.");
      return;
    }
    const sintese = window.speechSynthesis;
    if (lendo) {
      sintese.cancel();
      setLendo(false);
      return;
    }
    const texto = coletarTextoDaPagina();
    if (!texto) return;

    sintese.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 1;
    const vozPt = sintese.getVoices().find((v) => v.lang?.toLowerCase().startsWith("pt"));
    if (vozPt) fala.voice = vozPt;
    fala.onend = () => setLendo(false);
    fala.onerror = () => setLendo(false);
    setErro(null);
    setLendo(true);
    sintese.speak(fala);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={alternar}
        aria-label={lendo ? "Parar a leitura da página" : "Ler a página em voz alta"}
        title={lendo ? "Parar leitura" : "Ler a página em voz alta"}
        aria-pressed={lendo}
        className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {lendo ? <Pause className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        <span className="sr-only sm:not-sr-only">{lendo ? "Parar" : "Ler página"}</span>
      </button>
      {erro ? (
        <span role="status" className="hidden text-xs text-muted-foreground sm:inline">
          {erro}
        </span>
      ) : null}
    </div>
  );
}
