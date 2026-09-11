export const PROJECT_STATUSES = [
  "Orçamento",
  "Aprovado",
  "Em produção",
  "Em revisão",
  "Aguardando cliente",
  "Concluído",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Priority = "Baixa" | "Média" | "Alta";

export type FileCategory =
  | "Partitura"
  | "Áudio"
  | "Stems"
  | "Mix"
  | "Master"
  | "Documentos";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  priority: Priority;
  dueDate: string;
  done: boolean;
};

export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  category: FileCategory;
  size: string;
  updatedAt: string;
};

export type Feedback = {
  id: string;
  projectId: string;
  author: string;
  source: string;
  date: string;
  original: string;
  summary: string;
  changes: string[];
  urgency: "Baixa" | "Média" | "Alta";
  tone: string;
};

export type MusicSheet = {
  originalKey: string;
  arrangementKey: string;
  bpm: number;
  duration: string;
  timeSignature: string;
  instrumentation: string[];
  structure: string;
  notes: string;
};

export type Project = {
  id: string;
  title: string;
  clientId: string;
  type: string;
  status: ProjectStatus;
  deadline: string;
  createdAt: string;
  budget: number;
  paid: number;
  progress: number;
  sheet: MusicSheet;
};

export type Client = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  city: string;
  since: string;
};

export type Payment = {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  date: string;
  status: "Pago" | "A receber" | "Atrasado";
};

export const clients: Client[] = [
  {
    id: "c1",
    name: "Orquestra Sinfônica de Campinas",
    contact: "Helena Braga",
    email: "helena@oscampinas.art.br",
    phone: "(19) 99812-4410",
    city: "Campinas, SP",
    since: "2023-02-11",
  },
  {
    id: "c2",
    name: "Estúdio Vento Norte",
    contact: "Rafael Duarte",
    email: "rafael@ventonorte.studio",
    phone: "(11) 98220-7731",
    city: "São Paulo, SP",
    since: "2024-05-03",
  },
  {
    id: "c3",
    name: "Cantora Marina Rios",
    contact: "Marina Rios",
    email: "contato@marinarios.com",
    phone: "(21) 99145-2280",
    city: "Rio de Janeiro, RJ",
    since: "2024-11-19",
  },
  {
    id: "c4",
    name: "Produtora Claraluz Filmes",
    contact: "Tiago Menezes",
    email: "tiago@claraluz.tv",
    phone: "(31) 99671-0088",
    city: "Belo Horizonte, MG",
    since: "2025-01-27",
  },
  {
    id: "c5",
    name: "Coral Vozes do Cerrado",
    contact: "Dona Lúcia Prado",
    email: "coral@vozesdocerrado.org",
    phone: "(61) 98444-1902",
    city: "Brasília, DF",
    since: "2022-08-14",
  },
];

export const projects: Project[] = [
  {
    id: "p1",
    title: "Suíte Aurora — 3 movimentos",
    clientId: "c1",
    type: "Composição orquestral",
    status: "Em produção",
    deadline: "2026-09-26",
    createdAt: "2026-06-02",
    budget: 28000,
    paid: 14000,
    progress: 62,
    sheet: {
      originalKey: "Ré menor",
      arrangementKey: "Ré menor",
      bpm: 72,
      duration: "18:40",
      timeSignature: "4/4",
      instrumentation: [
        "Cordas completas",
        "Madeiras a 2",
        "2 trompas",
        "Tímpanos",
        "Harpa",
      ],
      structure: "I. Alvorecer — II. Marés — III. Clarão final",
      notes:
        "Segundo movimento pede clima mais intimista; harpa dobra a melodia principal a partir do compasso 48.",
    },
  },
  {
    id: "p2",
    title: "Trilha institucional Claraluz",
    clientId: "c4",
    type: "Trilha audiovisual",
    status: "Em revisão",
    deadline: "2026-09-12",
    createdAt: "2026-07-18",
    budget: 9500,
    paid: 4750,
    progress: 84,
    sheet: {
      originalKey: "Sol maior",
      arrangementKey: "Lá maior",
      bpm: 104,
      duration: "02:35",
      timeSignature: "4/4",
      instrumentation: ["Piano", "Cordas sintetizadas", "Violão de nylon", "Percussão leve"],
      structure: "Intro — Tema A — Ponte — Tema A ampliado — Cauda",
      notes: "Sincronia com corte em 01:12. Cliente pediu final mais aberto.",
    },
  },
  {
    id: "p3",
    title: "Arranjo — 'Beira de Rio' (voz e trio)",
    clientId: "c3",
    type: "Arranjo",
    status: "Aguardando cliente",
    deadline: "2026-09-08",
    createdAt: "2026-08-01",
    budget: 4200,
    paid: 2100,
    progress: 70,
    sheet: {
      originalKey: "Mi maior",
      arrangementKey: "Ré maior",
      bpm: 88,
      duration: "03:58",
      timeSignature: "6/8",
      instrumentation: ["Voz", "Violão sete cordas", "Contrabaixo acústico", "Pandeiro"],
      structure: "Intro violão — Estrofe — Refrão — Solo — Refrão final",
      notes: "Tom baixado para conforto vocal. Refrão final com terça acima na voz de apoio.",
    },
  },
  {
    id: "p4",
    title: "Mixagem EP 'Noturno'",
    clientId: "c2",
    type: "Mixagem e master",
    status: "Aprovado",
    deadline: "2026-10-10",
    createdAt: "2026-08-20",
    budget: 12000,
    paid: 0,
    progress: 15,
    sheet: {
      originalKey: "Variado",
      arrangementKey: "Variado",
      bpm: 0,
      duration: "24:10",
      timeSignature: "Variado",
      instrumentation: ["Banda completa", "Teclados", "Naipe de sopros em 2 faixas"],
      structure: "6 faixas — mix + master para streaming",
      notes: "Referência sonora enviada pelo cliente: discos de soul brasileiro dos anos 70.",
    },
  },
  {
    id: "p5",
    title: "Missa Brevis para coro misto",
    clientId: "c5",
    type: "Composição coral",
    status: "Concluído",
    deadline: "2026-07-30",
    createdAt: "2026-03-14",
    budget: 15000,
    paid: 15000,
    progress: 100,
    sheet: {
      originalKey: "Fá maior",
      arrangementKey: "Fá maior",
      bpm: 66,
      duration: "21:15",
      timeSignature: "3/4",
      instrumentation: ["Coro SATB", "Órgão"],
      structure: "Kyrie — Gloria — Sanctus — Agnus Dei",
      notes: "Estreia realizada em julho. Partituras entregues em PDF e impressas.",
    },
  },
  {
    id: "p6",
    title: "Orçamento — Abertura de festival",
    clientId: "c1",
    type: "Composição",
    status: "Orçamento",
    deadline: "2026-11-05",
    createdAt: "2026-09-01",
    budget: 18000,
    paid: 0,
    progress: 0,
    sheet: {
      originalKey: "A definir",
      arrangementKey: "A definir",
      bpm: 0,
      duration: "06:00 (estimado)",
      timeSignature: "A definir",
      instrumentation: ["Orquestra sinfônica", "Coro convidado"],
      structure: "Peça única de abertura",
      notes: "Aguardando confirmação de verba do festival.",
    },
  },
  {
    id: "p7",
    title: "Redução para piano — 'Cortejo'",
    clientId: "c5",
    type: "Redução",
    status: "Em produção",
    deadline: "2026-09-04",
    createdAt: "2026-08-05",
    budget: 3600,
    paid: 1800,
    progress: 45,
    sheet: {
      originalKey: "Sol menor",
      arrangementKey: "Sol menor",
      bpm: 92,
      duration: "05:20",
      timeSignature: "2/4",
      instrumentation: ["Piano solo"],
      structure: "Tema — Variação I — Variação II — Coda",
      notes: "Manter a condução das vozes internas da versão orquestral.",
    },
  },
];

export const tasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Orquestrar o segundo movimento", priority: "Alta", dueDate: "2026-09-12", done: false },
  { id: "t2", projectId: "p1", title: "Revisar extensão das trompas", priority: "Média", dueDate: "2026-09-16", done: false },
  { id: "t3", projectId: "p1", title: "Enviar mock-up em áudio", priority: "Alta", dueDate: "2026-09-20", done: false },
  { id: "t4", projectId: "p2", title: "Ajustar final aberto do tema", priority: "Alta", dueDate: "2026-09-10", done: false },
  { id: "t5", projectId: "p2", title: "Exportar stems para o cliente", priority: "Média", dueDate: "2026-09-11", done: false },
  { id: "t6", projectId: "p3", title: "Gravar guia de violão", priority: "Média", dueDate: "2026-09-06", done: true },
  { id: "t7", projectId: "p3", title: "Confirmar tom com a cantora", priority: "Alta", dueDate: "2026-09-05", done: false },
  { id: "t8", projectId: "p4", title: "Organizar sessão e nomear faixas", priority: "Baixa", dueDate: "2026-09-18", done: false },
  { id: "t9", projectId: "p7", title: "Escrever variação II", priority: "Alta", dueDate: "2026-09-03", done: false },
  { id: "t10", projectId: "p7", title: "Revisar dedilhados", priority: "Baixa", dueDate: "2026-09-09", done: false },
];

export const files: ProjectFile[] = [
  { id: "f1", projectId: "p1", name: "suite-aurora-mov1.pdf", category: "Partitura", size: "4,2 MB", updatedAt: "2026-08-28" },
  { id: "f2", projectId: "p1", name: "aurora-mockup-v3.wav", category: "Áudio", size: "128 MB", updatedAt: "2026-09-01" },
  { id: "f3", projectId: "p2", name: "claraluz-mix-v4.wav", category: "Mix", size: "62 MB", updatedAt: "2026-09-05" },
  { id: "f4", projectId: "p2", name: "claraluz-stems.zip", category: "Stems", size: "740 MB", updatedAt: "2026-09-05" },
  { id: "f5", projectId: "p3", name: "beira-de-rio-grade.pdf", category: "Partitura", size: "1,8 MB", updatedAt: "2026-08-30" },
  { id: "f6", projectId: "p3", name: "beira-de-rio-guia.mp3", category: "Áudio", size: "9 MB", updatedAt: "2026-08-30" },
  { id: "f7", projectId: "p5", name: "missa-brevis-partituras.pdf", category: "Partitura", size: "6,1 MB", updatedAt: "2026-07-22" },
  { id: "f8", projectId: "p5", name: "nf-1204.pdf", category: "Documentos", size: "220 KB", updatedAt: "2026-07-31" },
  { id: "f9", projectId: "p4", name: "noturno-referencias.txt", category: "Documentos", size: "12 KB", updatedAt: "2026-08-21" },
  { id: "f10", projectId: "p7", name: "cortejo-piano-rascunho.pdf", category: "Partitura", size: "900 KB", updatedAt: "2026-09-02" },
];

export const feedbacks: Feedback[] = [
  {
    id: "fb1",
    projectId: "p2",
    author: "Tiago Menezes",
    source: "WhatsApp",
    date: "2026-09-05",
    original:
      "Oi! Ouvimos aqui com a equipe e curtimos bastante. Só acho que o começo demora pra entrar, e no final a música corta meio seco. Dá pra deixar as cordas um pouco mais presentes no meio? Precisamos fechar até sexta.",
    summary:
      "Cliente aprovou a direção geral, mas pede entrada mais rápida, final menos abrupto e cordas mais presentes na parte central. Prazo: sexta-feira.",
    changes: [
      "Encurtar a introdução",
      "Criar final com decaimento suave",
      "Aumentar presença das cordas na seção central",
    ],
    urgency: "Alta",
    tone: "Positivo com ressalvas",
  },
  {
    id: "fb2",
    projectId: "p3",
    author: "Marina Rios",
    source: "E-mail",
    date: "2026-08-31",
    original:
      "Amei o arranjo! Só o refrão final está um pouco alto pra mim, será que dá pra pensar em outra opção?",
    summary: "Cantora aprovou o arranjo e pede alternativa para o refrão final, que ficou alto para sua tessitura.",
    changes: ["Propor refrão final um tom abaixo ou com melodia alternativa"],
    urgency: "Média",
    tone: "Entusiasmado",
  },
];

export const payments: Payment[] = [
  { id: "pay1", projectId: "p1", description: "Suíte Aurora — 1ª parcela", amount: 14000, date: "2026-06-10", status: "Pago" },
  { id: "pay2", projectId: "p1", description: "Suíte Aurora — 2ª parcela", amount: 14000, date: "2026-09-30", status: "A receber" },
  { id: "pay3", projectId: "p2", description: "Trilha Claraluz — sinal", amount: 4750, date: "2026-07-20", status: "Pago" },
  { id: "pay4", projectId: "p2", description: "Trilha Claraluz — entrega", amount: 4750, date: "2026-09-15", status: "A receber" },
  { id: "pay5", projectId: "p3", description: "Arranjo Beira de Rio — 50%", amount: 2100, date: "2026-08-02", status: "Pago" },
  { id: "pay6", projectId: "p3", description: "Arranjo Beira de Rio — saldo", amount: 2100, date: "2026-08-28", status: "Atrasado" },
  { id: "pay7", projectId: "p5", description: "Missa Brevis — pagamento final", amount: 7500, date: "2026-07-31", status: "Pago" },
  { id: "pay8", projectId: "p7", description: "Redução Cortejo — sinal", amount: 1800, date: "2026-08-06", status: "Pago" },
  { id: "pay9", projectId: "p7", description: "Redução Cortejo — saldo", amount: 1800, date: "2026-09-20", status: "A receber" },
  { id: "pay10", projectId: "p4", description: "Mixagem Noturno — sinal", amount: 6000, date: "2026-09-25", status: "A receber" },
];

export const monthlyRevenue = [
  { month: "Abr", faturado: 9200, aReceber: 3000 },
  { month: "Mai", faturado: 12400, aReceber: 2500 },
  { month: "Jun", faturado: 18600, aReceber: 6200 },
  { month: "Jul", faturado: 21300, aReceber: 4100 },
  { month: "Ago", faturado: 15800, aReceber: 8300 },
  { month: "Set", faturado: 11450, aReceber: 12650 },
];

export const roadmap = [
  {
    title: "Bot de WhatsApp",
    description:
      "Receba mensagens de clientes direto na Prelúdia: a Mia interpreta os pedidos e cria as tarefas no projeto certo.",
    eta: "1º trimestre",
    tag: "Em desenvolvimento",
  },
  {
    title: "Dropbox e Google Drive",
    description:
      "Conecte suas pastas e mantenha partituras, stems e masters sincronizados com cada projeto automaticamente.",
    eta: "1º trimestre",
    tag: "Em desenvolvimento",
  },
  {
    title: "Emissão de nota fiscal",
    description:
      "Gere a NF do projeto concluído sem sair da plataforma, com os dados do cliente já preenchidos.",
    eta: "2º trimestre",
    tag: "Planejado",
  },
  {
    title: "Publicação em redes sociais",
    description:
      "Transforme um trecho aprovado em post pronto, com onda sonora animada e legenda sugerida pela Mia.",
    eta: "2º trimestre",
    tag: "Planejado",
  },
];
