"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Opcao = { value: string; label: string; sub?: string };

/** Lista com pesquisa (por nome ou NIF) que envia `name` num formulário. */
export default function SearchSelect({
  name, opcoes, placeholder = "Escolher…", required, defaultValue, onChange,
}: { name: string; opcoes: Opcao[]; placeholder?: string; required?: boolean; defaultValue?: string; onChange?: (v: string) => void }) {
  const [valor, setValor] = useState(defaultValue ?? "");
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const atual = opcoes.find((o) => o.value === valor);
  const lista = useMemo(() => {
    const t = q.toLowerCase();
    return opcoes.filter((o) => !t || o.label.toLowerCase().includes(t) || (o.sub ?? "").includes(t)).slice(0, 60);
  }, [opcoes, q]);
  return (
    <div ref={ref} className="relative" onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setAberto(false); }}>
      <input type="hidden" name={name} value={valor} required={required} />
      <button type="button" onClick={() => setAberto(!aberto)} className="input flex items-center justify-between text-left">
        <span className={atual ? "truncate text-tinta" : "text-cinza/70"}>{atual ? atual.label : placeholder}</span>
        <ChevronDown size={15} className="shrink-0 text-cinza" />
      </button>
      {aberto && (
        <div className="absolute z-40 mt-1 w-full rounded-lg border border-filete bg-white p-1.5 shadow-lg">
          <input autoFocus className="input mb-1.5" placeholder="Procurar por nome ou NIF" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="max-h-64 overflow-y-auto">
            {lista.map((o) => (
              <li key={o.value}>
                <button type="button" onClick={() => { setValor(o.value); setAberto(false); setQ(""); onChange?.(o.value); }}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-banda ${o.value === valor ? "bg-laranja-suave" : ""}`}>
                  <span className="block truncate text-tinta">{o.label}</span>
                  {o.sub && <span className="text-xs text-cinza">{o.sub}</span>}
                </button>
              </li>
            ))}
            {!lista.length && <li className="px-2.5 py-2 text-sm text-cinza">Sem resultados.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
