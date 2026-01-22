import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

// 1. Configurações de SEO (Título da aba e descrição)
export const metadata = {
  title: "Pinguim Manoa - Point",
  description: "Sistema de Gestão de Ponto",
};

// 2. CORREÇÃO DO ZOOM NO CELULAR (Viewport)
// Sem isso, o celular renderiza o site como se fosse um desktop pequeno.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede o zoom com pinça (opcional, dá sensação de App)
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}