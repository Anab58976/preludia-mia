/** Armazena arquivos reais no IndexedDB deste navegador; não é um armazenamento em nuvem. */
const DB_NAME = "preludia-arquivos-v1";
const STORE_NAME = "blobs";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function request<T>(mode: IDBTransactionMode, task: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const operation = task(transaction.objectStore(STORE_NAME));
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}
export const saveBlob = (id: string, blob: Blob) => request("readwrite", (s) => s.put(blob, id));
export const getBlob = (id: string) => request<Blob | undefined>("readonly", (s) => s.get(id));
export const removeBlob = (id: string) => request("readwrite", (s) => s.delete(id));
export async function downloadFile(id: string, name: string) {
  const blob = await getBlob(id);
  if (!blob) throw new Error("Arquivo de exemplo ou indisponível neste navegador.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = name;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
