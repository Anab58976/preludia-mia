import { Laptop, Moon, Sun } from "lucide-react";

import { useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const opcoes: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "dark", label: "Escuro", icon: Moon },
  { mode: "system", label: "Automático", icon: Laptop },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Contraste e tema da interface"
      className="flex items-center gap-1 rounded-full border bg-card p-1"
    >
      {opcoes.map(({ mode: value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          aria-label={`Tema ${label}`}
          title={`Tema ${label}`}
          onClick={() => setMode(value)}
          className={cn(
            "inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            mode === value && "bg-ink text-ink-foreground hover:text-ink-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
