import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Essencial para evitar o erro de "Dynamic server usage" na Vercel
// Isso força a rota a ser renderizada no servidor a cada requisição
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // Busca os dados diretamente da tabela Empresa para garantir que o 
    // status 'ativo' e 'pagoAte' estejam sempre atualizados com o banco
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Retorna os dados reais para o AdminPage processar o desbloqueio
    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo,    // Campo usado para liberar o Dashboard
      pagoAte: empresa.pagoAte, // Data de validade da assinatura
      plano: empresa.plano
    });

  } catch (error) {
    console.error("Erro na API empresa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}