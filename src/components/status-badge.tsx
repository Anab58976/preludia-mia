import { cn } from "@/lib/utils";
import type { Priority, ProjectStatus } from "@/data/preludia";

const statusStyles: Record<ProjectStatus, string> = {
  "Orçamento": "bg-secondary text-secondary-foreground",
  Aprovado: "bg-blue-soft text-accent-foreground",
  "Em produção": "bg-primary/12 text-primary",
  "Em revisão": "bg-warning-soft text-foreground",
  "Aguardando cliente": "bg-secondary text-muted-foreground",
  "Concluído": "bg-success-soft text-foreground",
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  Alta: "bg-danger-soft text-destructive",
  "Média": "bg-warning-soft text-foreground",
  Baixa: "bg-secondary text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        priorityStyles[priority],
      )}
    >
      {priority}
    </span>
  );
}
