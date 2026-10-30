import "server-only";
import { cache } from "react";
import { supabaseServer, temSupabase } from "./supabase/server";

export type Sessao = {
  userId: string | null; email: string | null; nome: string | null;
  admin: boolean; modulos: string[]; equipaId: string | null; demo: boolean;
};

const adminsPorEmail = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const getSessao = cache(async (): Promise<Sessao> => {
  if (!temSupabase) return { userId: null, email: "demo", nome: "Demonstração", admin: true, modulos: ["contabilidade", "fiscal", "laboral", "rh", "sales"], equipaId: null, demo: true };
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return { userId: null, email: null, nome: null, admin: false, modulos: [], equipaId: null, demo: false };
  const email = (user.email ?? "").toLowerCase();
  const [{ data: perfil }, { data: eq }] = await Promise.all([
    sb.from("perfis").select("nome,role,modulos,equipa_id").eq("id", user.id).maybeSingle(),
    sb.from("equipa").select("id,email"),
  ]);
  const admin = perfil?.role === "admin" || adminsPorEmail().includes(email);
  const equipaId = (perfil?.equipa_id as string | null) ?? (eq ?? []).find((e) => (e.email ?? "").toLowerCase() === email)?.id ?? null;
  return {
    userId: user.id, email: user.email ?? null, nome: perfil?.nome || null, admin,
    modulos: admin ? ["contabilidade", "fiscal", "laboral", "rh", "sales"] : ((perfil?.modulos as string[] | null) ?? []), equipaId, demo: false,
  };
});

export function podeAceder(s: Sessao, modulo: string) {
  return s.admin || s.modulos.includes(modulo);
}
