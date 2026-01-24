import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Garante que não faz cache

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        _count: {
          select: { usuarios: true }, // Conta quantos funcionários
        },
        pagamentos: {
          select: { status: true }, // Busca apenas o status para contarmos manualmente
        },
      },
    });

    // Formata os dados para o front-end
    const dadosFormatados = empresas.map((emp) => {
      const parcelasPagas = emp.pagamentos.filter(
        (p) => p.status === "PAID" || p.status === "CONFIRMED"
      ).length;

      return {
        id: emp.id,
        nome: emp.nome,
        cnpj: emp.cnpj,
        ativo: emp.ativo,
        plano: emp.plano,
        pagoAte: emp.pagoAte,
        totalUsuarios: emp._count.usuarios,
        parcelasPagas: parcelasPagas,
      };
    });

    return NextResponse.json(dadosFormatados);
  } catch (error) {
    console.error("Erro ao listar empresas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}