"use client";

import { useActionState } from "react";
import { entrar } from "@/app/actions";

export default function LoginForm() {
  const [res, action, pend] = useActionState(entrar, undefined);
  return (
    <form action={action} className="space-y-4">
      <div><label className="label">Email</label><input name="email" type="email" required className="input" placeholder="nome@serve.pt" /></div>
      <div><label className="label">Palavra-passe</label><input name="password" type="password" required className="input" /></div>
      {res?.erro && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{res.erro}</p>}
      <button className="btn-primary w-full" disabled={pend}>{pend ? "A entrar…" : "Entrar"}</button>
    </form>
  );
}
