import Link from "next/link";
import { ArrowUpRight, FileUp } from "lucide-react";
import { Barra, PageHeader, Stat, Vazio } from "@/components/ui";
import { diasAtraso, dPt, emAberto, ESCALOES, escalaoDe, euro, PASSOS, promessas } from "@/lib/cobrancas";
import { sincronizarTarefas } from "@/lib/dados";
import { carregar } from "@/lib/vista";

export default async function Painel() {
  await sincronizarTarefas().catch(() => 0);
  const { hoje, faturas, contactos, lista, cargas, defs } = await carregar();
  const abertas = faturas.filter(emAberto);
  const total = abertas.reduce((s, f) => s + f.em_aberto, 0);
  const porEscalao = ESCALOES.map((e) => {
    const fs = abertas.filter((f) => escalaoDe(diasAtraso(f, hoje)).k === e.k);
    return { ...e, n: fs.length, v: fs.reduce((s, f) => s + f.em_aberto, 0) };
  });
  const mais60 = abertas.filter((f) => diasAtraso(f, hoje) > 60).reduce((s, f) => s + f.em_aberto, 0);
  const acoes = lista.filter((x) => x.passo);
  const falhadas = promessas(contactos, faturas, hoje).filter((p) => p.estado === "falhada").length;
  const ultima = cargas[0];

  return (
    <>
      <PageHeader eyebrow="SERVE Sales" titulo="Cobranças"
        descricao={`Faturas por receber, a partir dos pendentes do TOConline. Avisos aos ${defs.dias[0]} e ${defs.dias[1]} dias, chamada aos ${defs.dias[2]}.`}>
        <Link href="/importar" className="btn-primary"><FileUp size={16} />Carregar pendentes</Link>
      </PageHeader>

      {!faturas.length ? (
        <Vazio>Ainda não há pendentes carregados. Exporte o mapa de pendentes do TOConline e carregue-o em <Link href="/importar" className="text-laranja underline">Carregar pendentes</Link>.</Vazio>
      ) : (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Em dívida" valor={euro(total)} detalhe={`${lista.length} clientes · ${abertas.length} documentos`} destaque />
            <Stat label="Há mais de 60 dias" valor={euro(mais60)} detalhe={total ? `${Math.round((mais60 / total) * 100)}% do total` : undefined} />
            <Stat label="Para fazer" valor={acoes.length} detalhe={<Link href="/tarefas" className="hover:text-laranja">lembretes e chamadas →</Link>} />
            <Stat label="Promessas falhadas" valor={falhadas} detalhe={<Link href="/promessas" className="hover:text-laranja">ver promessas →</Link>} />
          </section>

          <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <section className="card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cinza">Antiguidade da dívida</h2>
              <div className="space-y-3">
                {porEscalao.map((e) => (
                  <div key={e.k}>
                    <div className="mb-1 flex justify-between text-sm"><span className="text-tinta">{e.label}</span><span className="tabular-nums text-cinza">{e.n} doc. · <b className="text-tinta">{euro(e.v)}</b></span></div>
                    <Barra valor={e.v} total={total} cor={e.min > 60 ? "bg-rose-500" : e.min > 30 ? "bg-amber-500" : "bg-laranja"} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Próximos passos</h2>
              {acoes.length ? (
                <div className="card divide-y divide-filete">
                  {acoes.slice(0, 10).map((x) => (
                    <Link key={x.nif} href={`/clientes/${encodeURIComponent(x.nif)}${x.passo === "chamada" || x.passo === "promessa" ? "/chamada" : ""}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-fundo">
                      <span className={`w-32 shrink-0 rounded px-1.5 py-0.5 text-center text-[11px] font-medium ${PASSOS[x.passo!].cor}`}>{PASSOS[x.passo!].curto}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-tinta">{x.nome}</span>
                      <span className="shrink-0 text-xs text-cinza">{x.dias} dias</span>
                      <span className="w-28 shrink-0 text-right font-medium tabular-nums text-tinta">{euro(x.total)}</span>
                      <ArrowUpRight size={14} className="shrink-0 text-cinza" />
                    </Link>
                  ))}
                </div>
              ) : <Vazio>Nada para fazer: ninguém passou dos {defs.dias[0]} dias sem contacto.</Vazio>}
            </section>
          </div>
          <p className="text-xs text-cinza">{ultima ? `Última carga: ${dPt(ultima.carregado_em.slice(0, 10))}, ${ultima.ficheiro ?? ""} · ${ultima.n_faturas} documentos · ${ultima.pagas} pagos desde a carga anterior.` : ""}</p>
        </>
      )}
    </>
  );
}
