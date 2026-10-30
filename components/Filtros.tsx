"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export type OpcaoFiltro = { value: string; label: string };
export type CampoFiltro = { nome: string; label: string; valor: string; opcoes: OpcaoFiltro[]; largura?: string };

/**
 * Barra de filtros única para todas as páginas: listas pendentes + pesquisa, numa só linha.
 * Cada alteração muda o endereço (?nome=valor) e a página recarrega com os novos filtros.
 */
export default function Filtros({ campos, pesquisa, limparHref, children }: {
  campos: CampoFiltro[];
  pesquisa?: { nome: string; valor: string; placeholder: string };
  limparHref?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(pesquisa?.valor ?? "");
  const primeira = useRef(true);
  const ir = (nome: string, valor: string) => {
    const p = new URLSearchParams(window.location.search);
    if (valor) p.set(nome, valor); else p.delete(nome);
    router.push(`${path}${p.toString() ? `?${p}` : ""}`);
  };
  useEffect(() => {
    if (!pesquisa) return;
    if (primeira.current) { primeira.current = false; return; }
    const t = setTimeout(() => ir(pesquisa.nome, q.trim()), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <div className="card mb-5 flex flex-wrap items-end gap-3 px-4 py-3">
      {campos.map((c) => (
        <label key={c.nome} className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-cinza">{c.label}</span>
          <select value={c.valor} onChange={(e) => ir(c.nome, e.target.value)} className={`input h-9 py-0 ${c.largura ?? "w-44"}`}>
            {c.opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      ))}
      {pesquisa && (
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-cinza">Pesquisar</span>
          <span className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cinza" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input h-9 pl-9" placeholder={pesquisa.placeholder} />
          </span>
        </label>
      )}
      {children}
      {limparHref && <a href={limparHref} className="ml-auto inline-flex h-9 items-center gap-1 text-xs text-cinza hover:text-tinta"><X size={13} />Limpar filtros</a>}
    </div>
  );
}
