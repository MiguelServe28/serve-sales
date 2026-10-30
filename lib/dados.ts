import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { temSupabase } from "./supabase/server";
import { hojeISO } from "./dates";
import { DEFINICOES_PADRAO, divida, dividas, PASSOS, somaDias, type ClienteBase, type Contacto, type Definicoes, type Fatura, type Passo } from "./cobrancas";
import type { LinhaPendente } from "./importar";

export type Membro = { id: string; nome: string; email: string | null; ativo: boolean };
export type Carga = { id: number; carregado_em: string; ficheiro: string | null; n_faturas: number; total: number; pagas: number; por: string | null };

function adm() { const c = supabaseAdmin(); if (!c) throw new Error("Falta a chave de serviço (SUPABASE_SERVICE_ROLE_KEY)."); return c; }
function ok<T>(r: { data: T | null; error: { message: string } | null }): T { if (r.error) throw new Error(r.error.message); return (r.data ?? []) as T; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function todas<T>(q: (a: number, b: number) => PromiseLike<{ data: any; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let a = 0; ; a += 1000) { const r = await q(a, a + 999); if (r.error) throw new Error(r.error.message); out.push(...(r.data ?? [])); if (!r.data || r.data.length < 1000) break; }
  return out;
}
const num = (f: Fatura) => ({ ...f, valor: Number(f.valor), em_aberto: Number(f.em_aberto) });

// ---------- Modo demonstração (sem Supabase): dados de exemplo em memória
type Demo = { faturas: Fatura[]; contactos: Contacto[]; cargas: Carga[]; defs: Definicoes; tarefas: { id: string; nif: string; titulo: string; periodo: string; prazo: string; estado: string }[] };
const g = globalThis as unknown as { __salesDemo?: Demo };
function demo(): Demo {
  if (g.__salesDemo) return g.__salesDemo;
  const h = hojeISO();
  const f = (i: number, nif: string, nome: string, diasAtras: number, valor: number, pago?: number): Fatura => ({
    id: `f${i}`, numero: `FT 2026/${100 + i}`, nif, nome, data: somaDias(h, -diasAtras), vencimento: somaDias(h, -diasAtras),
    valor, em_aberto: pago !== undefined ? 0 : valor, primeira_vez: somaDias(h, -diasAtras), ultima_vez: h, pago_em: pago !== undefined ? somaDias(h, -diasAtras + pago) : null,
  });
  g.__salesDemo = {
    faturas: [
      f(1, "510000001", "Atlântico Construções, Lda. (demo)", 75, 369), f(2, "510000001", "Atlântico Construções, Lda. (demo)", 44, 369),
      f(3, "510000002", "Oeste Restauração, Lda. (demo)", 33, 246), f(4, "510000003", "Óbidos Imobiliária, Lda. (demo)", 50, 615),
      f(5, "200000003", "Casa da Praia AL (demo)", 12, 61.5), f(6, "510000004", "Caldas Comércio, Lda. (demo)", 95, 430.5),
      f(7, "510000002", "Oeste Restauração, Lda. (demo)", 120, 246, 70), f(8, "510000002", "Oeste Restauração, Lda. (demo)", 90, 246, 55),
      f(9, "510000003", "Óbidos Imobiliária, Lda. (demo)", 140, 615, 10),
    ],
    contactos: [
      { id: "c1", nif: "510000004", data: somaDias(h, -20), tipo: "chamada", nota: "Disse que pagava até ao fim do mês.", promessa_data: somaDias(h, -3), promessa_valor: 430.5, por: null },
      { id: "c2", nif: "510000003", data: somaDias(h, -8), tipo: "lembrete1", nota: null, promessa_data: null, promessa_valor: null, por: null },
    ],
    cargas: [{ id: 1, carregado_em: new Date().toISOString(), ficheiro: "pendentes-exemplo.xlsx", n_faturas: 6, total: 2091, pagas: 0, por: null }],
    defs: { ...DEFINICOES_PADRAO },
    tarefas: [],
  };
  return g.__salesDemo;
}

// ---------- Leituras
export async function listClientes(): Promise<ClienteBase[]> {
  if (!temSupabase) return [
    { nif: "510000001", nome: "Atlântico Construções, Lda. (demo)", numero_cliente: "1", gestor_nome: "Adriana Mauricio", email: "geral@atlantico.pt" },
    { nif: "510000002", nome: "Oeste Restauração, Lda. (demo)", numero_cliente: "2", gestor_nome: "Adriana Mauricio", email: "geral@oeste.pt" },
    { nif: "510000003", nome: "Óbidos Imobiliária, Lda. (demo)", numero_cliente: "3", gestor_nome: "Susana Indio", email: "geral@obidos.pt" },
    { nif: "510000004", nome: "Caldas Comércio, Lda. (demo)", numero_cliente: "4", gestor_nome: "Susana Indio", email: "geral@caldas.pt" },
    { nif: "200000003", nome: "Casa da Praia AL (demo)", numero_cliente: "5", gestor_nome: "Leanik Ramos", email: null },
  ];
  return todas<ClienteBase>((a, b) => adm().from("clientes").select("nif,nome,numero_cliente,gestor_nome,email,ativo").range(a, b));
}
export async function listEquipa(): Promise<Membro[]> {
  if (!temSupabase) return [{ id: "sonia", nome: "Sónia Nunes", email: null, ativo: true }, { id: "miguel", nome: "Miguel Silva", email: null, ativo: true }];
  return ok<Membro[]>(await adm().from("equipa").select("id,nome,email,ativo").order("nome"));
}
export async function listFaturas(): Promise<Fatura[]> {
  if (!temSupabase) return demo().faturas;
  return (await todas<Fatura>((a, b) => adm().from("sales_faturas").select("id,numero,nif,nome,data,vencimento,valor,em_aberto,primeira_vez,ultima_vez,pago_em").range(a, b))).map(num);
}
export async function listContactos(nif?: string): Promise<Contacto[]> {
  if (!temSupabase) return demo().contactos.filter((c) => !nif || c.nif === nif);
  return (await todas<Contacto>((a, b) => { let q = adm().from("sales_contactos").select("id,nif,data,tipo,nota,promessa_data,promessa_valor,por,criado_em"); if (nif) q = q.eq("nif", nif); return q.order("data", { ascending: false }).range(a, b); }))
    .map((c) => ({ ...c, promessa_valor: c.promessa_valor === null ? null : Number(c.promessa_valor) }));
}
export async function listCargas(): Promise<Carga[]> {
  if (!temSupabase) return demo().cargas;
  return ok<Carga[]>(await adm().from("sales_cargas").select("id,carregado_em,ficheiro,n_faturas,total,pagas,por").order("carregado_em", { ascending: false }).limit(20));
}
export async function getDefinicoes(): Promise<Definicoes> {
  if (!temSupabase) return demo().defs;
  const { data } = await adm().from("sales_definicoes").select("dados").eq("id", 1).maybeSingle();
  return { ...DEFINICOES_PADRAO, ...((data?.dados as Partial<Definicoes>) ?? {}) };
}

// ---------- Escritas
export async function saveDefinicoes(d: Definicoes) {
  if (!temSupabase) { demo().defs = d; return; }
  ok(await adm().from("sales_definicoes").upsert({ id: 1, dados: d }));
}

/** Regista um contacto e fecha a tarefa da escada correspondente. */
export async function registarContacto(c: Omit<Contacto, "id">, userEquipa: string | null) {
  if (!temSupabase) { demo().contactos.unshift({ ...c, id: `c${Date.now()}`, criado_em: new Date().toISOString() }); return; }
  const a = adm();
  ok(await a.from("sales_contactos").insert({ ...c, por: userEquipa }));
  // A tarefa do passo fica concluída; uma chamada também trata a promessa falhada
  const fecha = c.tipo === "chamada" ? ["lembrete1", "lembrete2", "chamada", "promessa"] : c.tipo === "lembrete2" ? ["lembrete1", "lembrete2"] : c.tipo === "lembrete1" ? ["lembrete1"] : c.promessa_data ? ["promessa"] : [];
  for (const p of fecha) {
    ok(await a.from("tarefas").update({ estado: "concluida", concluida_em: new Date().toISOString(), concluida_por: userEquipa, atualizado_em: new Date().toISOString() })
      .eq("origem", "sales").eq("nif", c.nif).eq("estado", "aberta").like("periodo", `${p}:%`));
  }
}
export async function apagarContacto(id: string) {
  if (!temSupabase) { demo().contactos = demo().contactos.filter((c) => c.id !== id); return; }
  ok(await adm().from("sales_contactos").delete().eq("id", id));
}

/** Carrega o mapa de pendentes: atualiza as faturas, marca como pagas as que deixaram de aparecer e gera as tarefas. */
export async function importarPendentes(linhas: LinhaPendente[], ficheiro: string, por: string | null) {
  const hoje = hojeISO();
  const clientes = await listClientes();
  const normNome = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const porNome = new Map(clientes.map((c) => [normNome(c.nome), c.nif]));
  const comNif = linhas.map((l) => ({ ...l, nif: l.nif ?? (l.nome ? porNome.get(normNome(l.nome)) ?? null : null) }));
  const vistas = new Set(comNif.map((l) => l.numero));
  const atuais = await listFaturas();
  const existentes = new Map(atuais.map((f) => [f.numero, f]));
  let pagas = 0;
  if (!temSupabase) {
    const d = demo();
    for (const l of comNif) {
      const f = existentes.get(l.numero);
      if (f) Object.assign(f, { ...l, ultima_vez: hoje, pago_em: l.em_aberto > 0 ? null : hoje });
      else d.faturas.push({ id: `f${Date.now()}${l.numero}`, ...l, primeira_vez: hoje, ultima_vez: hoje, pago_em: l.em_aberto > 0 ? null : hoje });
    }
    for (const f of d.faturas) if (!f.pago_em && !vistas.has(f.numero)) { f.pago_em = hoje; pagas++; }
    d.cargas.unshift({ id: Date.now(), carregado_em: new Date().toISOString(), ficheiro, n_faturas: linhas.length, total: linhas.reduce((s, l) => s + l.em_aberto, 0), pagas, por });
  } else {
    const a = adm();
    const lote = comNif.map((l) => ({
      numero: l.numero, nif: l.nif, nome: l.nome, data: l.data, vencimento: l.vencimento, valor: l.valor, em_aberto: l.em_aberto,
      ultima_vez: hoje, pago_em: l.em_aberto > 0.004 ? null : (existentes.get(l.numero)?.pago_em ?? hoje), atualizado_em: new Date().toISOString(),
      primeira_vez: existentes.get(l.numero)?.primeira_vez ?? hoje,
    }));
    for (let i = 0; i < lote.length; i += 500) ok(await a.from("sales_faturas").upsert(lote.slice(i, i + 500), { onConflict: "numero" }));
    const sairam = atuais.filter((f) => !f.pago_em && !vistas.has(f.numero)).map((f) => f.numero);
    pagas = sairam.length;
    for (let i = 0; i < sairam.length; i += 300) ok(await a.from("sales_faturas").update({ pago_em: hoje, em_aberto: 0, atualizado_em: new Date().toISOString() }).in("numero", sairam.slice(i, i + 300)));
    ok(await a.from("sales_cargas").insert({ ficheiro, n_faturas: linhas.length, total: linhas.reduce((s, l) => s + l.em_aberto, 0), pagas, por }));
  }
  await sincronizarTarefas();
  return { documentos: linhas.length, semCliente: comNif.filter((l) => !l.nif).length, pagas };
}

/**
 * Tarefas da escada para o responsável das cobranças (tabela tarefas, origem "sales"):
 * aparecem no O meu dia e contam para os prazos no RH Interno.
 * O prazo é a data em que o passo é atingido + 3 dias, nunca antes de hoje + 3 (uma carga atrasada não penaliza ninguém).
 */
export async function sincronizarTarefas() {
  const hoje = hojeISO();
  const [faturas, contactos, clientes, d] = await Promise.all([listFaturas(), listContactos(), listClientes(), getDefinicoes()]);
  const lista = dividas(faturas, contactos, clientes, d, hoje).filter((x) => !x.nif.startsWith("?"));
  const desejadas = lista.filter((x) => x.passo).map((x) => {
    const p = x.passo as Passo;
    const periodo = `${p}:${x.limiar}`;
    const base = x.limiar && x.limiar > hoje ? x.limiar : hoje;
    const prazo = somaDias(base, 3);
    return { nif: x.nif, titulo: PASSOS[p].titulo, periodo, prazo };
  });
  if (!temSupabase) { demo().tarefas = desejadas.map((t, i) => ({ id: `t${i}`, ...t, estado: "aberta" })); return desejadas.length; }
  const a = adm();
  const existentes = await todas<{ id: string; nif: string; periodo: string; estado: string }>((x, y) => a.from("tarefas").select("id,nif,periodo,estado").eq("origem", "sales").range(x, y));
  const ja = new Set(existentes.map((t) => `${t.nif}|${t.periodo}`));
  const novas = desejadas.filter((t) => !ja.has(`${t.nif}|${t.periodo}`)).map((t) => ({
    origem: "sales", tipo_id: null, nif: t.nif, titulo: t.titulo, periodo: t.periodo, mes_prazo: t.prazo.slice(0, 7), prazo: t.prazo,
    responsavel_id: d.responsavel_id, peso: 1, interna: false, estado: "aberta",
  }));
  if (novas.length) ok(await a.from("tarefas").insert(novas));
  // Clientes que já não devem: as tarefas por fazer deixam de ser precisas
  const devem = new Set(lista.map((x) => x.nif));
  const dispensar = existentes.filter((t) => t.estado === "aberta" && !devem.has(t.nif)).map((t) => t.id);
  if (dispensar.length) ok(await a.from("tarefas").update({ estado: "dispensada", atualizado_em: new Date().toISOString() }).in("id", dispensar));
  return novas.length;
}

export type TarefaSales = { id: string; nif: string; titulo: string; periodo: string; prazo: string; estado: string; responsavel_id?: string | null };
export async function listTarefas(): Promise<TarefaSales[]> {
  if (!temSupabase) return demo().tarefas;
  return todas<TarefaSales>((x, y) => adm().from("tarefas").select("id,nif,titulo,periodo,prazo,estado,responsavel_id").eq("origem", "sales").order("prazo").range(x, y));
}

export { divida };
