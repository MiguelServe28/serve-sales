import Link from "next/link";
import Imprimir from "@/components/Imprimir";
import { MonthNav, PageHeader, Vazio } from "@/components/ui";
import { dPt, euro, mesAnterior, mesesComDados, resumoMes, TIPOS_CONTACTO } from "@/lib/cobrancas";
import { nomeMes } from "@/lib/dates";
import { carregar } from "@/lib/vista";

function Delta({ atual, antes, menosEMelhor = true, euros = true }: { atual: number; antes: number | null; menosEMelhor?: boolean; euros?: boolean }) {
  if (antes === null) return null;
  const dif = atual - antes;
  if (Math.abs(dif) < 0.5) return <span className="text-cinza">igual ao mês anterior</span>;
  const bom = menosEMelhor ? dif < 0 : dif > 0;
  return <span className={bom ? "text-emerald-700" : "text-rose-600"}>{dif > 0 ? "+" : "−"}{euros ? euro(Math.abs(dif)) : Math.abs(Math.round(dif))} vs. mês anterior</span>;
}

function Caixa({ label, valor, children, destaque }: { label: string; valor: React.ReactNode; children?: React.ReactNode; destaque?: boolean }) {
  return (
    <div className={`card p-5 ${destaque ? "border-laranja/40 bg-laranja-suave" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-cinza">{label}</p>
      <p className="mt-2 text-[26px] font-semibold leading-none text-tinta">{valor}</p>
      {children && <div className="mt-2 text-xs">{children}</div>}
    </div>
  );
}

export default async function Resumo({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { hoje, faturas, contactos, clientes, defs } = await carregar();
  if (!faturas.length) return (<><PageHeader eyebrow="Análise" titulo="Resumo mensal" /><Vazio>O resumo aparece depois da primeira carga de pendentes.</Vazio></>);
  const meses = mesesComDados(faturas, hoje);
  const pedido = (await searchParams).mes;
  const mes = pedido && meses.includes(pedido) ? pedido : meses.at(-1)!;
  const r = resumoMes(faturas, contactos, clientes, mes, hoje, defs);
  const temAnterior = meses.includes(mesAnterior(mes));
  const a = temAnterior ? resumoMes(faturas, contactos, clientes, mesAnterior(mes), hoje, defs) : null;
  const emCurso = r.fim === hoje;
  const totalContactos = Object.values(r.contactos).reduce((x, y) => x + y, 0);

  return (
    <>
      <PageHeader eyebrow="Análise" titulo={`Resumo de ${nomeMes(mes)}`}
        descricao={`Dívida, recebimentos e cobranças ${emCurso ? `até hoje` : `no fim do mês`}.${a ? " Comparado com o mês anterior." : ""}`}>
        <MonthNav mes={mes} base="/resumo" inicio={meses[0]} />
        <Imprimir />
      </PageHeader>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Caixa label="Em dívida" valor={euro(r.foto.total)} destaque>
          <p className="text-cinza">{r.foto.clientes} clientes · {r.foto.documentos} documentos</p>
          <Delta atual={r.foto.total} antes={a?.foto.total ?? null} />
        </Caixa>
        <Caixa label="Vencida há mais de 60 dias" valor={euro(r.foto.mais60)}>
          <p className="text-cinza">{r.foto.total ? Math.round((r.foto.mais60 / r.foto.total) * 100) : 0}% da dívida</p>
          <Delta atual={r.foto.mais60} antes={a?.foto.mais60 ?? null} />
        </Caixa>
        <Caixa label="Recebido no mês" valor={euro(r.recebido.valor)}>
          <p className="text-cinza">{r.recebido.n} documentos pagos</p>
          <Delta atual={r.recebido.valor} antes={a?.recebido.valor ?? null} menosEMelhor={false} />
        </Caixa>
        <Caixa label="Prazo médio de recebimento" valor={r.prazo.diasVencimento === null ? "—" : `${r.prazo.diasVencimento} dias`}>
          <p className="text-cinza">depois do vencimento · <Link href="/prazos" className="hover:text-laranja">ver evolução →</Link></p>
          {r.prazo.diasVencimento !== null && a?.prazo.diasVencimento != null && <Delta atual={r.prazo.diasVencimento} antes={a.prazo.diasVencimento} euros={false} />}
        </Caixa>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Os 5 maiores devedores</h2>
          {r.foto.top.length ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Cliente</th><th className="th text-center">Dias da mais antiga</th><th className="th text-right">Em dívida</th><th className="th text-right">% do total</th></tr></thead>
                <tbody>{r.foto.top.map((x) => (
                  <tr key={x.nif} className="border-b border-filete/70">
                    <td className="td"><Link href={`/clientes/${encodeURIComponent(x.nif)}`} className="font-medium text-tinta hover:text-laranja">{x.nome}</Link></td>
                    <td className={`td text-center ${x.dias > 60 ? "font-medium text-rose-600" : x.dias > 30 ? "text-amber-700" : "text-cinza"}`}>{x.dias > 0 ? x.dias : "—"}</td>
                    <td className="td text-right font-medium tabular-nums">{euro(x.total)}</td>
                    <td className="td text-right text-cinza">{r.foto.total ? Math.round((x.total / r.foto.total) * 100) : 0}%</td>
                  </tr>))}</tbody>
              </table>
            </div>
          ) : <Vazio>Sem dívida neste mês.</Vazio>}
        </section>

        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Entraram em atraso</h2>
            <p className="text-sm text-tinta"><b>{r.entraramAtraso.n}</b> documentos, <b>{euro(r.entraramAtraso.valor)}</b>, passaram os {defs.dias[0]} dias sem estar pagos.</p>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Trabalho de cobrança</h2>
            <ul className="space-y-1 text-sm">
              {TIPOS_CONTACTO.map((t) => <li key={t.k} className="flex justify-between"><span className="text-cinza">{t.label}</span><b className="tabular-nums text-tinta">{r.contactos[t.k]}</b></li>)}
              <li className="flex justify-between border-t border-filete pt-1"><span className="text-tinta">Total de contactos</span><b className="tabular-nums">{totalContactos}</b></li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Promessas de pagamento</h2>
            <p className="mb-2 text-sm text-cinza">{r.promessas.feitas} feitas neste mês. Das que venciam neste mês:</p>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-emerald-50 py-2"><p className="text-xl font-semibold text-emerald-700">{r.promessas.cumpridas}</p><p className="text-xs text-cinza">cumpridas</p></div>
              <div className="rounded-lg bg-rose-50 py-2"><p className="text-xl font-semibold text-rose-600">{r.promessas.falhadas}</p><p className="text-xs text-cinza">falhadas</p></div>
              <div className="rounded-lg bg-banda py-2"><p className="text-xl font-semibold text-tinta">{r.promessas.pendentes}</p><p className="text-xs text-cinza">por confirmar</p></div>
            </div>
          </div>
        </section>
      </div>
      <p className="mt-6 text-xs text-cinza">A data de pagamento é a da carga de pendentes em que a fatura deixou de aparecer, por isso pode ter até uma semana de diferença. Pagamentos parciais entre cargas não contam como recebidos até a fatura ficar paga.</p>
    </>
  );
}
