import { LogOut } from "lucide-react";
import { brand } from "../config/portal";

type Props = { email: string; onLogout: () => void };

export function Header({ email, onLogout }: Props) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <img src={brand.logo} alt={brand.name} width={274} height={60} className="h-auto w-[150px] md:w-[180px]" />
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden truncate text-[14px] text-ink-soft sm:block" title={email}>
            {email}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-button px-3 text-[14px] font-medium text-ink-soft hover:bg-blush hover:text-primary"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
