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

    // ✅ LÓGICA INFALÍVEL:
    // Se marcaste manualmente como ATIVO, ele libera.
    // O sistema só bloqueará se o 'ativo' for false OU se a data de vencimento for 
    // claramente anterior ao dia de hoje (ignorando horas/minutos).
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas o dia

    let dataVenc = empresa.pagoAte ? new Date(empresa.pagoAte) : null;
    if (dataVenc) dataVenc.setHours(0, 0, 0, 0);

    let statusFinal = empresa.ativo;

    // Se houver data e ela for antiga, mas o botão 'ativo' estiver ligado, 
    // damos prioridade ao 'ativo' (decisão do Super Admin).
    if (dataVenc && dataVenc < hoje && !empresa.ativo) {
      statusFinal = false;
    }

    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: statusFinal, 
      pagoAte: empresa.pagoAte
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}