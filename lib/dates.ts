const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Primeiro mês acompanhado na plataforma: nada antes disto aparece (nem prazos, nem atrasos). */
export const MES_INICIO = "2026-11";

/** Data de hoje em Lisboa (YYYY-MM-DD), independente do fuso do servidor. */
export function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Data em Lisboa (YYYY-MM-DD) de um instante ISO. */
export function diaLisboa(instante: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instante));
}

export function mesAtual(): string {
  const m = hojeISO().slice(0, 7);
  return m < MES_INICIO ? MES_INICIO : m;
}

// ---- Trimestres (YYYY-Tn)
export function trimestreDe(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${y}-T${Math.ceil(m / 3)}`;
}
export function mesesDoTrimestre(t: string): string[] {
  const [y, q] = t.split("-T").map(Number);
  return [1, 2, 3].map((i) => `${y}-${String((q - 1) * 3 + i).padStart(2, "0")}`);
}
export function somaTrimestre(t: string, n: number): string {
  return trimestreDe(somaMes(mesesDoTrimestre(t)[0], 3 * n));
}
export const TRIMESTRE_INICIO = "2026-T4";
export function trimestreAtual(): string {
  const t = trimestreDe(hojeISO().slice(0, 7));
  return t < TRIMESTRE_INICIO ? TRIMESTRE_INICIO : t;
}
export function trimestreValido(t: string | undefined): string {
  if (!t || !/^\d{4}-T[1-4]$/.test(t)) return trimestreAtual();
  return t < TRIMESTRE_INICIO ? TRIMESTRE_INICIO : t;
}
export function nomeTrimestre(t: string): string {
  const [y, q] = t.split("-T");
  return `${q}.º trimestre ${y}`;
}

export function nomeMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export function somaMes(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function mesValido(m: string | undefined): string {
  if (!m || !/^\d{4}-\d{2}$/.test(m)) return mesAtual();
  return m < MES_INICIO ? MES_INICIO : m;
}

/** Data (YYYY-MM-DD) do dia `dia` no mês `mes`; dia 0 = último dia útil. */
export function dataNoMes(mes: string, dia: number): string {
  const [y, m] = mes.split("-").map(Number);
  let d: Date;
  if (dia === 0) {
    d = new Date(y, m, 0);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  } else {
    const ultimo = new Date(y, m, 0).getDate();
    d = new Date(y, m - 1, Math.min(dia, ultimo));
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function diasAte(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const alvo = new Date(y, m - 1, d).getTime();
  const [hy, hm, hd] = hojeISO().split("-").map(Number);
  const hoje = new Date(hy, hm - 1, hd).getTime();
  return Math.round((alvo - hoje) / 86400000);
}

/** Se a data calhar ao fim de semana, passa para o dia útil anterior (feriados não incluídos). */
export function diaUtil(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  while (dt.getDay() === 0 || dt.getDay() === 6) dt.setDate(dt.getDate() - 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
