import "server-only";
import { hojeISO } from "./dates";
import { dividas } from "./cobrancas";
import { getDefinicoes, listCargas, listClientes, listContactos, listEquipa, listFaturas } from "./dados";

/** Tudo o que as páginas precisam, de uma vez. */
export async function carregar() {
  const hoje = hojeISO();
  const [faturas, contactos, clientes, equipa, defs, cargas] = await Promise.all([listFaturas(), listContactos(), listClientes(), listEquipa(), getDefinicoes(), listCargas()]);
  const lista = dividas(faturas, contactos, clientes, defs, hoje);
  const nomeEq = (id: string | null | undefined) => equipa.find((e) => e.id === id)?.nome ?? "—";
  return { hoje, faturas, contactos, clientes, equipa, defs, cargas, lista, nomeEq };
}
