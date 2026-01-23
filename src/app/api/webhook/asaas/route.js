import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  // Segurança básica: Verificar token do Asaas no header se configurado
  const body = await req.json();

  if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
    const asaasId = body.payment.id;
    const valor = body.payment.value;
    
    // 1. Achar o pagamento pendente no seu banco pelo ID do Asaas
    // (Você teria criado esse registro quando gerou o Pix/Boleto)
    const pagamento = await prisma.pagamento.findFirst({
        where: { asaasId: asaasId }
    });

    if (pagamento) {
        // 2. Atualizar status do pagamento
        await prisma.pagamento.update({
            where: { id: pagamento.id },
            data: { status: 'PAID', dataPagamento: new Date() }
        });

        // 3. Renovar a assinatura da empresa
        const diasAdicionais = pagamento.valor > 1000 ? 365 : 30; // Lógica simples baseada no plano
        const empresa = await prisma.empresa.findUnique({ where: { id: pagamento.empresaId }});
        
        let novaData = new Date();
        if (empresa.pagoAte && empresa.pagoAte > new Date()) {
            novaData = new Date(empresa.pagoAte); // Soma à data existente se ainda não venceu
        }
        
        novaData.setDate(novaData.getDate() + diasAdicionais);

        await prisma.empresa.update({
            where: { id: pagamento.empresaId },
            data: { 
                ativo: true,
                pagoAte: novaData
            }
        });
    }
  }

  return NextResponse.json({ received: true });
}