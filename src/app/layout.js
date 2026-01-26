import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pinguim Manoa - Point",
  description: "Sistema de Gestão de Ponto",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Point",
    statusBarStyle: "default",
  },
};

// ✅ FORMA CORRETA: Next.js usa isso para gerar a tag <meta name="viewport">
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Impede zoom de pinça (comportamento de App)
  themeColor: "#1351b4",
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