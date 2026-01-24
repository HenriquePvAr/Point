import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // ✅ O segredo está aqui: buscar na tabela EMPRESA
    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    // Devolve os dados REAIS do banco de dados (ativo e pagoAte)
    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: empresa.ativo, // Este é o campo que o teu AdminPage usa
      pagoAte: empresa.pagoAte,
      plano: empresa.plano
    });

  } catch (error) {
    console.error("Erro na API empresa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}