"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hojeISO } from "@/lib/dates";
import { getSessao, podeAceder } from "@/lib/sessao";
import { supabaseServer, temSupabase } from "@/lib/supabase/server";
import { apagarContacto, getDefinicoes, importarPendentes, registarContacto, saveDefinicoes, sincronizarTarefas } from "@/lib/dados";
import { lerPendentes } from "@/lib/importar";
import { TIPOS_CONTACTO, type TipoContacto } from "@/lib/cobrancas";

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function exigir() {
  const s = await getSessao();
  if (!podeAceder(s, "sales")) throw new Error("Sem acesso ao SERVE Sales.");
  return s;
}
const refrescar = () => revalidatePath("/", "layout");

// ---------- Autenticação
export async function entrar(_: unknown, f: FormData): Promise<{ erro: string } | undefined> {
  if (!temSupabase) redirect("/");
  const { error } = await (await supabaseServer()).auth.signInWithPassword({ email: txt(f, "email"), password: txt(f, "password") });
  if (error) return { erro: "Email ou palavra-passe incorretos." };
  redirect("/");
}
export async function sair() {
  if (temSupabase) await (await supabaseServer()).auth.signOut();
  const plataforma = process.env.NEXT_PUBLIC_URL_PLATAFORMA;
  redirect(plataforma ? `${plataforma}/sair` : "/login");
}
export async function alterarMinhaPalavraPasse(_: unknown, f: FormData): Promise<{ erro?: string; ok?: string }> {
  if (!temSupabase) return { erro: "Indisponível em modo demonstração." };
  const nova = txt(f, "password");
  if (nova.length < 10) return { erro: "A palavra-passe tem de ter pelo menos 10 caracteres." };
  if (nova !== txt(f, "confirmar")) return { erro: "As palavras-passe não coincidem." };
  const { error } = await (await supabaseServer()).auth.updateUser({ password: nova });
  return error ? { erro: error.message } : { ok: "Palavra-passe alterada." };
}

// ---------- Pendentes
export type ResultadoImport = { ok?: string; erro?: string; avisos?: string[]; colunas?: Record<string, string> };
export async function carregarPendentes(_: unknown, f: FormData): Promise<ResultadoImport> {
  const s = await exigir();
  const ficheiro = f.get("ficheiro");
  if (!(ficheiro instanceof File) || !ficheiro.size) return { erro: "Escolha o ficheiro de pendentes do TOConline." };
  const leitura = lerPendentes(Buffer.from(await ficheiro.arrayBuffer()));
  if (leitura.erro) return { erro: leitura.erro, colunas: leitura.colunas as Record<string, string> };
  const r = await importarPendentes(leitura.linhas, ficheiro.name, s.equipaId);
  refrescar();
  return {
    ok: `${r.documentos} documentos em aberto carregados. ${r.pagas} deixaram de aparecer e ficaram como pagos.${r.semCliente ? ` ${r.semCliente} sem cliente identificado.` : ""}`,
    avisos: leitura.avisos, colunas: leitura.colunas as Record<string, string>,
  };
}

// ---------- Contactos e promessas
export async function novoContacto(_: unknown, f: FormData): Promise<{ ok?: string; erro?: string }> {
  const s = await exigir();
  const nif = txt(f, "nif");
  const tipo = txt(f, "tipo") as TipoContacto;
  if (!nif) return { erro: "Falta o cliente." };
  if (!TIPOS_CONTACTO.some((t) => t.k === tipo)) return { erro: "Escolha o tipo de contacto." };
  const data = /^\d{4}-\d{2}-\d{2}$/.test(txt(f, "data")) ? txt(f, "data") : hojeISO();
  const promessa_data = /^\d{4}-\d{2}-\d{2}$/.test(txt(f, "promessa_data")) ? txt(f, "promessa_data") : null;
  const v = Number(txt(f, "promessa_valor").replace(/\./g, "").replace(",", "."));
  if (promessa_data && promessa_data < data) return { erro: "A data prometida não pode ser antes do contacto." };
  await registarContacto({ nif, data, tipo, nota: txt(f, "nota") || null, promessa_data, promessa_valor: promessa_data && v > 0 ? v : null, por: s.equipaId }, s.equipaId);
  await sincronizarTarefas();
  refrescar();
  return { ok: "Contacto registado." };
}
export async function eliminarContacto(id: string) {
  await exigir();
  await apagarContacto(id);
  await sincronizarTarefas();
  refrescar();
}

// ---------- Definições
export async function guardarDefinicoes(f: FormData) {
  const s = await exigir();
  if (!s.admin) throw new Error("Só a gerência altera as definições.");
  const atual = await getDefinicoes();
  const n = (k: string, d: number) => { const x = Math.round(Number(txt(f, k))); return x > 0 && x < 366 ? x : d; };
  const dias = [n("d1", atual.dias[0]), n("d2", atual.dias[1]), n("d3", atual.dias[2])].sort((a, b) => a - b) as [number, number, number];
  await saveDefinicoes({ dias, responsavel_id: txt(f, "responsavel_id") || null });
  await sincronizarTarefas();
  refrescar();
}
export async function atualizarTarefas() {
  await exigir();
  await sincronizarTarefas();
  refrescar();
}
