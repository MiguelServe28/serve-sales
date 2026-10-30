import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Entrada automática vinda da Plataforma SERVE: troca o link de uso único por uma sessão nesta app. */
export async function GET(req: NextRequest) {
  const th = req.nextUrl.searchParams.get("th");
  const p = req.nextUrl.searchParams.get("p");
  const destino = new URL(p && p.startsWith("/") && !p.startsWith("//") ? p : "/", req.url);
  if (!th) return NextResponse.redirect(new URL("/login", req.url));
  const sb = await supabaseServer();
  const { error } = await sb.auth.verifyOtp({ type: "magiclink", token_hash: th });
  if (error) return NextResponse.redirect(new URL("/login?erro=link", req.url));
  return NextResponse.redirect(destino);
}
