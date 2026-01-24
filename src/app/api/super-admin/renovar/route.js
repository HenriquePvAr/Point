import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { empresaId, dias } = await request.json();

    if (!empresaId) {
      return NextResponse.json({ success: false, message: "ID da empresa é obrigatório" }, { status: 400 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json({ success: false, message: "Empresa não encontrada" }, { status: 404 });
    }

    const hoje = new Date();
    
    // LÓGICA DE DATA FLEXÍVEL:
    // 1. Se a empresa tem data futura, usamos essa data como base.
    // 2. Se a data é passada ou nula, usamos HOJE como base.
    let baseDate = empresa.pagoAte && new Date(empresa.pagoAte) > hoje 
      ? new Date(empresa.pagoAte) 
      : hoje;

    // Adiciona ou subtrai a quantidade exata de dias
    baseDate.setDate(baseDate.getDate() + parseInt(dias));

    // Garante que a empresa fique 'ativa' se a nova data for futura
    const estaAtivo = baseDate > hoje;

    const atualizado = await prisma.empresa.update({
      where: { id: empresaId },
      data: { 
        pagoAte: baseDate,
        ativo: estaAtivo 
      },
    });

    return NextResponse.json({ 
      success: true, 
      novaData: baseDate,
      ativo: estaAtivo 
    });

  } catch (error) {
    console.error("Erro na renovação master:", error);
    return NextResponse.json({ success: false, message: "Erro ao processar renovação." }, { status: 500 });
  }
}