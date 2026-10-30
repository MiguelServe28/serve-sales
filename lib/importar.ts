import "server-only";
import * as XLSX from "xlsx";

/** Uma linha do mapa de pendentes, já normalizada. */
export type LinhaPendente = { numero: string; nif: string | null; nome: string | null; data: string | null; vencimento: string | null; valor: number; em_aberto: number };

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Reconhecimento das colunas pelo título (o mapa de pendentes do TOConline e variantes). */
const COLUNAS: { k: keyof LinhaPendente; re: RegExp }[] = [
  { k: "nif", re: /\b(nif|contribuinte|n\.? ?contrib)/ },
  { k: "vencimento", re: /venc/ },
  { k: "em_aberto", re: /(pendente|em aberto|por pagar|em divida|saldo|por liquidar|valor em falta)/ },
  { k: "numero", re: /(documento|n\.?º? ?doc|numero|n\.?º fatura|fatura|^doc)/ },
  { k: "data", re: /^(data|data doc|data documento|data de emissao|emissao)/ },
  { k: "valor", re: /(total|valor|montante)/ },
  { k: "nome", re: /(nome|cliente|entidade|terceiro)/ },
];

function data(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())).toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * 864e5).toISOString().slice(0, 10);
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
function numero(v: unknown): number {
  if (typeof v === "number") return v;
  let s = String(v ?? "").replace(/[€\s]/g, "");
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export type Leitura = { linhas: LinhaPendente[]; colunas: Partial<Record<keyof LinhaPendente, string>>; avisos: string[]; erro?: string };

/** Lê .xlsx, .xls ou .csv: encontra a linha de títulos, reconhece as colunas e normaliza cada linha. */
export function lerPendentes(buf: Buffer): Leitura {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
  // Linha de títulos = a primeira, nas 30 primeiras, que reconhece pelo menos 3 colunas
  let cab = -1; let mapa: Partial<Record<keyof LinhaPendente, number>> = {};
  for (let i = 0; i < Math.min(30, rows.length); i++) {
    const m: Partial<Record<keyof LinhaPendente, number>> = {};
    rows[i].forEach((c, j) => {
      const t = norm(c);
      if (!t) return;
      const col = COLUNAS.find((x) => m[x.k] === undefined && x.re.test(t));
      if (col) m[col.k] = j;
    });
    if (Object.keys(m).length >= 3) { cab = i; mapa = m; break; }
  }
  if (cab < 0) return { linhas: [], colunas: {}, avisos: [], erro: "Não encontrei a linha de títulos (ex.: Documento, Data, Vencimento, Valor, Pendente)." };
  if (mapa.numero === undefined) return { linhas: [], colunas: {}, avisos: [], erro: "Falta a coluna do número do documento." };
  if (mapa.nif === undefined && mapa.nome === undefined) return { linhas: [], colunas: {}, avisos: [], erro: "Falta a coluna do NIF ou do nome do cliente." };
  const colunas = Object.fromEntries(Object.entries(mapa).map(([k, j]) => [k, String(rows[cab][j as number])])) as Leitura["colunas"];
  const avisos: string[] = [];
  if (mapa.em_aberto === undefined) avisos.push("Sem coluna de valor pendente: usei o valor total de cada documento.");
  const linhas: LinhaPendente[] = [];
  for (const r of rows.slice(cab + 1)) {
    const num = String(r[mapa.numero] ?? "").trim();
    if (!num || /^total/i.test(num)) continue;
    const valor = mapa.valor !== undefined ? numero(r[mapa.valor]) : 0;
    const aberto = mapa.em_aberto !== undefined ? numero(r[mapa.em_aberto]) : valor;
    const nifTxt = mapa.nif !== undefined ? String(r[mapa.nif] ?? "").replace(/\D/g, "") : "";
    linhas.push({
      numero: num, nif: /^\d{9}$/.test(nifTxt) ? nifTxt : null,
      nome: mapa.nome !== undefined ? String(r[mapa.nome] ?? "").trim() || null : null,
      data: mapa.data !== undefined ? data(r[mapa.data]) : null,
      vencimento: mapa.vencimento !== undefined ? data(r[mapa.vencimento]) : null,
      valor: valor || aberto, em_aberto: aberto,
    });
  }
  if (!linhas.length) return { linhas, colunas, avisos, erro: "O ficheiro não tem documentos depois da linha de títulos." };
  return { linhas, colunas, avisos };
}
