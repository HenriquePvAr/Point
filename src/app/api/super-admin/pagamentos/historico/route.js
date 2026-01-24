import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get("empresaId");

    if (!empresaId) {
      return NextResponse.json({ error: "ID da empresa não fornecido" }, { status: 400 });
    }

    // Busca os pagamentos da empresa que foram pagos ou confirmados
    // Ajuste os nomes dos campos ('empresaId', 'status', 'valor') de acordo com seu schema.prisma
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        empresaId: empresaId,
        status: {
          in: ["PAID", "RECEIVED", "CONFIRMED"] // Filtra apenas os que entraram dinheiro
        }
      },
      orderBy: {
        criadoEm: "desc" // Ou 'dataPagamento', dependendo do seu banco
      },
      select: {
        valor: true,
        criadoEm: true, // Renomeado para 'data' no retorno para bater com o front
        metodo: true,   // Ex: PIX, CREDIT_CARD
        status: true
      }
    });

    // Formata para o padrão que o modal do seu Painel Master espera
    const historicoFormatado = pagamentos.map(p => ({
      valor: p.valor,
      data: p.criadoEm,
      metodo: p.metodo || "PIX"
    }));

    return NextResponse.json(historicoFormatado);

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}