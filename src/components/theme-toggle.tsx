import { Laptop, Moon, Sun } from "lucide-react";

import { useTheme, type ThemeMode } from "@/lib/theme";

const opcoes: Record<ThemeMode, { label: string; icon: typeof Sun; proximo: ThemeMode }> = {
  light: { label: "Claro", icon: Sun, proximo: "dark" },
  dark: { label: "Escuro", icon: Moon, proximo: "system" },
  system: { label: "Automático", icon: Laptop, proximo: "light" },
};

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const atual = opcoes[mode];
  const proximo = opcoes[atual.proximo];
  const Icon = atual.icon;

  return (
    <button
      type="button"
      aria-label={`Tema atual: ${atual.label}. Trocar para ${proximo.label}.`}
      title={`Tema: ${atual.label} — toque para mudar`}
      onClick={() => setMode(atual.proximo)}
      className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Icon className="size-4" aria-hidden />
      <span className="sr-only sm:not-sr-only">{atual.label}</span>
    </button>
  );
}
