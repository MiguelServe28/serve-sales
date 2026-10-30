import LoginForm from "@/components/LoginForm";

export default function Login() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <img src="/logo-serve-branco.png" alt="SERVE" className="h-9 w-auto self-start" />
        <div>
          <p className="eyebrow mb-3">Plataforma interna</p>
          <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">SERVE Sales: pendentes e cobranças, com o mesmo login da Plataforma.</h1>
          <p className="mt-4 max-w-md text-sm text-white/60">Larga os PDFs, confirma e envia. O mesmo login da Plataforma SERVE.</p>
        </div>
        <p className="text-xs text-white/40">SERVE · Serviços de Contabilidade e Viabilização Empresarial, Lda.</p>
      </div>
      <div className="flex items-center justify-center bg-fundo p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">Entrar</h2>
          <p className="mb-6 mt-1 text-sm text-cinza">Use o email e a palavra-passe da sua conta SERVE.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
