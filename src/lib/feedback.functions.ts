import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FORMATOS = ["mp3", "wav", "m4a", "ogg", "webm"] as const;

const Input = z.object({
  audioBase64: z.string().min(100),
  formato: z.enum(FORMATOS),
  projeto: z.string(),
});

export type FeedbackAnalysis = {
  transcricao: string;
  resumo: string;
  alteracoes: string[];
  urgencia: "Baixa" | "Média" | "Alta";
  tom: string;
  respostaSugerida: string;
};

const PROMPT = `Você é a Mia, assistente da plataforma Prelúdia, especialista em produção musical.
Você recebe um áudio de um cliente (geralmente um áudio de WhatsApp) falando sobre um trabalho musical.
Ouça o áudio, transcreva e interprete o que foi pedido.
Responda SOMENTE com um objeto JSON válido, sem texto ao redor e sem blocos de código, no formato:
{"transcricao": string, "resumo": string, "alteracoes": string[], "urgencia": "Baixa"|"Média"|"Alta", "tom": string, "respostaSugerida": string}
- "transcricao": transcrição fiel do que foi falado no áudio.
- "resumo": 1 a 2 frases objetivas sobre o que o cliente quer.
- "alteracoes": lista curta e acionável das mudanças pedidas (no máximo 6 itens, cada um com até 90 caracteres).
- "urgencia": baseada em prazos e no tom da fala.
- "tom": duas ou três palavras descrevendo o humor do cliente.
- "respostaSugerida": uma resposta curta e cordial em português do Brasil para enviar ao cliente.
Escreva tudo em português do Brasil.`;

export const analisarFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<FeedbackAnalysis> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Configuração de IA ausente");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `Projeto: ${data.projeto}. Ouça o áudio do cliente.` },
              {
                type: "input_audio",
                input_audio: { data: data.audioBase64, format: data.formato },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Muitos pedidos agora. Aguarde alguns segundos e tente de novo.");
      }
      if (response.status === 402) {
        throw new Error("Os créditos de IA acabaram. Adicione créditos para continuar.");
      }
      const detalhe = await response.text();
      throw new Error(
        detalhe.slice(0, 200) || "A Mia não conseguiu ouvir esse áudio. Tente novamente.",
      );
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("A Mia não conseguiu interpretar esse áudio. Tente novamente.");
    }

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<FeedbackAnalysis>;
    return {
      transcricao: parsed.transcricao ?? "",
      resumo: parsed.resumo ?? "",
      alteracoes: Array.isArray(parsed.alteracoes) ? parsed.alteracoes.slice(0, 6) : [],
      urgencia:
        parsed.urgencia === "Alta" || parsed.urgencia === "Baixa" ? parsed.urgencia : "Média",
      tom: parsed.tom ?? "Neutro",
      respostaSugerida: parsed.respostaSugerida ?? "",
    };
  });
