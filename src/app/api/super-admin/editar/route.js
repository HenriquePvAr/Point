import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  try {
    // ✅ O await deve estar obrigatoriamente dentro da função async
    const body = await request.json();
    const { id, nome, cnpj } = body;

    if (!id) {
      return NextResponse.json({ error: "ID da empresa é obrigatório" }, { status: 400 });
    }

    // Atualiza os dados na tabela Empresa
    const empresaAtualizada = await prisma.empresa.update({
      where: { 
        id: id // Como seu ID é String/UUID, não usamos Number()
      },
      data: {
        nome: nome,
        cnpj: cnpj
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Empresa atualizada com sucesso",
      empresa: empresaAtualizada 
    });

  } catch (error) {
    console.error("Erro ao editar empresa:", error);
    
    // Tratamento para caso a empresa não exista
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Empresa não encontrada no banco" }, { status: 404 });
    }

    return NextResponse.json({ 
      error: "Erro interno no servidor", 
      detalhes: error.message 
    }, { status: 500 });
  }
}