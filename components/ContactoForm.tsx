"use client";

import { useActionState, useState } from "react";
import { novoContacto } from "@/app/actions";
import { TIPOS_CONTACTO, type TipoContacto } from "@/lib/cobrancas";

export default function ContactoForm({ nif, sugerido, hoje }: { nif: string; sugerido: TipoContacto; hoje: string }) {
  const [res, action, pend] = useActionState(novoContacto, null);
  const [tipo, setTipo] = useState<TipoContacto>(sugerido);
  return (
    <form action={action} className="card space-y-3 p-5">
      <input type="hidden" name="nif" value={nif} />
      <h2 className="text-base font-semibold">Registar contacto</h2>
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <div><label className="label">O que foi feito</label>
          <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoContacto)} className="input">
            {TIPOS_CONTACTO.map((t) => <option key={t.k} value={t.k}>{t.label}</option>)}
          </select>
        </div>
        <div><label className="label">Data</label><input type="date" name="data" defaultValue={hoje} max={hoje} className="input" /></div>
      </div>
      <div><label className="label">Nota</label><textarea name="nota" rows={2} className="input" placeholder={tipo === "chamada" ? "O que o cliente disse" : "Opcional"} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Prometeu pagar até</label><input type="date" name="promessa_data" min={hoje} className="input" /></div>
        <div><label className="label">Valor prometido (€)</label><input name="promessa_valor" inputMode="decimal" placeholder="Opcional" className="input" /></div>
      </div>
      <p className="text-[11px] text-cinza">Com data prometida, a escada pára até esse dia. Se passar sem pagamento, volta a aparecer como promessa falhada.</p>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm ${res?.erro ? "text-rose-600" : "text-emerald-700"}`}>{res?.erro ?? res?.ok ?? ""}</p>
        <button className="btn-primary" disabled={pend}>{pend ? "A guardar…" : "Registar"}</button>
      </div>
    </form>
  );
}
