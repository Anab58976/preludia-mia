import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

type ChatRequestBody = {
  messages?: unknown;
  contexto?: unknown;
};

const SYSTEM = `Você é a Mia, assistente da Prelúdia — uma plataforma para compositores, maestros, produtores e arranjadores.
Fale sempre em português do Brasil, de forma acolhedora, direta e profissional. Use no máximo poucos parágrafos curtos.
Você recebe um panorama atualizado dos projetos, clientes, tarefas e finanças do usuário; responda com base nele e cite números e datas concretas.
Quando o usuário pedir para cadastrar ou alterar registros, chame a ferramenta apropriada. As ferramentas APENAS PREPARAM propostas, NÃO salvam automaticamente. Diga que a ação está aguardando confirmação na interface; nunca afirme que já foi salva. Não invente nomes, datas, valores ou outros dados essenciais; pergunte quando faltarem. É possível preparar vários registros em sequência. Para ações complexas, liste o que falta.
Se a informação não estiver no panorama, diga com clareza que ainda não tem esse dado.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Mensagens ausentes", { status: 400 });
        }

        // Use an OpenAI API key for local development, or the Lovable gateway
        // when deployed in the original Lovable environment. Keys stay server-side.
        const openaiKey = process.env["OPENAI_API_KEY"]?.trim();
        const lovableKey = process.env["LOVABLE_API_KEY"]?.trim();
        if (!openaiKey && !lovableKey) {
          return new Response(
            "Mia sem conexão com IA. Configure OPENAI_API_KEY no arquivo .env.local (na pasta do package.json) ou disponibilize LOVABLE_API_KEY no servidor. Consulte CONFIGURAR-MIA.md.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
          );
        }

        const usingLovable = !openaiKey;
        const contexto = typeof body.contexto === "string" ? body.contexto : "";
        const initialRunId = usingLovable ? getLovableAiGatewayRunId(request) : undefined;
        const runIdFetch = usingLovable ? createLovableAiGatewayRunIdFetch(initialRunId) : null;
        const ai = usingLovable
          ? createOpenAI({
              baseURL: "https://ai.gateway.lovable.dev/v1",
              apiKey: lovableKey!,
              headers: {
                "Lovable-API-Key": lovableKey!,
                "X-Lovable-AIG-SDK": "vercel-ai-sdk",
              },
              fetch: runIdFetch!.fetch,
            })
          : createOpenAI({ apiKey: openaiKey });
        const modelName = usingLovable
          ? process.env["LOVABLE_AI_MODEL"]?.trim() || "openai/gpt-6-astra"
          : process.env["OPENAI_MODEL"]?.trim() || "gpt-4.1-mini";

        const result = streamText({
          model: ai.responses(modelName),
          system: `${SYSTEM}\n\nPanorama atual da conta:\n${contexto}`,
          messages: await convertToModelMessages(messages as UIMessage[]),
          stopWhen: stepCountIs(50),
          abortSignal: request.signal,
          tools: {
            criar_projeto: tool({
              description:
                "Cria um novo projeto na Prelúdia com status Orçamento. Use quando o usuário pedir para criar/abrir um projeto.",
              inputSchema: z.object({
                titulo: z.string().describe("Título do projeto"),
                cliente: z.string().describe("Nome do cliente informado pelo usuário"),
                tipo: z.string().describe("Tipo de trabalho, ex: Arranjo, Trilha audiovisual"),
                prazo: z.string().describe("Data de entrega no formato AAAA-MM-DD"),
                valor: z.number().describe("Valor do orçamento em reais; use 0 se não informado"),
              }),
              execute: async (input) => ({ aguardandoConfirmacao: true, ...input }),
            }),
            gerenciar_registro: tool({
              description: "Prepara uma proposta de cadastro, alteração ou exclusão de cliente, projeto, tarefa ou recebimento; pode também atualizar campos da ficha musical de projeto. Não salva até que o usuário confirme.",
              inputSchema: z.object({
                operacao: z.enum(["criar", "editar", "excluir"]),
                entidade: z.enum(["cliente", "projeto", "tarefa", "recebimento", "ficha_musical"]),
                alvo: z.string().optional().describe("Nome ou id exato de registro existente (em edições e exclusões)"),
                projeto: z.string().optional().describe("Nome ou id do projeto relacionado"),
                campos: z.object({
                  nome: z.string().optional(), titulo: z.string().optional(), contato: z.string().optional(),
                  email: z.string().optional(), telefone: z.string().optional(), cidade: z.string().optional(),
                  cliente: z.string().optional(), tipo: z.string().optional(), status: z.string().optional(),
                  prazo: z.string().optional(), valor: z.number().optional(), progresso: z.number().optional(),
                  prioridade: z.enum(["Baixa", "Média", "Alta"]).optional(), concluida: z.boolean().optional(),
                  descricao: z.string().optional(), data: z.string().optional(),
                  tonalidadeOriginal: z.string().optional(), tonalidadeArranjo: z.string().optional(),
                  bpm: z.number().optional(), duracao: z.string().optional(), compasso: z.string().optional(),
                  instrumentos: z.array(z.string()).optional(), estrutura: z.string().optional(), notas: z.string().optional(),
                }).describe("Somente os campos que o usuário informou ou pediu para mudar"),
              }),
              execute: async (input) => ({ aguardandoConfirmacao: true, ...input }),
            }),
            criar_tarefa: tool({
              description: "Cria uma tarefa vinculada a um projeto existente.",
              inputSchema: z.object({
                titulo: z.string().describe("Descrição da tarefa"),
                projeto: z.string().describe("Título ou id do projeto"),
                prioridade: z.enum(["Baixa", "Média", "Alta"]),
                prazo: z.string().describe("Data no formato AAAA-MM-DD"),
              }),
              execute: async (input) => ({ aguardandoConfirmacao: true, ...input }),
            }),
          },
          providerOptions: usingLovable
            ? {
                openai: {
                  forceReasoning: true,
                  reasoningEffort: "low",
                  reasoningSummary: "auto",
                  store: false,
                  include: ["reasoning.encrypted_content"],
                },
              }
            : { openai: { store: false } },
        });

        const response = result.toUIMessageStreamResponse({
          sendReasoning: usingLovable,
          originalMessages: messages as UIMessage[],
          ...(usingLovable
            ? {
                headers: getLovableAiGatewayResponseHeaders(undefined, {
                  ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
                }),
              }
            : {}),
        });

        return runIdFetch ? withLovableAiGatewayRunIdHeader(response, runIdFetch) : response;
      },
    },
  },
});
