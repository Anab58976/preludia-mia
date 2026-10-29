import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import type { Client } from "@/data/preludia";

export function ClientEditor({ open, onOpenChange, client }: { open: boolean; onOpenChange: (v: boolean) => void; client?: Client }) {
  const store = useStore();
  const [name, setName] = useState(""); const [contact, setContact] = useState("");
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [city, setCity] = useState("");
  useEffect(() => { if (!open) return; setName(client?.name ?? ""); setContact(client?.contact ?? ""); setEmail(client?.email ?? ""); setPhone(client?.phone ?? ""); setCity(client?.city ?? ""); }, [open, client]);
  const save = (event: FormEvent) => {
    event.preventDefault();
    const fields = { name: name.trim(), contact: contact.trim(), email: email.trim(), phone: phone.trim(), city: city.trim() };
    if (!fields.name) { toast.error("Informe o nome do cliente."); return; }
    if (client) store.updateClient(client.id, fields); else store.addClient(fields);
    toast.success(client ? "Cliente atualizado." : "Cliente adicionado."); onOpenChange(false);
  };
  const cls = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={save}>
      <label className="block text-sm">Nome / empresa *<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className={cls}/></label>
      <label className="block text-sm">Pessoa de contato<input value={contact} onChange={e => setContact(e.target.value)} className={cls}/></label>
      <label className="block text-sm">E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} className={cls}/></label>
      <label className="block text-sm">Telefone<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={cls}/></label>
      <label className="block text-sm">Cidade<input value={city} onChange={e => setCity(e.target.value)} className={cls}/></label>
      <button className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-ink-foreground" type="submit">Salvar cliente</button>
    </form>
  </DialogContent></Dialog>;
}
