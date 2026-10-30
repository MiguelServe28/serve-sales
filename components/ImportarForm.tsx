"use client";

import { useActionState } from "react";
import { FileUp } from "lucide-react";
import { carregarPendentes } from "@/app/actions";

const NOMES: Record<string, string> = { numero: "Documento", nif: "NIF", nome: "Cliente", data: "Data", vencimento: "Vencimento", valor: "Valor", em_aberto: "Pendente" };

export default function ImportarForm() {
  const [res, action, pend] = useActionState(carregarPendentes, null);
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label">Mapa de pendentes (Excel ou CSV)</label>
        <input type="file" name="ficheiro" accept=".xlsx,.xls,.csv" required className="input" />
      </div>
      <button className="btn-primary" disabled={pend}><FileUp size={16} />{pend ? "A carregar…" : "Carregar"}</button>
      {res?.erro && <p className="text-sm text-rose-600">{res.erro}</p>}
      {res?.ok && <p className="text-sm text-emerald-700">{res.ok}</p>}
      {res?.avisos?.map((a) => <p key={a} className="text-sm text-amber-700">{a}</p>)}
      {res?.colunas && Object.keys(res.colunas).length > 0 && (
        <div className="rounded-lg bg-banda px-4 py-3 text-xs text-cinza">
          <p className="mb-1 font-semibold text-tinta">Colunas reconhecidas</p>
          {Object.entries(res.colunas).map(([k, v]) => <p key={k}>{NOMES[k] ?? k}: «{v}»</p>)}
        </div>
      )}
    </form>
  );
}
