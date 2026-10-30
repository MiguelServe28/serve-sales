import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP = "sales";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next(); // modo demonstração

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const caminho = request.nextUrl.pathname;
  if (caminho.startsWith("/auth/")) return response;
  const { data: { user } } = await supabase.auth.getUser();
  const emLogin = caminho.startsWith("/login");
  const plataforma = process.env.NEXT_PUBLIC_URL_PLATAFORMA;
  if (!user && !emLogin) {
    // Entra-se sempre pela Plataforma SERVE: ela devolve o utilizador já com sessão.
    if (plataforma) {
      const ir = new URL("/api/ir", plataforma);
      ir.searchParams.set("app", APP);
      if (caminho !== "/") ir.searchParams.set("p", caminho + request.nextUrl.search);
      return NextResponse.redirect(ir);
    }
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    return NextResponse.redirect(destino);
  }
  if (user && emLogin) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return NextResponse.redirect(destino);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
