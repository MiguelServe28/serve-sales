import ImportarForm from "@/components/ImportarForm";
import { PageHeader, Vazio } from "@/components/ui";
import { dPt, euro } from "@/lib/cobrancas";
import { listCargas } from "@/lib/dados";

export default async function Importar() {
  const cargas = await listCargas();
  return (
    <>
      <PageHeader eyebrow="Dados" titulo="Carregar pendentes"
        descricao="Exporte do TOConline o mapa de pendentes de clientes e carregue-o aqui, de preferência uma vez por semana. Cada carga substitui a anterior: os documentos que deixam de aparecer ficam como pagos nesse dia." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div>
          <ImportarForm />
          <p className="mt-3 text-xs text-cinza">O ficheiro tem de ter, pelo menos, o número do documento e o NIF ou o nome do cliente. Data, vencimento, valor e valor pendente são reconhecidos pelo título da coluna.</p>
        </div>
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Cargas anteriores</h2>
          {cargas.length ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Data</th><th className="th">Ficheiro</th><th className="th text-center">Documentos</th><th className="th text-right">Em aberto</th><th className="th text-center">Pagos</th></tr></thead>
                <tbody>{cargas.map((c) => <tr key={c.id} className="border-b border-filete/70"><td className="td">{dPt(c.carregado_em.slice(0, 10))}</td><td className="td text-xs">{c.ficheiro}</td><td className="td text-center">{c.n_faturas}</td><td className="td text-right tabular-nums">{euro(Number(c.total))}</td><td className="td text-center">{c.pagas}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <Vazio>Ainda não houve cargas.</Vazio>}
        </section>
      </div>
    </>
  );
}
