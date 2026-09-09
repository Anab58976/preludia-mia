import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { MiaAvatar } from "@/components/mia-avatar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Priority } from "@/data/preludia";

const SUGESTOES = [
  "Quais entregas vencem nesta semana?",
  "Quanto ainda tenho a receber?",
  "Resuma o andamento da Suíte Aurora",
];

export function MiaChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const applied = useRef(new Set<string>());
  const store = useStore();

  const contexto = useMemo(() => {
    const linhasProjetos = store.projects
      .map((p) => {
        const cliente = store.clientById(p.clientId)?.name ?? "cliente";
        return `- ${p.title} (id ${p.id}) | cliente: ${cliente} | status: ${p.status} | prazo: ${p.deadline} | orçamento ${currency(p.budget)} | pago ${currency(p.paid)} | andamento ${p.progress}%`;
      })
      .join("\n");
    const linhasTarefas = store.tasks
      .filter((t) => !t.done)
      .map((t) => {
        const projeto = store.projectById(t.projectId)?.title ?? t.projectId;
        return `- ${t.title} | projeto: ${projeto} | prioridade ${t.priority} | prazo ${t.dueDate}`;
      })
      .join("\n");
    const aReceber = store.payments
      .filter((p) => p.status !== "Pago")
      .map((p) => `- ${p.description} | ${currency(p.amount)} | ${p.status} | ${p.date}`)
      .join("\n");
    const clientes = store.clients.map((c) => `- ${c.name} (id ${c.id}) | contato: ${c.contact}`).join("\n");
    return `Data de hoje: 2026-09-09.\n\nPROJETOS:\n${linhasProjetos}\n\nTAREFAS ABERTAS:\n${linhasTarefas}\n\nRECEBIMENTOS PENDENTES:\n${aReceber}\n\nCLIENTES:\n${clientes}`;
  }, [store]);

  const contextoRef = useRef(contexto);
  contextoRef.current = contexto;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, contexto: contextoRef.current },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "A Mia não conseguiu responder agora."),
  });

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open, status]);

  useEffect(() => {
    for (const message of messages) {
      for (const rawPart of message.parts) {
        const part = rawPart as {
          type?: string;
          state?: string;
          toolCallId?: string;
          input?: Record<string, unknown>;
        };
        const type = String(part.type ?? "");
        const state = String(part.state ?? "");
        const toolCallId = String(part.toolCallId ?? "");
        if (state !== "output-available" || applied.current.has(toolCallId)) continue;
        const inputData = part.input;
        if (!inputData) continue;

        if (type === "tool-criar_projeto") {
          applied.current.add(toolCallId);
          const nomeCliente = String(inputData["cliente"] ?? "");
          const cliente =
            store.clients.find((c) =>
              c.name.toLowerCase().includes(nomeCliente.toLowerCase().slice(0, 8)),
            ) ?? store.clients[0];
          if (!cliente) continue;
          store.addProject({
            title: String(inputData["titulo"] ?? "Novo projeto"),
            clientId: cliente.id,
            type: String(inputData["tipo"] ?? "Projeto musical"),
            deadline: String(inputData["prazo"] ?? "2026-12-31"),
            budget: Number(inputData["valor"] ?? 0),
          });
          toast.success("A Mia criou um novo projeto.");
        }

        if (type === "tool-criar_tarefa") {
          applied.current.add(toolCallId);
          const alvo = String(inputData["projeto"] ?? "").toLowerCase();
          const projeto =
            store.projects.find(
              (p) => p.id === alvo || p.title.toLowerCase().includes(alvo.slice(0, 8)),
            ) ?? store.projects[0];
          if (!projeto) continue;
          store.addTask({
            projectId: projeto.id,
            title: String(inputData["titulo"] ?? "Nova tarefa"),
            priority: (inputData["prioridade"] as Priority) ?? "Média",
            dueDate: String(inputData["prazo"] ?? "2026-12-31"),
          });
          toast.success("A Mia criou uma nova tarefa.");
        }
      }
    }
  }, [messages, store]);

  const enviar = (texto: string) => {
    const valor = texto.trim();
    if (!valor) return;
    setInput("");
    void sendMessage({ text: valor });
  };

  const carregando = status === "submitted" || status === "streaming";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar conversa com a Mia" : "Conversar com a Mia"}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-ink-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-5" /> : <MiaAvatar size={34} />}
      </button>

      {open && (
        <div className="fixed right-5 bottom-24 z-50 flex h-[560px] w-[min(26rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">
          <header className="flex items-center gap-3 border-b bg-ink px-4 py-3 text-ink-foreground">
            <MiaAvatar size={32} />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Mia</p>
              <p className="text-xs text-ink-muted">Assistente da Prelúdia</p>
            </div>
          </header>

          <Conversation className="flex-1">
            <ConversationContent className="gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <MiaAvatar size={72} />
                  <div>
                    <p className="text-sm font-medium">Oi! Sou a Mia.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Posso consultar seus projetos, prazos e finanças — ou criar projetos e tarefas
                      para você.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {SUGESTOES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => enviar(s)}
                        className="rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent
                    className={cn(
                      message.role === "assistant" && "bg-transparent p-0 text-foreground",
                    )}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        return <MessageResponse key={index}>{part.text}</MessageResponse>;
                      }
                      if (part.type.startsWith("tool-")) {
                        const toolPart = part as unknown as {
                          type: string;
                          state: string;
                          input?: unknown;
                          output?: unknown;
                          errorText?: string;
                        };
                        return (
                          <Tool defaultOpen={false} key={index}>
                            <ToolHeader
                              type={toolPart.type.replace("tool-", "").replace("_", " ")}
                              state={toolPart.state as never}
                            />
                            <ToolContent>
                              <ToolInput input={toolPart.input} />
                              <ToolOutput
                                errorText={toolPart.errorText}
                                output={
                                  toolPart.output ? (
                                    <pre className="text-xs whitespace-pre-wrap">
                                      {JSON.stringify(toolPart.output, null, 2)}
                                    </pre>
                                  ) : undefined
                                }
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                      return null;
                    })}
                  </MessageContent>
                </Message>
              ))}

              {status === "submitted" && <Shimmer>A Mia está pensando...</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t p-3">
            <PromptInput
              onSubmit={(_, event) => {
                event.preventDefault();
                enviar(input);
              }}
            >
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunte algo sobre seus projetos..."
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={status}
                  disabled={!input.trim() && !carregando}
                  onStop={stop}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}

export function MiaFloatingButtonSpacer() {
  return <div className="h-20" />;
}

export { SUGESTOES };
