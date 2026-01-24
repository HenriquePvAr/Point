import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // ✅ IMPORTANTE: Se o seu banco não tiver "onDelete: Cascade", 
    // o Prisma vai dar erro se a empresa tiver usuários ou pontos.
    // Esta ordem garante a exclusão de tudo:
    
    await prisma.$transaction([
      // 1. Apaga os pontos dos usuários desta empresa
      prisma.ponto.deleteMany({ where: { usuario: { empresaId: id } } }),
      
      // 2. Apaga os usuários desta empresa
      prisma.usuario.deleteMany({ where: { empresaId: id } }),
      
      // 3. Apaga os pagamentos desta empresa
      prisma.pagamento.deleteMany({ where: { empresaId: id } }),
      
      // 4. Por fim, apaga a empresa
      prisma.empresa.delete({ where: { id: id } })
    ]);

    return NextResponse.json({ success: true, message: "Empresa e dados excluídos com sucesso" });

  } catch (error) {
    console.error("Erro ao excluir empresa:", error);
    return NextResponse.json({ 
      error: "Erro ao excluir", 
      detalhes: error.message 
    }, { status: 500 });
  }
}