import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pinguim Manoa - Point",
  description: "Sistema de Gestão de Ponto",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        {/* FORÇAR VIEWPORT MANUALMENTE */}
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