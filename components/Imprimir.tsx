"use client";

import { Printer } from "lucide-react";

export default function Imprimir() {
  return <button type="button" onClick={() => window.print()} className="btn-ghost print:hidden"><Printer size={14} />Imprimir / PDF</button>;
}
