import { cookies } from "next/headers";
import Sidebar from "@/components/Sidebar";
import { Vazio } from "@/components/ui";
import { getSessao, podeAceder } from "@/lib/sessao";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSessao();
  const recolhido = (await cookies()).get("menu")?.value === "recolhido";
  return (
    <div className="min-h-screen" data-menu-raiz data-menu={recolhido ? "recolhido" : undefined}>
      <Sidebar recolhido={recolhido} email={s.email} demo={s.demo} plataforma={process.env.NEXT_PUBLIC_URL_PLATAFORMA} />
      <main className="pl-64 print:pl-0">
        <div className="mx-auto max-w-[1500px] px-8 py-8">
          {podeAceder(s, "sales") ? children : <Vazio>Não tem acesso ao SERVE Sales. Peça acesso a um administrador na Plataforma SERVE.</Vazio>}
        </div>
      </main>
    </div>
  );
}
