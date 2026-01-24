import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // Como o ID é STRING, usamos diretamente sem Number()
    const empresa = await prisma.empresa.findUnique({
      where: { id: id },
    });

    if (!empresa) {
      console.error(`Empresa com ID ${id} não encontrada no banco.`);
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Retorna os dados garantindo que o 'ativo' seja um booleano puro
    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo === true, 
      pagoAte: empresa.pagoAte,
      plano: empresa.plano
    });

  } catch (error) {
    console.error("ERRO CRÍTICO NA API EMPRESA:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor", detalhes: error.message }, 
      { status: 500 }
    );
  }
}