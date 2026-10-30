import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { atualizarTarefas } from "@/app/actions";
import { PageHeader, Vazio } from "@/components/ui";
import { dPt, euro, PASSOS, type Passo } from "@/lib/cobrancas";
import { listTarefas, sincronizarTarefas } from "@/lib/dados";
import { carregar } from "@/lib/vista";

export default async function ParaFazer() {
  await sincronizarTarefas().catch(() => 0);
  const [{ hoje, lista }, tarefas] = await Promise.all([carregar(), listTarefas()]);
  const abertas = tarefas.filter((t) => t.estado === "aberta");
  const feitas = tarefas.filter((t) => t.estado === "concluida").sort((a, b) => b.prazo.localeCompare(a.prazo)).slice(0, 15);
  const passoDe = (periodo: string) => periodo.split(":")[0] as Passo;
  const div = (nif: string) => lista.find((x) => x.nif === nif);
  return (
    <>
      <PageHeader eyebrow="Cobranças" titulo="Para fazer"
        descricao="Lembretes e chamadas da escada de cobrança. Ficam feitos ao registar o contacto na ficha do cliente.">
        <form action={atualizarTarefas}><button className="btn-ghost"><RefreshCw size={14} />Atualizar</button></form>
      </PageHeader>
      {abertas.length ? (
        <div className="card mb-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Prazo</th><th className="th">O que fazer</th><th className="th">Cliente</th><th className="th text-right">Em dívida</th><th className="th text-center">Dias</th><th className="th" /></tr></thead>
            <tbody>
              {abertas.map((t) => { const d = div(t.nif); const p = passoDe(t.periodo); return (
                <tr key={t.id} className="border-b border-filete/70 hover:bg-fundo">
                  <td className={`td whitespace-nowrap font-medium ${t.prazo < hoje ? "text-rose-600" : "text-tinta"}`}>{dPt(t.prazo)}</td>
                  <td className="td"><span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${PASSOS[p]?.cor ?? ""}`}>{PASSOS[p]?.curto ?? t.titulo}</span></td>
                  <td className="td font-medium">{d?.nome ?? t.nif}</td>
                  <td className="td text-right tabular-nums">{d ? euro(d.total) : "—"}</td>
                  <td className="td text-center">{d?.dias ?? "—"}</td>
                  <td className="td text-right">{p === "chamada" || p === "promessa"
                    ? <Link href={`/clientes/${t.nif}/chamada`} className="btn-primary">Ligar</Link>
                    : <Link href={`/clientes/${t.nif}`} className="btn-ghost">Registar</Link>}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      ) : <Vazio>Nada para fazer neste momento.</Vazio>}
      {feitas.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Feito recentemente</h2>
          <ul className="space-y-1 text-sm">{feitas.map((t) => <li key={t.id} className="flex justify-between gap-3"><span className="text-tinta">{PASSOS[passoDe(t.periodo)]?.curto ?? t.titulo} · {div(t.nif)?.nome ?? t.nif}</span><span className="text-xs text-cinza">prazo {dPt(t.prazo)}</span></li>)}</ul>
        </>
      )}
    </>
  );
}
