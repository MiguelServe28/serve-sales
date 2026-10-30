import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Target } from "lucide-react";
import ContactoForm from "@/components/ContactoForm";
import { PageHeader, Stat } from "@/components/ui";
import { difDias, diasAtraso, dPt, euro, guiao, labelTipo, PASSOS, referencia } from "@/lib/cobrancas";
import { getSessao } from "@/lib/sessao";
import { carregar } from "@/lib/vista";

export default async function Chamada({ params }: { params: Promise<{ nif: string }> }) {
  const nif = decodeURIComponent((await params).nif);
  const [{ hoje, faturas, contactos, lista, equipa, nomeEq }, s] = await Promise.all([carregar(), getSessao()]);
  const d = lista.find((x) => x.nif === nif);
  if (!d) notFound();
  const pagas = faturas.filter((f) => f.nif === nif && f.pago_em);
  const mediaPagar = pagas.length ? Math.round(pagas.reduce((t, f) => t + Math.max(0, difDias(f.pago_em!, referencia(f))), 0) / pagas.length) : null;
  // Promessas falhadas no histórico: datas passadas em que ainda devia
  const falhadas = contactos.filter((c) => c.nif === nif && c.promessa_data && c.promessa_data < hoje &&
    faturas.some((f) => f.nif === nif && f.primeira_vez <= c.data && (!f.pago_em || f.pago_em > c.promessa_data!))).length;
  const eu = equipa.find((e) => e.id === s.equipaId)?.nome?.split(" ")[0];
  const g = guiao(d, { mediaPagar, falhadas, quem: eu ?? "[o seu nome]" });

  return (
    <>
      <Link href={`/clientes/${encodeURIComponent(nif)}`} className="mb-4 inline-flex items-center gap-1 text-sm text-cinza hover:text-tinta"><ArrowLeft size={14} />Ficha de dívida</Link>
      <PageHeader eyebrow={d.passo ? PASSOS[d.passo].titulo : "Chamada de cobrança"} titulo={d.nome}
        descricao={[`NIF ${nif}`, d.cliente?.gestor_nome && `Gestor: ${d.cliente.gestor_nome}`, d.cliente?.email].filter(Boolean).join(" · ")} />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Em dívida" valor={euro(d.total)} detalhe={`${d.abertas.length} documento(s)`} destaque />
        <Stat label="Mais antiga" valor={`${d.dias} dias`} detalhe={`${d.maisAntiga.numero} · venceu a ${dPt(referencia(d.maisAntiga))}`} />
        <Stat label="Paga em média" valor={mediaPagar === null ? "—" : `${mediaPagar} dias`} detalhe="depois do vencimento" />
        <Stat label="Promessas falhadas" valor={falhadas} detalhe={d.promessa ? `Última: até ${dPt(d.promessa.promessa_data)}` : "Nenhuma promessa"} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold"><Phone size={16} className="text-laranja" />O que dizer</h2>
            <div className="space-y-2 text-[15px] leading-relaxed text-tinta">{g.abertura.map((p) => <p key={p}>«{p}»</p>)}</div>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-laranja-suave px-4 py-3 text-sm text-tinta"><Target size={16} className="mt-0.5 shrink-0 text-laranja" /><span><b>Objetivo:</b> {g.objetivo}</span></p>
            {g.nota.length > 0 && (
              <ul className="mt-4 space-y-1 border-l-2 border-amber-300 pl-3 text-sm text-cinza">{g.nota.map((n) => <li key={n}>{n}</li>)}</ul>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-3 text-base font-semibold">Se o cliente disser…</h2>
            <dl className="divide-y divide-filete text-sm">
              {g.respostas.map((r) => (
                <div key={r.se} className="grid gap-1 py-2.5 sm:grid-cols-[220px_1fr] sm:gap-4">
                  <dt className="font-medium text-tinta">{r.se}</dt><dd className="text-cinza">{r.entao}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="mb-2 text-base font-semibold">Para fechar</h2>
            <p className="text-[15px] text-tinta">«{g.fecho}»</p>
            <p className="mt-2 text-xs text-cinza">Depois, registe a chamada aqui ao lado, com a data prometida se houver.</p>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Faturas em aberto</h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Documento</th><th className="th">Vencimento</th><th className="th text-center">Dias</th><th className="th text-right">Em aberto</th></tr></thead>
                <tbody>{d.abertas.map((f) => { const dd = diasAtraso(f, hoje); return (
                  <tr key={f.id} className="border-b border-filete/70"><td className="td font-medium">{f.numero}</td><td className="td">{dPt(referencia(f))}</td>
                    <td className={`td text-center font-medium ${dd > 60 ? "text-rose-600" : dd > 30 ? "text-amber-700" : "text-cinza"}`}>{dd > 0 ? dd : "—"}</td>
                    <td className="td text-right font-medium tabular-nums">{euro(f.em_aberto)}</td></tr>); })}</tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <ContactoForm nif={nif} sugerido="chamada" hoje={hoje} />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Contactos anteriores</h2>
            {d.contactos.length ? (
              <ul className="card divide-y divide-filete text-sm">
                {d.contactos.slice(0, 8).map((x) => (
                  <li key={x.id} className="px-4 py-2.5">
                    <p className="font-medium text-tinta">{dPt(x.data)} · {labelTipo(x.tipo)} <span className="font-normal text-cinza">· {nomeEq(x.por)}</span></p>
                    {x.nota && <p className="text-cinza">{x.nota}</p>}
                    {x.promessa_data && <p className="text-xs text-sky-800">Prometeu pagar até {dPt(x.promessa_data)}{x.promessa_data < hoje ? " (passou)" : ""}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-cinza">Primeiro contacto com este cliente.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
