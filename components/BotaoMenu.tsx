"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";

/** Recolhe ou abre o menu lateral; a escolha fica guardada num cookie (vale para esta plataforma). */
export default function BotaoMenu({ inicial }: { inicial: boolean }) {
  const [recolhido, setRecolhido] = useState(inicial);
  const alternar = () => {
    const novo = !recolhido;
    setRecolhido(novo);
    const raiz = document.querySelector("[data-menu-raiz]");
    if (novo) raiz?.setAttribute("data-menu", "recolhido"); else raiz?.removeAttribute("data-menu");
    document.cookie = `menu=${novo ? "recolhido" : "aberto"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button type="button" onClick={alternar} title={recolhido ? "Abrir o menu" : "Esconder o menu"} aria-label={recolhido ? "Abrir o menu" : "Esconder o menu"}
      className="absolute -right-3 top-8 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-filete bg-white text-cinza shadow hover:text-laranja">
      {recolhido ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
    </button>
  );
}
