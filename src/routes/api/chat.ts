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
Quando o usuário pedir para criar um projeto ou uma tarefa, use a ferramenta correspondente e depois confirme em uma frase.
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

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Configuração de IA ausente", { status: 500 });
        }

        const contexto = typeof body.contexto === "string" ? body.contexto : "";
        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: lovable.responses("openai/gpt-6-astra"),
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
              execute: async (input) => ({ criado: true, ...input }),
            }),
            criar_tarefa: tool({
              description: "Cria uma tarefa vinculada a um projeto existente.",
              inputSchema: z.object({
                titulo: z.string().describe("Descrição da tarefa"),
                projeto: z.string().describe("Título ou id do projeto"),
                prioridade: z.enum(["Baixa", "Média", "Alta"]),
                prazo: z.string().describe("Data no formato AAAA-MM-DD"),
              }),
              execute: async (input) => ({ criado: true, ...input }),
            }),
          },
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          sendReasoning: true,
          originalMessages: messages as UIMessage[],
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});
