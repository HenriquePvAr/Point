import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pinguim Manoa - Point",
  description: "Sistema de Gestão de Ponto",
};

// REMOVEMOS O 'export const viewport' DAQUI PARA NÃO DAR CONFLITO
// VAMOS INJETAR DIRETO NO HTML ABAIXO

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        {/* === AQUI ESTÁ A SOLUÇÃO FORÇADA === */}
        {/* Escrevendo a tag manualmente, o navegador é obrigado a ler isso antes de tudo */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}