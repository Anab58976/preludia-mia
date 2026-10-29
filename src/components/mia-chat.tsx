import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { FileText, Paperclip, Mic, MicOff, X } from "lucide-react";
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
  PromptInputHeader,
  PromptInputButton,
  PromptInputSubmit,
  usePromptInputAttachments,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { MiaAvatar } from "@/components/mia-avatar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useSpeechInput } from "@/lib/use-speech-input";
import { currency, TODAY } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PROJECT_STATUSES, type Priority } from "@/data/preludia";

const SUGESTOES = [
  "Quais entregas vencem nesta semana?",
  "Quanto ainda tenho a receber?",
  "Resuma o andamento da Suíte Aurora",
];

// A Mia recebe imagens e PDFs como anexos do chat. Arquivos de texto são
// lidos no navegador e enviados como contexto textual, sem upload permanente.
const TIPOS_TEXTO = new Set(["text/plain", "text/markdown", "text/csv", "application/json"]);
const EXTENSOES_TEXTO = /\.(txt|md|csv|json)$/i;
const MARCADOR_CONTEUDO = "\n\n[CONTEÚDO DOS ARQUIVOS ANEXADOS]\n";
const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const LIMITE_TEXTO = 15000;

function MiaControlesDeAnexo({ texto, status, stop, voz }: {
  texto: string;
  status: "submitted" | "streaming" | "ready" | "error";
  stop: () => void;
  voz: { suportado: boolean; gravando: boolean; alternar: () => void };
}) {
  const anexos = usePromptInputAttachments();
  const carregando = status === "submitted" || status === "streaming";
  return (
    <>
      {anexos.files.length > 0 && (
        <PromptInputHeader className="gap-1.5 px-2 pt-2">
          {anexos.files.map((arquivo) => (
            <span key={arquivo.id} className="inline-flex max-w-full items-center gap-1 rounded-lg border bg-secondary px-2 py-1 text-xs text-foreground">
              <FileText aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="max-w-40 truncate" title={arquivo.filename || "Arquivo"}>{arquivo.filename || "Arquivo"}</span>
              <button
                type="button"
                aria-label={`Remover ${arquivo.filename || "arquivo"}`}
                title="Remover anexo"
                className="ml-1 rounded p-0.5 hover:bg-muted"
                onClick={() => anexos.remove(arquivo.id)}
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </span>
          ))}
        </PromptInputHeader>
      )}
      <PromptInputFooter className="justify-between">
        <PromptInputButton
          aria-label="Adicionar arquivos à conversa com a Mia"
          title="Anexar PDF, imagem ou arquivo de texto (até 5 MB)"
          onClick={anexos.openFileDialog}
          disabled={carregando}
        >
          <Paperclip aria-hidden="true" className="size-4" />
          <span className="text-xs">Anexar</span>
        </PromptInputButton>
        <div className="flex items-center gap-1">
          <PromptInputButton type="button" aria-label={voz.gravando ? "Parar gravação" : "Ditado por voz"} title={voz.suportado ? "Falar com a Mia" : "Reconhecimento de voz não disponível neste navegador"} onClick={voz.alternar} disabled={!voz.suportado || carregando}>
            {voz.gravando ? <MicOff className="size-4 text-red-500" /> : <Mic className="size-4" />}
            <span className="text-xs">{voz.gravando ? "Parar" : "Falar"}</span>
          </PromptInputButton>
          <PromptInputSubmit
          status={status}
          disabled={!texto.trim() && anexos.files.length === 0 && !carregando}
          onStop={stop}
          />
        </div>
      </PromptInputFooter>
    </>
  );
}

async function prepararMensagemComAnexos(texto: string, arquivos: FileUIPart[]) {
  const anexosVisuais: FileUIPart[] = [];
  const conteudos: string[] = [];
  for (const arquivo of arquivos) {
    const nome = arquivo.filename || "arquivo";
    if (TIPOS_TEXTO.has(arquivo.mediaType) || EXTENSOES_TEXTO.test(nome)) {
      const resposta = await fetch(arquivo.url);
      if (!resposta.ok) throw new Error(`Não foi possível ler ${nome}.`);
      const original = await resposta.text();
      const textoLimitado = original.slice(0, LIMITE_TEXTO);
      const aviso = original.length > LIMITE_TEXTO ? "\n[Conteúdo limitado aos primeiros 15.000 caracteres]" : "";
      conteudos.push(`\n--- ${nome} ---\n${textoLimitado}${aviso}`);
    } else {
      anexosVisuais.push(arquivo);
    }
  }
  const nomes = arquivos.map((a) => a.filename || "arquivo").join(", ");
  const pedido = texto.trim() || "Analise os arquivos anexados e resuma os principais pontos.";
  const mensagem = arquivos.length ? `${pedido}\n\n📎 ${nomes}` : pedido;
  return {
    text: conteudos.length ? mensagem + MARCADOR_CONTEUDO + conteudos.join("\n") : mensagem,
    files: anexosVisuais,
  };
}

export function MiaChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const applied = useRef(new Set<string>());
  const store = useStore();
  type Pending = { kind: "project" | "task"; title: string; targetId: string; type?: string; deadline: string; budget?: number; priority?: Priority } | { kind: "generic"; operacao: "criar" | "editar" | "excluir"; entidade: string; alvo?: string; projeto?: string; campos: Record<string, unknown> };
  const [queue, setQueue] = useState<Pending[]>([]);
  const pending = queue[0] ?? null;
  const voz = useSpeechInput((fala) => setInput((atual) => [atual.trim(), fala].filter(Boolean).join(" ")));
  useEffect(() => { if (voz.erro) toast.error(voz.erro); }, [voz.erro]);

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
    const clientes = store.clients.map((c) => `- ${c.name} (id ${c.id}) | contato: ${c.contact} | email: ${c.email} | telefone: ${c.phone} | cidade: ${c.city}`).join("\n");
    const todosRecebimentos = store.payments.map(p => `- ${p.description} (id ${p.id}) | projeto ${store.projectById(p.projectId)?.title ?? p.projectId} | ${currency(p.amount)} | ${p.status} | ${p.date}`).join("\n");
    const todasTarefas = store.tasks.map(t => `- ${t.title} (id ${t.id}) | projeto ${store.projectById(t.projectId)?.title ?? t.projectId} | ${t.done ? "concluída" : "pendente"} | ${t.dueDate}`).join("\n");
    return `Data de hoje: ${TODAY}.\n\nPROJETOS:\n${linhasProjetos}\n\nTAREFAS ABERTAS:\n${linhasTarefas}\n\nRECEBIMENTOS PENDENTES:\n${aReceber}\n\nCLIENTES:\n${clientes}\n\nTODAS AS TAREFAS:\n${todasTarefas}\n\nTODOS OS RECEBIMENTOS:\n${todosRecebimentos}`;
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
          const name = String(inputData["cliente"] ?? "").trim().toLowerCase();
          const matches = name.length >= 2 ? store.clients.filter(c => c.name.toLowerCase() === name || c.name.toLowerCase().includes(name)) : [];
          if (matches.length !== 1) { toast.error("A Mia não identificou um único cliente. Informe o nome exato antes de criar."); continue; }
          setQueue(prev => [...prev, { kind: "project", title: String(inputData["titulo"] ?? "Novo projeto"), targetId: matches[0].id, type: String(inputData["tipo"] ?? "Projeto musical"), deadline: String(inputData["prazo"] ?? TODAY), budget: Number(inputData["valor"] ?? 0) }]);
        }
        if (type === "tool-gerenciar_registro") {
          applied.current.add(toolCallId);
          const operacao = String(inputData["operacao"] ?? "");
          const entidade = String(inputData["entidade"] ?? "");
          if (!["criar", "editar", "excluir"].includes(operacao) || !["cliente", "projeto", "tarefa", "recebimento", "ficha_musical"].includes(entidade)) continue;
          const campos = inputData["campos"];
          if (!campos || typeof campos !== "object" || Array.isArray(campos)) continue;
          setQueue(prev => [...prev, { kind: "generic", operacao: operacao as "criar" | "editar" | "excluir", entidade, alvo: String(inputData["alvo"] ?? ""), projeto: String(inputData["projeto"] ?? ""), campos: campos as Record<string, unknown> }]);
        }
        if (type === "tool-criar_tarefa") {
          applied.current.add(toolCallId);
          const name = String(inputData["projeto"] ?? "").trim().toLowerCase();
          const matches = name.length >= 2 ? store.projects.filter(p => p.id.toLowerCase() === name || p.title.toLowerCase() === name || p.title.toLowerCase().includes(name)) : [];
          if (matches.length !== 1) { toast.error("A Mia não identificou um único projeto. Informe o nome exato."); continue; }
          setQueue(prev => [...prev, { kind: "task", title: String(inputData["titulo"] ?? "Nova tarefa"), targetId: matches[0].id, deadline: String(inputData["prazo"] ?? TODAY), priority: ["Alta", "Média", "Baixa"].includes(String(inputData["prioridade"])) ? inputData["prioridade"] as Priority : "Média" }]);
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

  const enviarComAnexos = async (texto: string, arquivos: FileUIPart[]) => {
    if (!texto.trim() && arquivos.length === 0) return;
    try {
      const mensagem = await prepararMensagemComAnexos(texto, arquivos);
      await sendMessage(mensagem);
      setInput("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar os arquivos.");
      throw error; // Mantém os anexos selecionados para tentar novamente.
    }
  };

  const carregando = status === "submitted" || status === "streaming";
  const retirar = () => setQueue(prev => prev.slice(1));
  const confirmar = () => {
    if (!pending) return;
    const find = <T extends { id: string }>(items: T[], label: string, getName: (x: T) => string): T => {
      const term = label.trim().toLowerCase();
      const matched = items.filter(x => x.id.toLowerCase() === term || getName(x).toLowerCase() === term);
      if (matched.length !== 1) throw new Error(`Não encontrei um único registro para “${label}”. Informe o nome exato ou ID.`);
      return matched[0];
    };
    try {
      if (pending.kind === "project") store.addProject({ title: pending.title, clientId: pending.targetId, type: pending.type ?? "Projeto musical", deadline: pending.deadline, budget: Math.max(0, pending.budget ?? 0) });
      else if (pending.kind === "task") store.addTask({ projectId: pending.targetId, title: pending.title, dueDate: pending.deadline, priority: pending.priority ?? "Média" });
      else {
        const { entidade, operacao, campos: c, alvo, projeto } = pending;
        const str = (key: string) => typeof c[key] === "string" ? String(c[key]).trim() : undefined;
        const num = (key: string) => typeof c[key] === "number" && Number.isFinite(c[key]) ? Number(c[key]) : undefined;
        const projectRef = (name: string) => find(store.projects, name, x => x.title);
        const clientRef = (name: string) => find(store.clients, name, x => x.name);
        if (entidade === "cliente") {
          if (operacao === "criar") { if (!str("nome")) throw Error("Informe o nome do cliente."); store.addClient({ name: str("nome")!, contact: str("contato") ?? "", email: str("email") ?? "", phone: str("telefone") ?? "", city: str("cidade") ?? "" }); }
          else { const x = clientRef(alvo ?? ""); if (operacao === "excluir") { if (!store.deleteClient(x.id)) throw Error("Cliente vinculado a projeto não pode ser excluído."); } else store.updateClient(x.id, { ...(str("nome") !== undefined && { name: str("nome") }), ...(str("contato") !== undefined && { contact: str("contato") }), ...(str("email") !== undefined && { email: str("email") }), ...(str("telefone") !== undefined && { phone: str("telefone") }), ...(str("cidade") !== undefined && { city: str("cidade") }) }); }
        } else if (entidade === "projeto") {
          if (operacao === "criar") { if (!str("titulo") || !str("cliente")) throw Error("Informe título e cliente cadastrado."); store.addProject({ title: str("titulo")!, clientId: clientRef(str("cliente")!).id, type: str("tipo") ?? "Projeto musical", deadline: str("prazo") ?? TODAY, budget: num("valor") ?? 0 }); }
          else { const x = projectRef(alvo ?? ""); if (operacao === "excluir") store.deleteProject(x.id); else { const status = str("status"); if (status && !PROJECT_STATUSES.includes(status as typeof PROJECT_STATUSES[number])) throw Error("Status do projeto inválido."); store.updateProject(x.id, { ...(str("titulo") !== undefined && { title: str("titulo") }), ...(str("tipo") !== undefined && { type: str("tipo") }), ...(str("cliente") !== undefined && { clientId: clientRef(str("cliente")!).id }), ...(str("prazo") !== undefined && { deadline: str("prazo") }), ...(num("valor") !== undefined && { budget: Math.max(0, num("valor")!) }), ...(num("progresso") !== undefined && { progress: Math.max(0, Math.min(100, num("progresso")!)) }), ...(status && { status: status as typeof PROJECT_STATUSES[number] }) }); } }
        } else if (entidade === "tarefa") {
          if (operacao === "criar") { if (!str("titulo") || !projeto) throw Error("Informe a tarefa e o projeto."); store.addTask({ title: str("titulo")!, projectId: projectRef(projeto).id, dueDate: str("prazo") ?? TODAY, priority: (str("prioridade") as Priority) ?? "Média" }); }
          else { const x = find(store.tasks, alvo ?? "", v => v.title); if (operacao === "excluir") store.deleteTask(x.id); else store.updateTask(x.id, { ...(str("titulo") !== undefined && { title: str("titulo") }), ...(str("prazo") !== undefined && { dueDate: str("prazo") }), ...(str("prioridade") !== undefined && { priority: str("prioridade") as Priority }), ...(typeof c.concluida === "boolean" && { done: c.concluida }), ...(projeto && { projectId: projectRef(projeto).id }) }); }
        } else if (entidade === "recebimento") {
          const status = str("status"); const valid = ["Pago", "A receber", "Atrasado"] as const;
          if (status && !valid.includes(status as typeof valid[number])) throw Error("Status financeiro inválido.");
          if (operacao === "criar") { if (!projeto || !str("descricao") || num("valor") === undefined) throw Error("Informe projeto, descrição e valor do recebimento."); store.addPayment({ projectId: projectRef(projeto).id, description: str("descricao")!, amount: Math.max(0, num("valor")!), date: str("data") ?? TODAY, status: status as typeof valid[number] ?? "A receber" }); }
          else { const x = find(store.payments, alvo ?? "", v => v.description); if (operacao === "excluir") store.deletePayment(x.id); else store.updatePayment(x.id, { ...(projeto && { projectId: projectRef(projeto).id }), ...(str("descricao") !== undefined && { description: str("descricao") }), ...(num("valor") !== undefined && { amount: Math.max(0, num("valor")!) }), ...(str("data") !== undefined && { date: str("data") }), ...(status && { status: status as typeof valid[number] }) }); }
        } else if (entidade === "ficha_musical") {
          if (operacao !== "editar") throw Error("A ficha musical deve ser editada em um projeto existente.");
          const x = projectRef(alvo || projeto || "");
          store.updateProject(x.id, { sheet: { ...x.sheet, ...(str("tonalidadeOriginal") !== undefined && { originalKey: str("tonalidadeOriginal")! }), ...(str("tonalidadeArranjo") !== undefined && { arrangementKey: str("tonalidadeArranjo")! }), ...(num("bpm") !== undefined && { bpm: num("bpm")! }), ...(str("duracao") !== undefined && { duration: str("duracao")! }), ...(str("compasso") !== undefined && { timeSignature: str("compasso")! }), ...(Array.isArray(c.instrumentos) && { instrumentation: c.instrumentos.filter((v): v is string => typeof v === "string") }), ...(str("estrutura") !== undefined && { structure: str("estrutura")! }), ...(str("notas") !== undefined && { notes: str("notas")! }) } });
        }
      }
      retirar(); toast.success("Alteração confirmada e salva neste navegador.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível realizar a ação."); }
  };

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
                      Posso cadastrar clientes, criar projetos e tarefas, atualizar finanças e preencher fichas musicais. Escreva, fale ou anexe arquivos.
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
                        return <MessageResponse key={index}>
                          {message.role === "user" ? part.text.split(MARCADOR_CONTEUDO)[0] : part.text}
                        </MessageResponse>;
                      }
                      if (part.type === "file") {
                        return (
                          <a
                            key={index}
                            href={part.url}
                            download={part.filename || "anexo"}
                            className="inline-flex max-w-full items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-xs hover:bg-muted"
                          >
                            <Paperclip aria-hidden="true" className="size-4 shrink-0" />
                            <span className="truncate">{part.filename || "Arquivo anexado"}</span>
                          </a>
                        );
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
                              type={
                                toolPart.type.replace("_", " ") as `tool-${string}`
                              }
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

          {pending && <div className="border-t bg-blue-soft/60 p-3 text-sm">
            <p className="font-semibold">Confirmar ação da Mia {queue.length > 1 ? `(1 de ${queue.length})` : ""}</p>
            <p className="my-2 text-xs">{pending.kind === "generic" ? `${pending.operacao} ${pending.entidade}: ${pending.alvo || pending.campos.nome || pending.campos.titulo || pending.campos.descricao || "novo registro"}` : `${pending.kind === "project" ? "Criar projeto" : "Criar tarefa"}: ${pending.title}`}</p>
            {pending.kind === "generic" && <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(pending.campos, null, 2)}</pre>}
            <div className="flex gap-2"><button type="button" className="rounded-lg bg-ink px-3 py-2 text-xs text-ink-foreground" onClick={confirmar}>Confirmar e salvar</button><button type="button" onClick={retirar} className="rounded-lg border px-3 py-2 text-xs">Cancelar</button></div>
          </div>}
          <div className="border-t p-3">
            <PromptInput
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.json,image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown,text/csv,application/json"
              multiple
              maxFiles={3}
              maxFileSize={TAMANHO_MAXIMO}
              onError={({ code }) => {
                toast.error(
                  code === "max_files" ? "Você pode anexar até 3 arquivos por mensagem." :
                  code === "max_file_size" ? "Cada arquivo pode ter no máximo 5 MB." :
                  "Formato não aceito. Use PDF, imagem, TXT, MD, CSV ou JSON."
                );
              }}
              onSubmit={({ text, files }) => enviarComAnexos(text, files)}
            >
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pergunte à Mia ou anexe um arquivo..."
              />
              <MiaControlesDeAnexo texto={input} status={status} stop={stop} voz={voz} />
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
