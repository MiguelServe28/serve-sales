import Link from "next/link";
import { PageHeader, Vazio } from "@/components/ui";
import { dPt, euro, promessas } from "@/lib/cobrancas";
import { carregar } from "@/lib/vista";

const COR = { aberta: "bg-sky-50 text-sky-800", falhada: "bg-rose-50 text-rose-700", cumprida: "bg-emerald-50 text-emerald-700" } as const;
const NOME = { aberta: "Em curso", falhada: "Falhada", cumprida: "Cumprida" } as const;

export default async function Promessas() {
  const { hoje, contactos, faturas, clientes, lista, nomeEq } = await carregar();
  const ps = promessas(contactos, faturas, hoje);
  const ordem = { falhada: 0, aberta: 1, cumprida: 2 } as const;
  const nome = (nif: string) => clientes.find((c) => c.nif === nif)?.nome ?? nif;
  return (
    <>
      <PageHeader eyebrow="Cobranças" titulo="Promessas de pagamento" descricao="A promessa mais recente de cada cliente. Falhada = a data passou e ainda há faturas em aberto; cumprida = já não deve nada." />
      {ps.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Estado</th><th className="th">Cliente</th><th className="th">Prometeu até</th><th className="th text-right">Valor prometido</th><th className="th text-right">Em dívida hoje</th><th className="th">Registado</th></tr></thead>
            <tbody>
              {[...ps].sort((a, b) => ordem[a.estado] - ordem[b.estado]).map((p) => (
                <tr key={p.id} className="border-b border-filete/70 hover:bg-fundo">
                  <td className="td"><span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${COR[p.estado]}`}>{NOME[p.estado]}</span></td>
                  <td className="td"><Link href={`/clientes/${p.nif}`} className="font-medium text-tinta hover:text-laranja">{nome(p.nif)}</Link></td>
                  <td className="td">{dPt(p.promessa_data)}</td>
                  <td className="td text-right tabular-nums">{p.promessa_valor ? euro(p.promessa_valor) : "—"}</td>
                  <td className="td text-right tabular-nums">{euro(lista.find((x) => x.nif === p.nif)?.total ?? 0)}</td>
                  <td className="td text-xs text-cinza">{dPt(p.data)} · {nomeEq(p.por)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Vazio>Ainda não há promessas registadas. Registam-se na ficha de dívida do cliente, ao registar um contacto.</Vazio>}
    </>
  );
}
