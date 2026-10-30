import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        laranja: { DEFAULT: "#F86808", claro: "#FBDCC6", suave: "#FFF4EC" },
        navy: { DEFAULT: "#1B2431", 2: "#253044" },
        tinta: "#111827",
        corpo: "#3F4854",
        cinza: "#6B7280",
        filete: "#E3E7EC",
        fundo: "#F8F9FB",
        banda: "#F0F2F5",
      },
      boxShadow: { card: "0 1px 2px rgba(17,24,39,.04), 0 1px 3px rgba(17,24,39,.06)" },
    },
  },
  plugins: [],
} satisfies Config;
