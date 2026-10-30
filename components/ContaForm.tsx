"use client";

import { useActionState } from "react";
import { alterarMinhaPalavraPasse } from "@/app/actions";

export default function ContaForm() {
  const [res, action, pend] = useActionState(alterarMinhaPalavraPasse, null);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label">Nova palavra-passe</label><input name="password" type="password" minLength={10} required className="input" /></div>
      <div><label className="label">Confirmar</label><input name="confirmar" type="password" minLength={10} required className="input" /></div>
      {res?.erro && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{res.erro}</p>}
      {res?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{res.ok}</p>}
      <button className="btn-primary" disabled={pend}>Guardar</button>
    </form>
  );
}
