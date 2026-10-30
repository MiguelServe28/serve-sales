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

// ---------- Análise (resumo mensal e prazo de recebimento)

/** Valor recebido de uma fatura paga: o último valor em aberto visto (ou o total, se já vinha a zero). */
export const valorRecebido = (f: Fatura) => (f.em_aberto > 0.004 ? f.em_aberto : f.valor);
/** Em aberto num dia passado: já conhecida e ainda não paga nesse dia. */
const abertaEm = (f: Fatura, dia: string) => f.primeira_vez <= dia && (f.pago_em ? f.pago_em > dia : f.em_aberto > 0.004);
const valorEm = (f: Fatura) => (f.pago_em ? valorRecebido(f) : f.em_aberto);

export const ultimoDiaMes = (mes: string) => {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};
export const mesAnterior = (mes: string) => {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
};

/** Margem para a data de pagamento: só se sabe que foi paga na carga seguinte (normalmente semanal). */
export const MARGEM_CARGA = 7;

export type PrazoMes = { mes: string; n: number; valor: number; diasEmissao: number | null; diasVencimento: number | null; ponderado: number | null; ate30: number | null };

/** Prazo de recebimento das faturas pagas num conjunto de faturas. */
export function prazoDe(pagas: Fatura[]): Omit<PrazoMes, "mes"> {
  const n = pagas.length;
  if (!n) return { n: 0, valor: 0, diasEmissao: null, diasVencimento: null, ponderado: null, ate30: null };
  const venc = pagas.map((f) => Math.max(0, difDias(f.pago_em!, referencia(f))));
  const emis = pagas.map((f) => Math.max(0, difDias(f.pago_em!, f.data ?? referencia(f))));
  const valores = pagas.map(valorRecebido);
  const valor = valores.reduce((a, b) => a + b, 0);
  const media = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  return {
    n, valor,
    diasEmissao: media(emis), diasVencimento: media(venc),
    ponderado: valor ? Math.round(venc.reduce((s, d, i) => s + d * valores[i], 0) / valor) : null,
    ate30: Math.round((venc.filter((d) => d <= 30).length / n) * 100),
  };
}

/** Prazo de recebimento mês a mês (pela data em que a fatura foi dada como paga). */
export function prazosPorMes(faturas: Fatura[], meses: string[]): PrazoMes[] {
  return meses.map((mes) => ({ mes, ...prazoDe(faturas.filter((f) => f.pago_em?.startsWith(mes))) }));
}

/** Meses com dados: do primeiro mês em que houve faturas até ao mês de hoje. */
export function mesesComDados(faturas: Fatura[], hoje: string): string[] {
  const primeiro = faturas.reduce((m, f) => (f.primeira_vez < m ? f.primeira_vez : m), hoje).slice(0, 7);
  const out: string[] = [];
  for (let m = hoje.slice(0, 7); m >= primeiro; m = mesAnterior(m)) out.push(m);
  return out.reverse();
}

export type Foto = { dia: string; total: number; vencido: number; mais60: number; clientes: number; documentos: number; top: { nif: string; nome: string; total: number; dias: number }[] };

/** Fotografia da dívida num dia (o último dia do mês, ou hoje no mês corrente). */
export function fotografia(faturas: Fatura[], clientes: ClienteBase[], dia: string): Foto {
  const abertas = faturas.filter((f) => abertaEm(f, dia));
  const nomes = new Map(clientes.map((c) => [c.nif, c.nome]));
  const porNif = new Map<string, { nif: string; nome: string; total: number; dias: number }>();
  for (const f of abertas) {
    const k = f.nif ?? `?${f.nome ?? f.numero}`;
    const x = porNif.get(k) ?? { nif: k, nome: (f.nif && nomes.get(f.nif)) || f.nome || k, total: 0, dias: 0 };
    x.total += valorEm(f); x.dias = Math.max(x.dias, difDias(dia, referencia(f)));
    porNif.set(k, x);
  }
  const soma = (fs: Fatura[]) => fs.reduce((s, f) => s + valorEm(f), 0);
  return {
    dia, total: soma(abertas),
    vencido: soma(abertas.filter((f) => difDias(dia, referencia(f)) > 0)),
    mais60: soma(abertas.filter((f) => difDias(dia, referencia(f)) > 60)),
    clientes: porNif.size, documentos: abertas.length,
    top: [...porNif.values()].sort((a, b) => b.total - a.total).slice(0, 5),
  };
}

export type ResumoMes = {
  mes: string; fim: string; foto: Foto; recebido: { n: number; valor: number }; prazo: Omit<PrazoMes, "mes">;
  entraramAtraso: { n: number; valor: number }; contactos: Record<TipoContacto, number>;
  promessas: { feitas: number; cumpridas: number; falhadas: number; pendentes: number };
};

/** Resumo de um mês: dívida no fim do mês, o que entrou, o que passou a estar em atraso e o trabalho de cobrança feito. */
export function resumoMes(faturas: Fatura[], contactos: Contacto[], clientes: ClienteBase[], mes: string, hoje: string, d: Definicoes): ResumoMes {
  const fim = ultimoDiaMes(mes) < hoje ? ultimoDiaMes(mes) : hoje;
  const ini = `${mes}-01`;
  const pagas = faturas.filter((f) => f.pago_em && f.pago_em >= ini && f.pago_em <= fim);
  // Faturas que atingiram o 1.º degrau da escada neste mês e ainda estavam por pagar nesse dia
  const entraram = faturas.filter((f) => {
    const dia = somaDias(referencia(f), d.dias[0]);
    return dia >= ini && dia <= fim && abertaEm(f, dia);
  });
  const doMes = contactos.filter((c) => c.data >= ini && c.data <= fim);
  const porTipo = Object.fromEntries(TIPOS_CONTACTO.map((t) => [t.k, doMes.filter((c) => c.tipo === t.k).length])) as Record<TipoContacto, number>;
  // Promessas com data neste mês: cumprida se tudo o que estava em aberto no dia do contacto foi pago até à data (com margem da carga)
  const prom = contactos.filter((c) => c.promessa_data && c.promessa_data >= ini && c.promessa_data <= fim);
  let cumpridas = 0, falhadas = 0, pendentes = 0;
  for (const c of prom) {
    const devidas = faturas.filter((f) => f.nif === c.nif && abertaEm(f, c.data));
    const limite = somaDias(c.promessa_data!, MARGEM_CARGA);
    const ok = devidas.every((f) => f.pago_em && f.pago_em <= limite);
    if (ok) cumpridas++; else if (limite < hoje) falhadas++; else pendentes++;
  }
  return {
    mes, fim, foto: fotografia(faturas, clientes, fim),
    recebido: { n: pagas.length, valor: pagas.reduce((s, f) => s + valorRecebido(f), 0) },
    prazo: prazoDe(pagas),
    entraramAtraso: { n: entraram.length, valor: entraram.reduce((s, f) => s + valorEm(f), 0) },
    contactos: porTipo,
    promessas: { feitas: doMes.filter((c) => c.promessa_data).length, cumpridas, falhadas, pendentes },
  };
}

// ---------- Guião da chamada

export type Guiao = { abertura: string[]; nota: string[]; objetivo: string; respostas: { se: string; entao: string }[]; fecho: string };

export function guiao(d: Divida, opts: { mediaPagar: number | null; falhadas: number; quem: string }): Guiao {
  const n = d.abertas.length;
  const docs = n === 1 ? "uma fatura" : `${n} faturas`;
  const abertura = [
    `Bom dia, fala ${opts.quem}, da SERVE. Estou a ligar por causa de ${docs} da contabilidade que ${n === 1 ? "está" : "estão"} por pagar, no total de ${euro(d.total)}.`,
    `${n === 1 ? "A fatura" : "A mais antiga"} é a ${d.maisAntiga.numero}, com vencimento a ${dPt(referencia(d.maisAntiga))}${d.dias > 0 ? `, há ${d.dias} dias` : ""}.`,
  ];
  if (d.promessa?.estado === "falhada")
    abertura.push(`Da última vez que falámos, a ${dPt(d.promessa.data)}, ficou combinado o pagamento até ${dPt(d.promessa.promessa_data)}, mas ainda não o recebemos. Aconteceu alguma coisa?`);
  else if (d.contactos.some((c) => c.tipo === "lembrete2" || c.tipo === "lembrete1"))
    abertura.push(`Já enviámos ${d.contactos.some((c) => c.tipo === "lembrete2") ? "dois avisos" : "um aviso"} por email. Queria só confirmar se os recebeu e quando conta fazer o pagamento.`);

  const nota: string[] = [];
  if (opts.mediaPagar !== null && opts.mediaPagar > 30) nota.push(`Costuma pagar ${opts.mediaPagar} dias depois do vencimento, em média. Se fizer sentido, pergunte se prefere passar a pagar por débito direto.`);
  if (opts.falhadas > 0) nota.push(`Já falhou ${opts.falhadas === 1 ? "uma promessa" : `${opts.falhadas} promessas`} de pagamento. Peça uma data curta e concreta.`);
  if (d.cliente?.gestor_nome) nota.push(`Gestor do cliente: ${d.cliente.gestor_nome}.`);

  const email = d.cliente?.email;
  return {
    abertura, nota,
    objetivo: "Sair da chamada com uma data concreta de pagamento (e, se possível, o valor).",
    respostas: [
      { se: "«Não recebi a fatura» ou «não sei de que é»", entao: `Diga que a reenvia já${email ? ` para ${email}` : " por email"}. Reenvie pelo TOConline e combine uma data na mesma.` },
      { se: "«Já paguei»", entao: "Peça a data e o banco do pagamento. Anote e confirme com a tesouraria antes de voltar a insistir." },
      { se: "«Pago no fim do mês» ou «para a semana»", entao: "Peça o dia certo e registe-o em «Prometeu pagar até». A escada pára até essa data." },
      { se: "«Não concordo com o valor»", entao: `Anote o motivo e diga que ${d.cliente?.gestor_nome ?? "o gestor"} vai rever. Não insista no pagamento até haver resposta.` },
      { se: "«Estou com dificuldades»", entao: "Não há planos de pagamento em prestações. Pergunte quando consegue pagar, começando pela fatura mais antiga, e registe essa data." },
      { se: "Não atende", entao: "Registe como «Outro contacto», com a nota «Não atendeu». A tarefa fica aberta; tente outra vez daqui a 2 ou 3 dias." },
    ],
    fecho: `Então fica combinado o pagamento de ${euro(d.total)} até [data]. Muito obrigado/a e bom dia.`,
  };
}
