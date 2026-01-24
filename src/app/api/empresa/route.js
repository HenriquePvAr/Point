import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Força a rota a ser dinâmica e ignora qualquer cache da Vercel/Next.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // Busca os dados diretamente da tabela Empresa
    // Usamos findUnique para garantir performance e precisão
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Lógica de segurança extra: se a data de validade venceu, 
    // forçamos o 'ativo' a ser false mesmo que no banco esteja true.
    const hoje = new Date();
    const dataVencimento = empresa.pagoAte ? new Date(empresa.pagoAte) : null;
    
    // Se não tem data ou a data já passou, considera inativo
    const statusReal = empresa.ativo && dataVencimento && dataVencimento > hoje;

    // Retorna os dados limpos para o AdminPage
    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: Boolean(statusReal), // Garante que o front receba true/false real
      pagoAte: empresa.pagoAte,
      plano: empresa.plano
    });

  } catch (error) {
    console.error("Erro crítico na API empresa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}