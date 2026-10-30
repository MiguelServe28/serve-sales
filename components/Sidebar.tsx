"use client";

import BotaoMenu from "@/components/BotaoMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarClock, Timer, ExternalLink, FileUp, KeyRound, LayoutDashboard, ListChecks, LogOut, Settings, Turtle, Users } from "lucide-react";
import { sair } from "@/app/actions";

const GRUPOS = [
  {
    titulo: "Cobranças",
    itens: [
      { href: "/", label: "Painel", icon: LayoutDashboard },
      { href: "/clientes", label: "Dívidas por cliente", icon: Users },
      { href: "/tarefas", label: "Para fazer", icon: ListChecks },
      { href: "/promessas", label: "Promessas", icon: CalendarClock },
      { href: "/atrasos", label: "Pagam tarde", icon: Turtle },
    ],
  },
  {
    titulo: "Análise",
    itens: [
      { href: "/resumo", label: "Resumo mensal", icon: BarChart3 },
      { href: "/prazos", label: "Prazo de recebimento", icon: Timer },
    ],
  },
  {
    titulo: "Dados",
    itens: [
      { href: "/importar", label: "Carregar pendentes", icon: FileUp },
      { href: "/definicoes", label: "Definições", icon: Settings },
    ],
  },
];

export default function Sidebar({ recolhido = false, email, demo, plataforma }: { recolhido?: boolean;  email: string | null; demo: boolean; plataforma?: string }) {
  const path = usePathname();
  const ativo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <aside className="print:hidden fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy text-white">
      <BotaoMenu inicial={recolhido} />
      <div className="px-6 pb-5 pt-7">
        <div className="flex items-baseline gap-1">
          <img src="/logo-serve-branco.png" alt="SERVE" className="menu-texto h-6 w-auto" /><span className="menu-icone text-2xl font-bold">S</span>
          <span className="menu-icone h-2 w-2 rounded-full bg-laranja" />
        </div>
        <p className="menu-texto mt-2 text-xs text-white/60">Sales · cobranças</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {GRUPOS.map((g) => (
          <div key={g.titulo}>
            <p className="menu-texto px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{g.titulo}</p>
            <ul className="space-y-0.5">
              {g.itens.map(({ href, label, icon: Icon }) => (
                <li key={href} title={label}>
                  <Link href={href} className={`group flex items-center gap-3 rounded-lg px-3 py-[7px] text-sm transition ${ativo(href) ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                    <span className={`h-5 w-0.5 rounded-full ${ativo(href) ? "bg-laranja" : "bg-transparent"}`} />
                    <Icon size={16} className={ativo(href) ? "text-laranja" : "text-white/50 group-hover:text-white/80"} />
                    <span className="menu-texto truncate">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {plataforma && (
          <div>
            <p className="menu-texto px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">SERVE</p>
            <a href={plataforma} className="group flex items-center gap-3 rounded-lg px-3 py-[7px] text-sm text-white/70 hover:bg-white/5 hover:text-white">
              <span className="h-5 w-0.5" /><ExternalLink size={16} className="text-white/50" />Plataforma SERVE
            </a>
          </div>
        )}
      </nav>
      <div className="menu-texto border-t border-white/10 px-5 py-4 text-xs">
        {demo ? (
          <div className="rounded-lg bg-laranja/15 px-3 py-2 text-[11px] leading-snug text-laranja-claro">
            <strong className="block text-laranja">Modo demonstração</strong>
            Dados fictícios. Ligue o Supabase para guardar dados reais.
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <Link href="/conta" className="flex min-w-0 items-center gap-2 text-white/60 hover:text-white" title="A minha conta">
              <KeyRound size={14} className="shrink-0" /><span className="truncate">{email}</span>
            </Link>
            <form action={sair}>
              <button className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white" title="Sair"><LogOut size={15} /></button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
