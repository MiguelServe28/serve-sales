"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { eliminarContacto } from "@/app/actions";

export default function ApagarContacto({ id }: { id: string }) {
  const [pend, start] = useTransition();
  return (
    <button type="button" disabled={pend} title="Apagar registo" className="rounded p-1 text-cinza hover:text-rose-600"
      onClick={() => { if (window.confirm("Apagar este registo de contacto?")) start(() => eliminarContacto(id)); }}>
      <Trash2 size={14} />
    </button>
  );
}
