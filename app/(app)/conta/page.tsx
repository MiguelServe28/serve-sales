import ContaForm from "@/components/ContaForm";
import { PageHeader } from "@/components/ui";
import { getSessao } from "@/lib/sessao";

export default async function Conta() {
  const s = await getSessao();
  return (
    <>
      <PageHeader eyebrow="A minha conta" titulo={s.nome || s.email || "Conta"} descricao={`${s.email ?? ""} · ${s.admin ? "Administrador" : "Utilizador"}`} />
      <div className="card max-w-lg p-6">
        <h2 className="mb-4 text-base font-semibold">Alterar palavra-passe</h2>
        <ContaForm />
      </div>
    </>
  );
}
