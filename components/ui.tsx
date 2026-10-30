import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MES_INICIO, nomeMes, somaMes } from "@/lib/dates";

export function PageHeader({
  eyebrow, titulo, descricao, children,
}: { eyebrow?: string; titulo: string; descricao?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold leading-tight">{titulo}</h1>
        {descricao && <p className="mt-1.5 max-w-2xl text-sm text-cinza">{descricao}</p>}
        <div className="mt-3 h-0.5 w-10 rounded bg-laranja" />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function MonthNav({ mes, base, query, inicio = MES_INICIO }: { mes: string; base: string; query?: string; inicio?: string }) {
  const q = query ? `&${query}` : "";
  return (
    <div className="flex items-center gap-1 rounded-lg border border-filete bg-white p-1 shadow-card">
      {mes > inicio ? (
        <Link href={`${base}?mes=${somaMes(mes, -1)}${q}`} className="rounded-md p-1.5 text-cinza hover:bg-banda hover:text-tinta" aria-label="Mês anterior">
          <ChevronLeft size={16} />
        </Link>
      ) : <span className="p-1.5 text-filete" aria-hidden><ChevronLeft size={16} /></span>}
      <span className="min-w-[132px] text-center text-sm font-medium capitalize text-tinta">{nomeMes(mes)}</span>
      <Link href={`${base}?mes=${somaMes(mes, 1)}${q}`} className="rounded-md p-1.5 text-cinza hover:bg-banda hover:text-tinta" aria-label="Mês seguinte">
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export function Stat({ label, valor, detalhe, destaque }: { label: string; valor: React.ReactNode; detalhe?: React.ReactNode; destaque?: boolean }) {
  return (
    <div className={`card p-5 ${destaque ? "border-laranja/40 bg-laranja-suave" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-cinza">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none text-tinta">{valor}</p>
      {detalhe && <div className="mt-2 text-xs text-cinza">{detalhe}</div>}
    </div>
  );
}

export function Barra({ valor, total, cor = "bg-laranja" }: { valor: number; total: number; cor?: string }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-banda">
      <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-filete bg-white/60 px-6 py-10 text-center text-sm text-cinza">{children}</div>;
}
