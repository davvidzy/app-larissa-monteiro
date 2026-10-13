import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Portal da aluna (entregável). Publicado no subdomínio (ex.: membros.seudominio.com.br).
export default defineConfig({
  // Caminhos relativos no build: funciona na raiz do subdomínio ou em subpasta
  base: "./",
  plugins: [react(), tailwindcss()],
});
