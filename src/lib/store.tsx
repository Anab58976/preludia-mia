import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  clients as seedClients,
  feedbacks as seedFeedbacks,
  files as seedFiles,
  payments as seedPayments,
  projects as seedProjects,
  tasks as seedTasks,
  type Client,
  type Feedback,
  type Priority,
  type Project,
  type ProjectFile,
  type ProjectStatus,
  type Task,
  type Payment,
} from "@/data/preludia";

type NewProject = {
  title: string;
  clientId: string;
  type: string;
  deadline: string;
  budget: number;
};

type NewTask = {
  projectId: string;
  title: string;
  priority: Priority;
  dueDate: string;
};

type StoreValue = {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  files: ProjectFile[];
  feedbacks: Feedback[];
  payments: Payment[];
  clientById: (id: string) => Client | undefined;
  projectById: (id: string) => Project | undefined;
  addProject: (input: NewProject) => Project;
  addTask: (input: NewTask) => Task;
  toggleTask: (id: string) => void;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  addFeedback: (feedback: Omit<Feedback, "id">) => Feedback;
};

const StoreContext = createContext<StoreValue | null>(null);

const uid = () => Math.random().toString(36).slice(2, 9);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients] = useState<Client[]>(seedClients);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [files] = useState<ProjectFile[]>(seedFiles);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(seedFeedbacks);
  const [payments] = useState<Payment[]>(seedPayments);

  const addProject = useCallback(
    (input: NewProject) => {
      const project: Project = {
        id: `p-${uid()}`,
        title: input.title,
        clientId: input.clientId,
        type: input.type,
        status: "Orçamento",
        deadline: input.deadline,
        createdAt: new Date().toISOString().slice(0, 10),
        budget: input.budget,
        paid: 0,
        progress: 0,
        sheet: {
          originalKey: "A definir",
          arrangementKey: "A definir",
          bpm: 0,
          duration: "A definir",
          timeSignature: "A definir",
          instrumentation: [],
          structure: "A definir",
          notes: "",
        },
      };
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [],
  );

  const addTask = useCallback((input: NewTask) => {
    const task: Task = { id: `t-${uid()}`, done: false, ...input };
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const setProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const addFeedback = useCallback((feedback: Omit<Feedback, "id">) => {
    const created: Feedback = { id: `fb-${uid()}`, ...feedback };
    setFeedbacks((prev) => [created, ...prev]);
    return created;
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      clients,
      projects,
      tasks,
      files,
      feedbacks,
      payments,
      clientById: (id) => clients.find((c) => c.id === id),
      projectById: (id) => projects.find((p) => p.id === id),
      addProject,
      addTask,
      toggleTask,
      setProjectStatus,
      addFeedback,
    }),
    [clients, projects, tasks, files, feedbacks, payments, addProject, addTask, toggleTask, setProjectStatus, addFeedback],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
