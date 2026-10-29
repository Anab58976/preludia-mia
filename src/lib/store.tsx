import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clients as seedClients, feedbacks as seedFeedbacks, files as seedFiles,
  payments as seedPayments, projects as seedProjects, tasks as seedTasks,
  type Client, type Feedback, type Priority, type Project, type ProjectFile,
  type ProjectStatus, type Task, type Payment,
} from "@/data/preludia";

const STORAGE_KEY = "preludia-workspace-v2";
export type AudioComment = { id: string; projectId: string; fileId: string; seconds: number; text: string; createdAt: string };
type Workspace = { clients: Client[]; projects: Project[]; tasks: Task[]; files: ProjectFile[]; feedbacks: Feedback[]; payments: Payment[]; comments: AudioComment[] };
const seed: Workspace = { clients: seedClients, projects: seedProjects, tasks: seedTasks, files: seedFiles, feedbacks: seedFeedbacks, payments: seedPayments, comments: [] };
const uid = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export type NewProject = Pick<Project, "title" | "clientId" | "type" | "deadline" | "budget">;
export type NewTask = Pick<Task, "projectId" | "title" | "priority" | "dueDate">;
export type NewClient = Omit<Client, "id" | "since">;
export type NewPayment = Omit<Payment, "id">;
export type NewFile = Omit<ProjectFile, "id">;

type StoreValue = Workspace & {
  hydrated: boolean;
  clientById: (id: string) => Client | undefined;
  projectById: (id: string) => Project | undefined;
  addProject: (input: NewProject) => Project;
  updateProject: (id: string, update: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addClient: (input: NewClient) => Client;
  updateClient: (id: string, update: Partial<Client>) => void;
  deleteClient: (id: string) => boolean;
  addTask: (input: NewTask) => Task;
  updateTask: (id: string, update: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  addFeedback: (feedback: Omit<Feedback, "id">) => Feedback;
  deleteFeedback: (id: string) => void;
  addPayment: (input: NewPayment) => Payment;
  updatePayment: (id: string, update: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  addFile: (input: NewFile) => ProjectFile;
  deleteFile: (id: string) => void;
  addComment: (input: Omit<AudioComment, "id" | "createdAt">) => AudioComment;
  deleteComment: (id: string) => void;
  importWorkspace: (value: Workspace) => void;
  resetWorkspace: () => void;
};
const StoreContext = createContext<StoreValue | null>(null);

function validWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== "object") return false;
  return ["clients", "projects", "tasks", "files", "feedbacks", "payments"].every((key) =>
    Array.isArray((value as Record<string, unknown>)[key]));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Workspace>(seed);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (validWorkspace(parsed)) setState({ ...parsed, comments: Array.isArray((parsed as Workspace).comments) ? (parsed as Workspace).comments : [] });
      }
    } catch (error) { console.warn("Não foi possível ler os dados locais", error); }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn("Espaço local insuficiente", error); }
  }, [state, hydrated]);

  const addProject = useCallback((input: NewProject) => {
    const project: Project = {
      ...input, id: `p-${uid()}`, status: "Orçamento", createdAt: new Date().toLocaleDateString("en-CA"),
      paid: 0, progress: 0,
      sheet: { originalKey: "A definir", arrangementKey: "A definir", bpm: 0, duration: "A definir", timeSignature: "A definir", instrumentation: [], structure: "A definir", notes: "" },
    };
    setState((prev) => ({ ...prev, projects: [project, ...prev.projects] }));
    return project;
  }, []);
  const updateProject = useCallback((id: string, update: Partial<Project>) => {
    setState((prev) => ({ ...prev, projects: prev.projects.map((p) => p.id === id ? { ...p, ...update, id: p.id } : p) }));
  }, []);
  const deleteProject = useCallback((id: string) => {
    setState((p) => ({ ...p, projects: p.projects.filter((v) => v.id !== id), tasks: p.tasks.filter((v) => v.projectId !== id), files: p.files.filter((v) => v.projectId !== id), feedbacks: p.feedbacks.filter((v) => v.projectId !== id), payments: p.payments.filter((v) => v.projectId !== id), comments: p.comments.filter((v) => v.projectId !== id) }));
  }, []);
  const addClient = useCallback((input: NewClient) => {
    const client: Client = { ...input, id: `c-${uid()}`, since: new Date().toLocaleDateString("en-CA") };
    setState((prev) => ({ ...prev, clients: [client, ...prev.clients] }));
    return client;
  }, []);
  const updateClient = useCallback((id: string, update: Partial<Client>) => {
    setState((prev) => ({ ...prev, clients: prev.clients.map((c) => c.id === id ? { ...c, ...update, id: c.id } : c) }));
  }, []);
  const deleteClient = useCallback((id: string) => {
    if (state.projects.some((p) => p.clientId === id)) return false;
    setState((prev) => ({ ...prev, clients: prev.clients.filter((c) => c.id !== id) }));
    return true;
  }, [state.projects]);
  const addTask = useCallback((input: NewTask) => {
    const task: Task = { ...input, id: `t-${uid()}`, done: false };
    setState((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
    return task;
  }, []);
  const updateTask = useCallback((id: string, update: Partial<Task>) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => t.id === id ? { ...t, ...update, id: t.id } : t) }));
  }, []);
  const deleteTask = useCallback((id: string) => setState((p) => ({ ...p, tasks: p.tasks.filter((v) => v.id !== id) })), []);
  const toggleTask = useCallback((id: string) => setState((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) })), []);
  const setProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    setState((p) => ({ ...p, projects: p.projects.map((v) => v.id === id ? { ...v, status, progress: status === "Concluído" ? 100 : v.progress } : v) }));
  }, []);
  const addFeedback = useCallback((input: Omit<Feedback, "id">) => {
    const feedback: Feedback = { ...input, id: `fb-${uid()}` };
    setState((p) => ({ ...p, feedbacks: [feedback, ...p.feedbacks] }));
    return feedback;
  }, []);
  const deleteFeedback = useCallback((id: string) => setState((p) => ({ ...p, feedbacks: p.feedbacks.filter((v) => v.id !== id) })), []);
  const addPayment = useCallback((input: NewPayment) => {
    const payment: Payment = { ...input, id: `pay-${uid()}` };
    setState((p) => ({ ...p, payments: [payment, ...p.payments], projects: input.status === "Pago" ? p.projects.map((v) => v.id === input.projectId ? { ...v, paid: v.paid + input.amount } : v) : p.projects }));
    return payment;
  }, []);
  const updatePayment = useCallback((id: string, update: Partial<Payment>) => {
    setState((p) => {
      const before = p.payments.find((v) => v.id === id);
      const after = before ? { ...before, ...update } : undefined;
      let projects = p.projects;
      if (before && after) {
        projects = projects.map((pr) => ({ ...pr, paid: pr.paid + (after.status === "Pago" && pr.id === after.projectId ? after.amount : 0) - (before.status === "Pago" && pr.id === before.projectId ? before.amount : 0) }));
      }
      return { ...p, projects, payments: p.payments.map((v) => v.id === id ? { ...v, ...update, id: v.id } : v) };
    });
  }, []);
  const deletePayment = useCallback((id: string) => setState((p) => {
    const payment = p.payments.find((v) => v.id === id);
    return { ...p, payments: p.payments.filter((v) => v.id !== id), projects: p.projects.map((v) => v.id === payment?.projectId && payment?.status === "Pago" ? { ...v, paid: Math.max(0, v.paid - payment.amount) } : v) };
  }), []);
  const addFile = useCallback((input: NewFile) => {
    const file: ProjectFile = { ...input, id: `f-${uid()}`, version: Math.max(0, ...state.files.filter(f => f.projectId === input.projectId && f.name === input.name).map(f => f.version ?? 1)) + 1 };
    setState((p) => ({ ...p, files: [file, ...p.files] }));
    return file;
  }, [state.files]);
  const deleteFile = useCallback((id: string) => setState((p) => ({ ...p, files: p.files.filter((v) => v.id !== id) })), []);
  const addComment = useCallback((input: Omit<AudioComment, "id" | "createdAt">) => {
    const comment: AudioComment = { ...input, id: `note-${uid()}`, createdAt: new Date().toISOString() };
    setState(p => ({ ...p, comments: [comment, ...p.comments] })); return comment;
  }, []);
  const deleteComment = useCallback((id: string) => setState(p => ({ ...p, comments: p.comments.filter(c => c.id !== id) })), []);
  const importWorkspace = useCallback((value: Workspace) => { if (!validWorkspace(value)) throw new Error("Arquivo de backup inválido"); setState({ ...value, comments: Array.isArray(value.comments) ? value.comments : [] }); }, []);
  const resetWorkspace = useCallback(() => setState({ clients: [], projects: [], tasks: [], files: [], feedbacks: [], payments: [], comments: [] }), []);
  const value = useMemo<StoreValue>(() => ({
    ...state, hydrated, clientById: (id) => state.clients.find((c) => c.id === id),
    projectById: (id) => state.projects.find((p) => p.id === id),
    addProject, updateProject, deleteProject, addClient, updateClient, deleteClient,
    addTask, updateTask, deleteTask, toggleTask, setProjectStatus,
    addFeedback, deleteFeedback, addPayment, updatePayment, deletePayment, addFile, deleteFile,
    addComment, deleteComment, importWorkspace, resetWorkspace,
  }), [state, hydrated, addProject, updateProject, deleteProject, addClient, updateClient, deleteClient, addTask, updateTask, deleteTask, toggleTask, setProjectStatus, addFeedback, deleteFeedback, addPayment, updatePayment, deletePayment, addFile, deleteFile, addComment, deleteComment, importWorkspace, resetWorkspace]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
