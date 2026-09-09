import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  texto: z.string().min(5),
  projeto: z.string(),
});

export type FeedbackAnalysis = {
  resumo: string;
  alteracoes: string[];
  urgencia: "Baixa" | "Média" | "Alta";
  tom: string;
  respostaSugerida: string;
};

const PROMPT = `Você é a Mia, assistente da plataforma Prelúdia, especialista em produção musical.
Recebe uma mensagem bruta de um cliente (geralmente WhatsApp ou e-mail) sobre um trabalho musical.
Interprete o que foi pedido e responda SOMENTE com um objeto JSON válido, sem texto ao redor e sem blocos de código, no formato:
{"resumo": string, "alteracoes": string[], "urgencia": "Baixa"|"Média"|"Alta", "tom": string, "respostaSugerida": string}
- "resumo": 1 a 2 frases objetivas sobre o que o cliente quer.
- "alteracoes": lista curta e acionável das mudanças pedidas (no máximo 6 itens, cada um com até 90 caracteres).
- "urgencia": baseada em prazos e no tom da mensagem.
- "tom": duas ou três palavras descrevendo o humor do cliente.
- "respostaSugerida": uma resposta curta e cordial em português do Brasil para enviar ao cliente.
Escreva tudo em português do Brasil.`;

export const analisarFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<FeedbackAnalysis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Configuração de IA ausente");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");

    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });

    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      system: PROMPT,
      prompt: `Projeto: ${data.projeto}\n\nMensagem do cliente:\n"""${data.texto}"""`,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          store: false,
        },
      },
    });

    const text = await result.text;
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("A Mia não conseguiu interpretar essa mensagem. Tente novamente.");
    }

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<FeedbackAnalysis>;
    return {
      resumo: parsed.resumo ?? "",
      alteracoes: Array.isArray(parsed.alteracoes) ? parsed.alteracoes.slice(0, 6) : [],
      urgencia:
        parsed.urgencia === "Alta" || parsed.urgencia === "Baixa" ? parsed.urgencia : "Média",
      tom: parsed.tom ?? "Neutro",
      respostaSugerida: parsed.respostaSugerida ?? "",
    };
  });
