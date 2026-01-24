import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID faltante" }, { status: 400 });

    const empresa = await prisma.empresa.findUnique({
      where: { id: Number(id) },
    });

    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    // ✅ LÓGICA DE DESTRAVAMENTO:
    // Se você marcou 'ativo' no Super Admin, nós ignoramos a data para permitir o acesso manual.
    // O sistema só bloqueia se 'ativo' for false.
    const statusFinal = empresa.ativo === true;

    return NextResponse.json({
      id: empresa.id,
      nome: empresa.nome,
      ativo: statusFinal, 
      pagoAte: empresa.pagoAte, // Mesmo que seja null, o 'ativo' manda
      plano: empresa.plano
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}