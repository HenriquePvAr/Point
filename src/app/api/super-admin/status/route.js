import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request) {
  try {
    const { empresaId, ativo } = await request.json();

    const atualizado = await prisma.empresa.update({
      where: { id: empresaId },
      data: { ativo: ativo }, // true ou false
    });

    return NextResponse.json({ success: true, empresa: atualizado });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Erro ao atualizar status." },
      { status: 500 }
    );
  }
}