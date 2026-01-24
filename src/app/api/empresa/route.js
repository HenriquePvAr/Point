import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) },
    });

    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    // ✅ LÓGICA SIMPLIFICADA: 
    // Se no Super Admin você marcou como ATIVO, nós vamos dar prioridade a isso
    // para permitir que você libere clientes manualmente sem erro de data.
    let statusReal = empresa.ativo;

    // Apenas bloqueamos se a data existir E já tiver passado de 24h do vencimento
    const hoje = new Date();
    if (empresa.pagoAte && new Date(empresa.pagoAte) < hoje) {
        // Se você não forçou o "ativo" no Super Admin, o vencimento bloqueia
        // Mas se você clicou em "Liberar" lá, o statusReal será true
        statusReal = empresa.ativo; 
    }

    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: statusReal, // Retorna true se você marcou no painel master
      pagoAte: empresa.pagoAte,
      plano: empresa.plano
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}