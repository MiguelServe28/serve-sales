import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import ApagarContacto from "@/components/ApagarContacto";
import ContactoForm from "@/components/ContactoForm";
import { PageHeader, Stat, Vazio } from "@/components/ui";
import { difDias, diasAtraso, dPt, emAberto, euro, labelTipo, PASSOS, referencia, type TipoContacto } from "@/lib/cobrancas";
import { carregar } from "@/lib/vista";

export default async function FichaDivida({ params }: { params: Promise<{ nif: string }> }) {
  const nif = decodeURIComponent((await params).nif);
  const { hoje, faturas, contactos, clientes, lista, nomeEq } = await carregar();
  const c = clientes.find((x) => x.nif === nif) ?? null;
  const d = lista.find((x) => x.nif === nif) ?? null;
  const minhas = faturas.filter((f) => (f.nif ?? `?${f.nome ?? f.numero}`) === nif);
  const abertas = minhas.filter(emAberto).sort((a, b) => referencia(a).localeCompare(referencia(b)));
  const pagas = minhas.filter((f) => f.pago_em).sort((a, b) => b.pago_em!.localeCompare(a.pago_em!));
  const cs = contactos.filter((x) => x.nif === nif);
  const nome = c?.nome ?? d?.nome ?? minhas[0]?.nome ?? nif;
  const sugerido: TipoContacto = d?.passo === "lembrete1" ? "lembrete1" : d?.passo === "lembrete2" ? "lembrete2" : d?.passo ? "chamada" : "email";
  const plataforma = process.env.NEXT_PUBLIC_URL_PLATAFORMA;
  const mediaPagar = pagas.length ? Math.round(pagas.reduce((s, f) => s + Math.max(0, difDias(f.pago_em!, referencia(f))), 0) / pagas.length) : null;

  return (
    <>
      <Link href="/clientes" className="mb-4 inline-flex items-center gap-1 text-sm text-cinza hover:text-tinta"><ArrowLeft size={14} />Dívidas por cliente</Link>
      <PageHeader eyebrow="Ficha de dívida" titulo={nome} descricao={[nif.startsWith("?") ? "Sem cliente identificado na Plataforma" : `NIF ${nif}`, c?.gestor_nome && `Gestor: ${c.gestor_nome}`, c?.email].filter(Boolean).join(" · ")}>
        {c && plataforma && <a href={`${plataforma}/clientes/${nif}`} className="btn-ghost"><ExternalLink size={14} />Ficha na Plataforma</a>}
      </PageHeader>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Em dívida" valor={euro(d?.total ?? 0)} detalhe={`${abertas.length} documento(s)`} destaque={!!d} />
        <Stat label="Mais antiga" valor={d ? `${d.dias} dias` : "—"} detalhe={d ? d.maisAntiga.numero : "Nada em aberto"} />
        <Stat label="Próximo passo" valor={<span className="text-lg">{d?.passo ? PASSOS[d.passo].curto : d?.promessa?.estado === "aberta" ? "Aguardar promessa" : "—"}</span>} detalhe={d?.promessa?.estado === "aberta" ? `Prometeu pagar até ${dPt(d.promessa.promessa_data)}` : undefined} />
        <Stat label="Paga em média" valor={mediaPagar === null ? "—" : `${mediaPagar} dias`} detalhe={`depois do vencimento · ${pagas.length} pagas`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Em aberto</h2>
            {abertas.length ? (
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Documento</th><th className="th">Data</th><th className="th">Vencimento</th><th className="th text-center">Dias</th><th className="th text-right">Valor</th><th className="th text-right">Em aberto</th></tr></thead>
                  <tbody>{abertas.map((f) => { const dd = diasAtraso(f, hoje); return (
                    <tr key={f.id} className="border-b border-filete/70"><td className="td font-medium">{f.numero}</td><td className="td">{dPt(f.data)}</td><td className="td">{dPt(f.vencimento)}</td>
                      <td className={`td text-center font-medium ${dd > 60 ? "text-rose-600" : dd > 30 ? "text-amber-700" : "text-cinza"}`}>{dd > 0 ? dd : "—"}</td>
                      <td className="td text-right tabular-nums">{euro(f.valor)}</td><td className="td text-right font-medium tabular-nums">{euro(f.em_aberto)}</td></tr>); })}</tbody>
                </table>
              </div>
            ) : <Vazio>Nada em aberto.</Vazio>}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Contactos</h2>
            {cs.length ? (
              <ul className="card divide-y divide-filete text-sm">
                {cs.map((x) => (
                  <li key={x.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="w-20 shrink-0 text-xs text-cinza">{dPt(x.data)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-tinta">{labelTipo(x.tipo)} <span className="font-normal text-cinza">· {nomeEq(x.por)}</span></p>
                      {x.nota && <p className="text-cinza">{x.nota}</p>}
                      {x.promessa_data && <p className="mt-1 text-xs"><span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-800">Prometeu pagar{x.promessa_valor ? ` ${euro(x.promessa_valor)}` : ""} até {dPt(x.promessa_data)}</span></p>}
                    </div>
                    <ApagarContacto id={x.id} />
                  </li>
                ))}
              </ul>
            ) : <Vazio>Ainda sem contactos registados.</Vazio>}
          </section>

          {pagas.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cinza">Pagas</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-filete bg-banda/60"><tr><th className="th">Documento</th><th className="th">Vencimento</th><th className="th">Paga em</th><th className="th text-center">Dias depois</th><th className="th text-right">Valor</th></tr></thead>
                  <tbody>{pagas.slice(0, 24).map((f) => { const dd = Math.max(0, difDias(f.pago_em!, referencia(f))); return (
                    <tr key={f.id} className="border-b border-filete/70"><td className="td">{f.numero}</td><td className="td">{dPt(referencia(f))}</td><td className="td">{dPt(f.pago_em)}</td><td className={`td text-center ${dd > 30 ? "text-amber-700" : "text-cinza"}`}>{dd}</td><td className="td text-right tabular-nums">{euro(f.valor)}</td></tr>); })}</tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-cinza">A data de pagamento é a da primeira carga em que o documento deixou de aparecer nos pendentes.</p>
            </section>
          )}
        </div>
        <div>{!nif.startsWith("?") && <ContactoForm nif={nif} sugerido={sugerido} hoje={hoje} />}</div>
      </div>
    </>
  );
}
