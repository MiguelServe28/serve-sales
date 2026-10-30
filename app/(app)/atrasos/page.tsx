import Link from "next/link";
import { PageHeader, Vazio } from "@/components/ui";
import { euro, pagamTarde } from "@/lib/cobrancas";
import { carregar } from "@/lib/vista";

export default async function PagamTarde() {
  const { hoje, faturas, clientes } = await carregar();
  const l = pagamTarde(faturas, clientes, hoje);
  return (
    <>
      <PageHeader eyebrow="Cobranças" titulo="Clientes que pagam tarde"
        descricao="Clientes que costumam pagar mais de 30 dias depois do vencimento. Bons candidatos a débito direto." />
      {l.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Cliente</th><th className="th">Gestor</th><th className="th text-center">Pagas</th><th className="th text-center">Pagas com +30 dias</th><th className="th text-center">Média de dias</th><th className="th text-center">Em aberto +60 dias</th><th className="th text-right">Em dívida</th></tr></thead>
            <tbody>
              {l.map((x) => (
                <tr key={x.nif} className="border-b border-filete/70 hover:bg-fundo">
                  <td className="td"><Link href={`/clientes/${x.nif}`} className="font-medium text-tinta hover:text-laranja">{x.nome}</Link></td>
                  <td className="td text-cinza">{x.gestor ?? "—"}</td>
                  <td className="td text-center">{x.pagas}</td>
                  <td className="td text-center">{x.tarde}</td>
                  <td className={`td text-center font-medium ${(x.media ?? 0) > 30 ? "text-amber-700" : ""}`}>{x.media ?? "—"}</td>
                  <td className={`td text-center ${x.abertasVelhas ? "font-medium text-rose-600" : ""}`}>{x.abertasVelhas}</td>
                  <td className="td text-right tabular-nums">{euro(x.emDivida)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Vazio>Ainda não há histórico suficiente. Fica mais rico a cada carga de pendentes: quando uma fatura deixa de aparecer, fica registada a data em que foi paga.</Vazio>}
    </>
  );
}
