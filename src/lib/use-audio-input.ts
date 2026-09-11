import { useCallback, useEffect, useRef, useState } from "react";

export type AudioFormato = "mp3" | "wav" | "m4a" | "ogg" | "webm";

export type AudioCapturado = {
  url: string;
  base64: string;
  formato: AudioFormato;
  nome: string;
};

export const MENSAGEM_FORMATO_INVALIDO = "Apenas arquivos de áudio são permitidos.";

const EXTENSOES: Record<string, AudioFormato> = {
  mp3: "mp3",
  mpeg: "mp3",
  wav: "wav",
  wave: "wav",
  m4a: "m4a",
  mp4: "m4a",
  ogg: "ogg",
  oga: "ogg",
  webm: "webm",
};

export function formatoDoArquivo(file: File): AudioFormato | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const porExtensao = EXTENSOES[ext];
  if (porExtensao) return porExtensao;
  if (!file.type.startsWith("audio/")) return null;
  const sub = file.type.split("/")[1]?.split(";")[0]?.toLowerCase() ?? "";
  return EXTENSOES[sub] ?? null;
}

export function lerComoBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o áudio."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export function useAudioRecorder(onReady: (audio: AudioCapturado) => void) {
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const suportado =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!gravando) return;
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [gravando]);

  const parar = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setGravando(false);
        const blob = new Blob(chunks, { type: mime });
        const formato: AudioFormato = mime === "audio/webm" ? "webm" : "m4a";
        try {
          const base64 = await lerComoBase64(blob);
          onReady({
            url: URL.createObjectURL(blob),
            base64,
            formato,
            nome: `gravacao.${formato}`,
          });
        } catch {
          setErro("Não foi possível processar a gravação.");
        }
      };
      recorderRef.current = recorder;
      setSegundos(0);
      recorder.start();
      setGravando(true);
    } catch {
      setErro("Não conseguimos acessar o microfone. Verifique a permissão do navegador.");
    }
  }, [onReady]);

  return { gravando, erro, segundos, suportado, iniciar, parar };
}
