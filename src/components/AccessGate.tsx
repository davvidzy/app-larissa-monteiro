import { type FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { brand } from "../config/portal";
import { isValidEmail, saveAccess } from "../lib/access";
import { Button } from "./ui/Button";

type Props = { onAccess: (email: string) => void };

export function AccessGate({ onAccess }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Confira o e-mail digitado. Use o mesmo e-mail da sua compra.");
      return;
    }
    saveAccess(email);
    onAccess(email.trim().toLowerCase());
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[linear-gradient(135deg,#FFF6FA_0%,#F6D0E0_55%,#FBF5E9_100%)] px-4 py-10">
      <div className="w-full max-w-[440px] rounded-[28px] border border-line bg-surface p-6 shadow-card md:p-9">
        <img src={brand.logo} alt={brand.name} width={274} height={60} className="mx-auto h-auto w-[200px]" />

        <h1 className="mt-7 text-center font-display text-[34px] leading-[1.1] font-semibold tracking-[-0.02em] text-[#301827]">
          Boas-vindas à sua área de aluna
        </h1>
        <p className="mt-3 text-center text-[15px] text-ink-soft">
          Digite o e-mail que você usou na compra do {brand.product} para acessar seus materiais.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-7">
          <label htmlFor="email" className="block text-[14px] font-bold text-ink">
            Seu e-mail
          </label>
          <div className="mt-1.5 flex min-h-12 items-center gap-2 rounded-[10px] border border-[#B7A7AF] bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light">
            <Mail aria-hidden="true" className="size-5 shrink-0 text-ink-soft" strokeWidth={1.75} />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "email-error" : undefined}
              className="w-full min-w-0 bg-transparent py-2 text-[16px] text-ink outline-none"
            />
          </div>
          {error && (
            <p id="email-error" role="alert" className="mt-2 text-[14px] font-medium text-error">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth className="mt-5">
            Acessar meus materiais
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-ink-soft">
          O acesso fica salvo neste aparelho. Em outro celular ou computador, é só digitar o e-mail de novo.
        </p>
      </div>
    </main>
  );
}
