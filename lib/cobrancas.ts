/** Regras de cobrança da SERVE (sem acesso à base de dados: só cálculo). */

export type Fatura = {
  id: string; numero: string; nif: string | null; nome: string | null;
  data: string | null; vencimento: string | null; valor: number; em_aberto: number;
  primeira_vez: string; ultima_vez: string; pago_em: string | null;
};
export type TipoContacto = "lembrete1" | "lembrete2" | "chamada" | "email" | "outro";
export type Contacto = {
  id: string; nif: string; data: string; tipo: TipoContacto; nota: string | null;
  promessa_data: string | null; promessa_valor: number | null; por: string | null; criado_em?: string;
};
export type Definicoes = { dias: [number, number, number]; responsavel_id: string | null };
export type ClienteBase = { nif: string; nome: string; numero_cliente: string; gestor_nome: string | null; email: string | null; ativo?: boolean | null };

export const DEFINICOES_PADRAO: Definicoes = { dias: [30, 45, 60], responsavel_id: null };

export const TIPOS_CONTACTO: { k: TipoContacto; label: string }[] = [
  { k: "lembrete1", label: "1.º lembrete enviado (TOConline)" },
  { k: "lembrete2", label: "2.º aviso enviado (TOConline)" },
  { k: "chamada", label: "Chamada ao cliente" },
  { k: "email", label: "Email" },
  { k: "outro", label: "Outro contacto" },
];
export const labelTipo = (k: string) => TIPOS_CONTACTO.find((t) => t.k === k)?.label ?? k;

export type Passo = "lembrete1" | "lembrete2" | "chamada" | "promessa";
export const PASSOS: Record<Passo, { titulo: string; curto: string; cor: string }> = {
  lembrete1: { titulo: "Cobrança · enviar 1.º lembrete pelo TOConline", curto: "1.º lembrete", cor: "bg-amber-100 text-amber-800" },
  lembrete2: { titulo: "Cobrança · enviar 2.º aviso pelo TOConline", curto: "2.º aviso", cor: "bg-orange-100 text-orange-800" },
  chamada: { titulo: "Cobrança · ligar ao cliente", curto: "Ligar", cor: "bg-rose-100 text-rose-800" },
  promessa: { titulo: "Cobrança · promessa falhada, voltar a ligar", curto: "Promessa falhada", cor: "bg-rose-100 text-rose-800" },
};

const DIA = 864e5;
const t = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
export const somaDias = (iso: string, n: number) => new Date(t(iso) + n * DIA).toISOString().slice(0, 10);
export const difDias = (a: string, b: string) => Math.round((t(a) - t(b)) / DIA);

/** Data a partir da qual a fatura conta como em atraso: o vencimento ou, sem ele, a data da fatura. */
export const referencia = (f: Fatura) => f.vencimento ?? f.data ?? f.primeira_vez;
export const diasAtraso = (f: Fatura, hoje: string) => difDias(hoje, referencia(f));
export const emAberto = (f: Fatura) => !f.pago_em && f.em_aberto > 0.004;

export const ESCALOES = [
  { k: "avencer", label: "A vencer", min: -Infinity, max: 0 },
  { k: "e30", label: "1 a 30 dias", min: 1, max: 30 },
  { k: "e45", label: "31 a 45 dias", min: 31, max: 45 },
  { k: "e60", label: "46 a 60 dias", min: 46, max: 60 },
  { k: "e90", label: "61 a 90 dias", min: 61, max: 90 },
  { k: "mais", label: "Mais de 90 dias", min: 91, max: Infinity },
] as const;
export const escalaoDe = (dias: number) => ESCALOES.find((e) => dias >= e.min && dias <= e.max)!;

export type EstadoPromessa = "aberta" | "cumprida" | "falhada";
export type Divida = {
  nif: string; nome: string; gestor: string | null; cliente: ClienteBase | null;
  abertas: Fatura[]; total: number; maisAntiga: Fatura; dias: number;
  contactos: Contacto[]; ultimoContacto: Contacto | null;
  promessa: (Contacto & { estado: EstadoPromessa }) | null;
  passo: Passo | null; limiar: string | null;
};

/** Situação de dívida de um cliente: faturas em aberto, contactos, promessa e o próximo passo da escada. */
export function divida(nif: string, faturas: Fatura[], contactos: Contacto[], cliente: ClienteBase | null, d: Definicoes, hoje: string): Divida | null {
  const abertas = faturas.filter((f) => f.nif === nif && emAberto(f)).sort((a, b) => referencia(a).localeCompare(referencia(b)));
  if (!abertas.length) return null;
  const maisAntiga = abertas[0];
  const ref = referencia(maisAntiga);
  const dias = difDias(hoje, ref);
  const cs = contactos.filter((c) => c.nif === nif).sort((a, b) => (b.data + (b.criado_em ?? "")).localeCompare(a.data + (a.criado_em ?? "")));
  const comPromessa = cs.find((c) => c.promessa_data);
  let promessa: Divida["promessa"] = null;
  if (comPromessa) {
    const estado: EstadoPromessa = comPromessa.promessa_data! >= hoje ? "aberta" : "falhada";
    promessa = { ...comPromessa, estado };
  }
  // Escada: o passo mais alto já atingido que ainda não foi feito (um contacto desse tipo depois da fatura mais antiga)
  const niveis: { k: Exclude<Passo, "promessa">; dias: number }[] = [
    { k: "lembrete1", dias: d.dias[0] }, { k: "lembrete2", dias: d.dias[1] }, { k: "chamada", dias: d.dias[2] },
  ];
  const feito = (k: string) => cs.some((c) => c.tipo === k && c.data >= ref);
  let passo: Passo | null = null, limiar: string | null = null;
  const atingidos = niveis.filter((n) => dias >= n.dias);
  const topo = atingidos.at(-1);
  if (topo && !feito(topo.k) && !atingidos.slice(atingidos.indexOf(topo)).some((n) => feito(n.k))) {
    passo = topo.k; limiar = somaDias(ref, topo.dias);
  }
  if (promessa?.estado === "aberta") { passo = null; limiar = null; }
  if (promessa?.estado === "falhada") {
    const tratada = cs.some((c) => c.data > promessa!.promessa_data! && c.id !== promessa!.id);
    if (!tratada) { passo = "promessa"; limiar = promessa.promessa_data; }
  }
  return {
    nif, nome: cliente?.nome ?? maisAntiga.nome ?? nif, gestor: cliente?.gestor_nome ?? null, cliente,
    abertas, total: abertas.reduce((s, f) => s + f.em_aberto, 0), maisAntiga, dias,
    contactos: cs, ultimoContacto: cs[0] ?? null, promessa, passo, limiar,
  };
}

export function dividas(faturas: Fatura[], contactos: Contacto[], clientes: ClienteBase[], d: Definicoes, hoje: string): Divida[] {
  const nifs = [...new Set(faturas.filter(emAberto).map((f) => f.nif ?? `?${f.nome ?? f.numero}`))];
  const porNif = new Map(clientes.map((c) => [c.nif, c]));
  return nifs.map((n) => divida(n, faturas.map((f) => (f.nif ? f : { ...f, nif: `?${f.nome ?? f.numero}` })), contactos, porNif.get(n) ?? null, d, hoje))
    .filter((x): x is Divida => !!x).sort((a, b) => b.dias - a.dias || b.total - a.total);
}

/** Promessas de pagamento (a mais recente de cada cliente), com o estado calculado. */
export function promessas(contactos: Contacto[], faturas: Fatura[], hoje: string) {
  const ultimas = new Map<string, Contacto>();
  for (const c of [...contactos].sort((a, b) => a.data.localeCompare(b.data))) if (c.promessa_data) ultimas.set(c.nif, c);
  return [...ultimas.values()].map((c) => {
    const aindaDeve = faturas.some((f) => f.nif === c.nif && emAberto(f));
    const estado: EstadoPromessa = !aindaDeve ? "cumprida" : c.promessa_data! >= hoje ? "aberta" : "falhada";
    return { ...c, estado };
  }).sort((a, b) => a.promessa_data!.localeCompare(b.promessa_data!));
}

/** Clientes que pagam tarde: pelo histórico das faturas já pagas e pelas que estão em aberto há muito. */
export function pagamTarde(faturas: Fatura[], clientes: ClienteBase[], hoje: string, limite = 30) {
  const porNif = new Map<string, Fatura[]>();
  for (const f of faturas) if (f.nif) porNif.set(f.nif, [...(porNif.get(f.nif) ?? []), f]);
  const nomes = new Map(clientes.map((c) => [c.nif, c]));
  const out = [];
  for (const [nif, fs] of porNif) {
    const pagas = fs.filter((f) => f.pago_em);
    const atrasos = pagas.map((f) => Math.max(0, difDias(f.pago_em!, referencia(f))));
    const tarde = atrasos.filter((x) => x > limite).length;
    const media = atrasos.length ? Math.round(atrasos.reduce((a, b) => a + b, 0) / atrasos.length) : null;
    const abertasVelhas = fs.filter((f) => emAberto(f) && diasAtraso(f, hoje) > 60);
    if ((media !== null && media > limite) || tarde >= 2 || abertasVelhas.length) {
      out.push({ nif, nome: nomes.get(nif)?.nome ?? fs[0].nome ?? nif, gestor: nomes.get(nif)?.gestor_nome ?? null, pagas: pagas.length, tarde, media, abertasVelhas: abertasVelhas.length, emDivida: fs.filter(emAberto).reduce((s, f) => s + f.em_aberto, 0) });
    }
  }
  return out.sort((a, b) => (b.media ?? 0) - (a.media ?? 0) || b.emDivida - a.emDivida);
}

export const euro = (v: number) => {
  const [i, dcm] = Math.abs(v).toFixed(2).split(".");
  return `${v < 0 ? "−" : ""}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${dcm} €`;
};
export const dPt = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "—");
