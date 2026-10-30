import { guardarDefinicoes } from "@/app/actions";
import { PageHeader } from "@/components/ui";
import { getDefinicoes, listEquipa } from "@/lib/dados";
import { getSessao } from "@/lib/sessao";

export default async function Definicoes() {
  const [d, equipa, s] = await Promise.all([getDefinicoes(), listEquipa(), getSessao()]);
  return (
    <>
      <PageHeader eyebrow="Dados" titulo="Definições" descricao="A escada de cobrança e quem trata dela. As tarefas novas vão para o responsável escolhido." />
      <form action={guardarDefinicoes} className="card max-w-2xl space-y-5 p-6">
        <div>
          <p className="label">Escada de cobrança (dias depois do vencimento)</p>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">1.º lembrete (TOConline)</label><input name="d1" type="number" min={1} defaultValue={d.dias[0]} className="input" disabled={!s.admin} /></div>
            <div><label className="label">2.º aviso (TOConline)</label><input name="d2" type="number" min={1} defaultValue={d.dias[1]} className="input" disabled={!s.admin} /></div>
            <div><label className="label">Chamada ao cliente</label><input name="d3" type="number" min={1} defaultValue={d.dias[2]} className="input" disabled={!s.admin} /></div>
          </div>
        </div>
        <div>
          <label className="label">Responsável pelas cobranças</label>
          <select name="responsavel_id" defaultValue={d.responsavel_id ?? ""} className="input" disabled={!s.admin}>
            <option value="">—</option>
            {equipa.filter((e) => e.ativo).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <p className="text-xs text-cinza">Os emails de lembrete saem do TOConline (botão de aviso de pendente), com a fatura em anexo. Aqui fica o registo de que foram enviados.</p>
        {s.admin && <div className="flex justify-end"><button className="btn-primary">Guardar</button></div>}
      </form>
    </>
  );
}
