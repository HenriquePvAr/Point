import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { empresaId, meses } = await request.json();

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ success: false, message: "Empresa não encontrada" }, { status: 404 });
    }

    const hoje = new Date();
    // Se já tem data futura, soma a partir dela. Se já venceu, soma a partir de hoje.
    let baseDate = empresa.pagoAte && new Date(empresa.pagoAte) > hoje 
      ? new Date(empresa.pagoAte) 
      : hoje;

    // Adiciona os meses escolhidos
    baseDate.setMonth(baseDate.getMonth() + parseInt(meses));

    const atualizado = await prisma.empresa.update({
      where: { id: empresaId },
      data: { 
        pagoAte: baseDate,
        ativo: true // Garante que reativa se estiver bloqueado por falta de pagto
      },
    });

    return NextResponse.json({ success: true, novaData: baseDate });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Erro ao renovar." }, { status: 500 });
  }
}