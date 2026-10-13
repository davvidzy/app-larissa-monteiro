import { useEffect, useRef, useState } from "react";
import { BookOpen, House, type LucideIcon, Wrench } from "lucide-react";
import { AccessGate } from "./components/AccessGate";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { Materials } from "./components/Materials";
import { PdfViewer } from "./components/PdfViewer";
import { Tools } from "./components/Tools";
import { brand, materials } from "./config/portal";
import { clearAccess, readAccess } from "./lib/access";

type TabId = "inicio" | "estudar" | "ferramentas";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "inicio", label: "Início", icon: House },
  { id: "estudar", label: "Estudar", icon: BookOpen },
  { id: "ferramentas", label: "Ferramentas", icon: Wrench },
];

/* A navegação fica no endereço (#estudar/kit-completo, #ferramentas/precificacao…): dá para mandar
   o link direto de uma seção, e o "voltar" do celular fecha o PDF em vez de sair do portal. */
type Route = { tab: TabId; item?: string };

function parseRoute(): Route {
  const [tab, item] = window.location.hash.slice(1).split("/");
  return tabs.some((t) => t.id === tab) ? { tab: tab as TabId, item: item || undefined } : { tab: "inicio" };
}

function findReadable(route: Route) {
  return route.tab === "estudar" ? materials.find((m) => m.id === route.item && m.file) : undefined;
}

export default function App() {
  const [email, setEmail] = useState(readAccess);
  const [route, setRoute] = useState(parseRoute);
  /** O PDF foi aberto por um clique aqui dentro (e não por um link direto)? */
  const openedInApp = useRef(false);

  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute();
      if (findReadable(next)) openedInApp.current = true;
      setRoute(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Nova seção começa do topo (abrir o PDF não mexe na rolagem da lista)
  const reading = findReadable(route);
  const scrollKey = reading ? null : `${route.tab}/${route.item ?? ""}`;
  useEffect(() => {
    if (scrollKey) window.scrollTo(0, 0);
  }, [scrollKey]);

  if (!email) return <AccessGate onAccess={setEmail} />;

  function closeReader() {
    if (openedInApp.current) {
      openedInApp.current = false;
      history.back();
    } else {
      history.replaceState(null, "", "#estudar");
      setRoute({ tab: "estudar" });
    }
  }

  const content = {
    inicio: <Home />,
    estudar: <Materials />,
    ferramentas: <Tools item={route.item} />,
  }[route.tab];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        email={email}
        onLogout={() => {
          clearAccess();
          setEmail(null);
        }}
      />

      <div className="bg-[linear-gradient(135deg,#FFF6FA_0%,#F6D0E0_55%,#FBF5E9_100%)]">
        <div className="mx-auto max-w-[1080px] px-4 pt-8 md:px-8 md:pt-10">
          <p className="text-[12px] font-bold tracking-[0.14em] text-primary">ÁREA DA ALUNA</p>
          <h1 className="mt-1 font-display text-[38px] leading-[1.08] font-semibold tracking-[-0.02em] text-[#301827] md:text-[48px]">
            {brand.product}
          </h1>

          <nav aria-label="Seções" className="mt-6 flex gap-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = id === route.tab;
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-t-[14px] px-3 text-[14px] font-bold transition-colors sm:px-4 ${
                    active ? "bg-[#FCFAFB] text-primary" : "text-ink-soft hover:bg-white/50 hover:text-primary"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-8 md:px-8 md:py-10">{content}</main>

      <footer className="border-t border-line bg-surface px-4 py-6 text-center text-[13px] text-ink-soft">
        © {new Date().getFullYear()} {brand.name}. Material de uso pessoal, proibida a revenda ou distribuição.
        {brand.support && <span className="mt-1 block">Dúvidas: {brand.support}</span>}
      </footer>

      {reading && <PdfViewer key={reading.id} material={reading} onClose={closeReader} />}
    </div>
  );
}
