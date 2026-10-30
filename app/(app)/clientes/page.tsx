import Link from "next/link";
import Filtros from "@/components/Filtros";
import { PageHeader, Vazio } from "@/components/ui";
import { dPt, euro, labelTipo, PASSOS } from "@/lib/cobrancas";
import { carregar } from "@/lib/vista";

export default async function Dividas({ searchParams }: { searchParams: Promise<{ q?: string; idade?: string; estado?: string; gestor?: string }> }) {
  const sp = await searchParams;
  const { lista } = await carregar();
  const q = (sp.q ?? "").toLowerCase();
  const min = Number(sp.idade ?? 0);
  const gestores = [...new Set(lista.map((x) => x.gestor).filter(Boolean))] as string[];
  const linhas = lista.filter((x) =>
    x.dias >= min &&
    (!sp.gestor || x.gestor === sp.gestor) &&
    (!sp.estado || (sp.estado === "acao" ? !!x.passo : sp.estado === "promessa" ? x.promessa?.estado === "aberta" : sp.estado === "sem_cliente" ? x.nif.startsWith("?") : true)) &&
    (!q || x.nome.toLowerCase().includes(q) || x.nif.includes(q)),
  );
  const total = linhas.reduce((s, x) => s + x.total, 0);
  return (
    <>
      <PageHeader eyebrow="Cobranças" titulo="Dívidas por cliente" descricao={`${linhas.length} clientes · ${euro(total)} em aberto. Ordenado pela fatura mais antiga.`} />
      <Filtros
        campos={[
          { nome: "idade", label: "Antiguidade", valor: sp.idade ?? "", opcoes: [{ value: "", label: "Todas" }, { value: "30", label: "Mais de 30 dias" }, { value: "60", label: "Mais de 60 dias" }, { value: "90", label: "Mais de 90 dias" }] },
          { nome: "estado", label: "Situação", valor: sp.estado ?? "", opcoes: [{ value: "", label: "Todas" }, { value: "acao", label: "Com passo por fazer" }, { value: "promessa", label: "Com promessa em curso" }, { value: "sem_cliente", label: "Sem cliente identificado" }] },
          { nome: "gestor", label: "Gestor", valor: sp.gestor ?? "", opcoes: [{ value: "", label: "Todos" }, ...gestores.map((g) => ({ value: g, label: g }))] },
        ]}
        pesquisa={{ nome: "q", valor: sp.q ?? "", placeholder: "Cliente ou NIF" }}
        limparHref="/clientes"
      />
      {linhas.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-filete bg-banda/60"><tr>
              <th className="th">Cliente</th><th className="th text-right">Em dívida</th><th className="th text-center">Doc.</th><th className="th">Mais antiga</th><th className="th text-center">Dias</th><th className="th">Último contacto</th><th className="th">Próximo passo</th>
            </tr></thead>
            <tbody>
              {linhas.map((x) => (
                <tr key={x.nif} className="border-b border-filete/70 hover:bg-fundo">
                  <td className="td"><Link href={`/clientes/${encodeURIComponent(x.nif)}`} className="font-medium text-tinta hover:text-laranja">{x.nome}</Link><p className="text-xs text-cinza">{x.nif.startsWith("?") ? "sem cliente na Plataforma" : `${x.nif}${x.gestor ? ` · ${x.gestor}` : ""}`}</p></td>
                  <td className="td text-right font-medium tabular-nums">{euro(x.total)}</td>
                  <td className="td text-center">{x.abertas.length}</td>
                  <td className="td whitespace-nowrap text-xs">{x.maisAntiga.numero}<span className="block text-cinza">{dPt(x.maisAntiga.vencimento ?? x.maisAntiga.data)}</span></td>
                  <td className={`td text-center font-medium ${x.dias > 60 ? "text-rose-600" : x.dias > 30 ? "text-amber-700" : "text-cinza"}`}>{x.dias}</td>
                  <td className="td text-xs">{x.ultimoContacto ? <>{labelTipo(x.ultimoContacto.tipo)}<span className="block text-cinza">{dPt(x.ultimoContacto.data)}</span></> : <span className="text-cinza">—</span>}</td>
                  <td className="td">{x.passo ? <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${PASSOS[x.passo].cor}`}>{PASSOS[x.passo].curto}</span> : x.promessa?.estado === "aberta" ? <span className="text-xs text-cinza">Promessa até {dPt(x.promessa.promessa_data)}</span> : <span className="text-xs text-cinza">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Vazio>Nenhum cliente com estes filtros.</Vazio>}
    </>
  );
}
