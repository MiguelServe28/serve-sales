import { PageHeader, Vazio } from "@/components/ui";
import { euro, mesesComDados, prazoDe, prazosPorMes } from "@/lib/cobrancas";
import { nomeMes } from "@/lib/dates";
import { carregar } from "@/lib/vista";

const curto = (mes: string) => nomeMes(mes).replace(/ de /, " ").replace(/^(\w{3})\w*/, "$1");

export default async function Prazos() {
  const { hoje, faturas, clientes } = await carregar();
  const meses = mesesComDados(faturas, hoje).slice(-12);
  const linhas = prazosPorMes(faturas, meses);
  const comDados = linhas.filter((l) => l.n);
  if (!comDados.length) return (<><PageHeader eyebrow="Análise" titulo="Prazo de recebimento" /><Vazio>Ainda não há faturas pagas registadas. O prazo é calculado quando uma fatura deixa de aparecer nos pendentes, por isso precisa de pelo menos duas cargas.</Vazio></>);
  const max = Math.max(30, ...comDados.map((l) => l.diasVencimento ?? 0));
  // Últimos 3 meses, por gestor
  const desde = `${meses.at(-3) ?? meses[0]}-01`;
  const gestorDe = new Map(clientes.map((c) => [c.nif, c.gestor_nome ?? "Sem gestor"]));
  const recentes = faturas.filter((f) => f.pago_em && f.pago_em >= desde);
  const porGestor = [...new Set(recentes.map((f) => (f.nif && gestorDe.get(f.nif)) || "Sem gestor"))]
    .map((g) => ({ g, ...prazoDe(recentes.filter((f) => ((f.nif && gestorDe.get(f.nif)) || "Sem gestor") === g)) }))
    .sort((a, b) => (b.diasVencimento ?? 0) - (a.diasVencimento ?? 0));
  const geral = prazoDe(recentes);

  return (
    <>
      <PageHeader eyebrow="Análise" titulo="Prazo de recebimento"
        descricao="Quantos dias os clientes demoram a pagar, mês a mês. O objetivo é que a barra desça." />

      <section className="card mb-6 p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-cinza">Dias depois do vencimento, em média</h2>
        <p className="mb-5 text-xs text-cinza">A linha tracejada marca os 30 dias (o 1.º lembrete).</p>
        <div className="relative flex h-56 items-end gap-3 border-b border-filete pb-0">
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-400" style={{ bottom: `${(30 / max) * 100}%` }} />
          {linhas.map((l) => (
            <div key={l.mes} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs font-medium tabular-nums text-tinta">{l.diasVencimento ?? ""}</span>
              <div className={`w-full max-w-[56px] rounded-t ${l.diasVencimento === null ? "" : l.diasVencimento > 30 ? "bg-amber-500" : "bg-laranja"}`}
                style={{ height: l.diasVencimento === null ? 0 : `${Math.max(2, (l.diasVencimento / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-3">{linhas.map((l) => <span key={l.mes} className="flex-1 text-center text-[11px] capitalize text-cinza">{curto(l.mes)}</span>)}</div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Mês a mês</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-filete bg-banda/60"><tr>
                <th className="th">Mês</th><th className="th text-center">Pagas</th><th className="th text-right">Recebido</th>
                <th className="th text-center">Dias desde a emissão</th><th className="th text-center">Dias depois do vencimento</th>
                <th className="th text-center">Pesado pelo valor</th><th className="th text-center">Pagas até 30 dias</th>
              </tr></thead>
              <tbody>{[...linhas].reverse().map((l) => (
                <tr key={l.mes} className="border-b border-filete/70">
                  <td className="td whitespace-nowrap capitalize">{nomeMes(l.mes)}</td>
                  <td className="td text-center">{l.n || "—"}</td>
                  <td className="td whitespace-nowrap text-right tabular-nums">{l.n ? euro(l.valor) : "—"}</td>
                  <td className="td text-center">{l.diasEmissao ?? "—"}</td>
                  <td className={`td text-center font-medium ${(l.diasVencimento ?? 0) > 30 ? "text-amber-700" : ""}`}>{l.diasVencimento ?? "—"}</td>
                  <td className="td text-center">{l.ponderado ?? "—"}</td>
                  <td className="td text-center">{l.ate30 === null ? "—" : `${l.ate30}%`}</td>
                </tr>))}</tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-cinza">«Pesado pelo valor» dá mais peso às faturas maiores: se for muito acima da média simples, são as faturas grandes que estão a atrasar.</p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Por gestor · últimos 3 meses</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Gestor</th><th className="th text-center">Pagas</th><th className="th text-center">Dias depois do vencimento</th><th className="th text-center">Até 30 dias</th></tr></thead>
              <tbody>
                {porGestor.map((x) => (
                  <tr key={x.g} className="border-b border-filete/70">
                    <td className="td">{x.g}</td><td className="td text-center">{x.n}</td>
                    <td className={`td text-center font-medium ${(x.diasVencimento ?? 0) > 30 ? "text-amber-700" : ""}`}>{x.diasVencimento ?? "—"}</td>
                    <td className="td text-center">{x.ate30 === null ? "—" : `${x.ate30}%`}</td>
                  </tr>))}
                <tr className="bg-banda/40"><td className="td font-medium">Total</td><td className="td text-center">{geral.n}</td><td className="td text-center font-medium">{geral.diasVencimento ?? "—"}</td><td className="td text-center">{geral.ate30 === null ? "—" : `${geral.ate30}%`}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-cinza">Não é para cobrar ao gestor: serve para ver se há carteiras onde vale a pena propor débito direto.</p>
        </section>
      </div>
      <p className="mt-6 text-xs text-cinza">A data de pagamento é a da carga em que a fatura deixou de aparecer nos pendentes; com cargas semanais, os dias podem estar inflacionados até 7.</p>
    </>
  );
}
