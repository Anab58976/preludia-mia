import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Ditado por voz usando a API de reconhecimento de fala do navegador (pt-BR). */
export function useSpeechInput(onText: (text: string) => void) {
  const [suportado, setSuportado] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const callbackRef = useRef(onText);
  callbackRef.current = onText;

  useEffect(() => {
    setSuportado(Boolean(getRecognitionCtor()));
    return () => recRef.current?.stop();
  }, []);

  const parar = useCallback(() => {
    recRef.current?.stop();
    setGravando(false);
  }, []);

  const iniciar = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setErro("Seu navegador não suporta ditado por voz.");
      return;
    }
    setErro(null);
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      let texto = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) texto += event.results[i][0].transcript;
      }
      if (texto.trim()) callbackRef.current(texto.trim());
    };
    rec.onerror = (event: any) => {
      setErro(
        event?.error === "not-allowed"
          ? "Permita o acesso ao microfone para usar o ditado."
          : "Não consegui captar o áudio agora.",
      );
      setGravando(false);
    };
    rec.onend = () => setGravando(false);
    rec.start();
    setGravando(true);
  }, []);

  const alternar = useCallback(() => {
    if (gravando) parar();
    else iniciar();
  }, [gravando, iniciar, parar]);

  return { suportado, gravando, erro, iniciar, parar, alternar };
}
